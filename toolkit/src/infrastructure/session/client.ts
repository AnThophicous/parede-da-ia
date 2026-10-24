import { spawn } from 'node:child_process';
import { openSync, readFileSync } from 'node:fs';
import http from 'node:http';
import { dirname, join } from 'node:path';
import type { BrowserSession } from '../../application/ports.js';
import { ParedeError } from '../../domain/errors.js';
import { ensureDir, logFilePath, SESSION_NAME, TOOLKIT_ROOT } from './paths.js';
import { readSession, removeSession, type SessionInfo } from './session.js';

type RpcResponse<T> = { ok: true; result: T } | { ok: false; error: { code: string; message: string; hint?: string } };

const noSession = (detail = 'Nenhuma sessão de navegador ativa.') =>
  new ParedeError('NO_SESSION', detail, 'Rode `web-url-fetch <url>` para abrir uma página primeiro.');

function post<T>(session: SessionInfo, body: unknown, timeoutMs = 0): Promise<RpcResponse<T>> {
  return new Promise((resolve, reject) => {
    const data = Buffer.from(JSON.stringify(body));
    const req = http.request(
      {
        host: '127.0.0.1',
        port: session.port,
        path: '/rpc',
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': data.length,
          'x-parede-token': session.token,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')) as RpcResponse<T>);
          } catch {
            reject(new ParedeError('PROTOCOL', `Resposta inválida do daemon (HTTP ${res.statusCode}).`));
          }
        });
      },
    );
    if (timeoutMs > 0) req.setTimeout(timeoutMs, () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.end(data);
  });
}

/** Chamada RPC ao daemon da sessão atual. Sem timeout: gravações longas são legítimas. */
export async function rpc<T = unknown>(method: string, params: object = {}): Promise<T> {
  const session = readSession();
  if (!session) throw noSession();
  let response: RpcResponse<T>;
  try {
    response = await post<T>(session, { method, params });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ECONNREFUSED' || code === 'ECONNRESET') {
      removeSession(session.pid);
      throw noSession('A sessão anterior foi encerrada (daemon fora do ar).');
    }
    throw err;
  }
  if (!response.ok) throw new ParedeError(response.error.code, response.error.message, response.error.hint);
  return response.result;
}

export async function isAlive(session: SessionInfo): Promise<boolean> {
  try {
    const res = await post(session, { method: 'health' }, 2000);
    return res.ok;
  } catch {
    return false;
  }
}

function tail(file: string, lines = 15): string {
  try {
    return readFileSync(file, 'utf8').trim().split('\n').slice(-lines).join('\n');
  } catch {
    return '';
  }
}

/** Garante um daemon vivo para a sessão atual, iniciando-o em background se preciso. */
export async function ensureDaemon(): Promise<SessionInfo> {
  const existing = readSession();
  if (existing && (await isAlive(existing))) return existing;
  if (existing) removeSession();

  const logFile = logFilePath();
  ensureDir(dirname(logFile));
  const out = openSync(logFile, 'a');
  const entry = join(TOOLKIT_ROOT, 'dist', 'daemon.js');
  const child = spawn(process.execPath, [entry], {
    detached: true,
    stdio: ['ignore', out, out],
    windowsHide: true,
    env: { ...process.env, PAREDE_SESSION: SESSION_NAME },
  });
  let exitCode: number | null = null;
  child.on('exit', (code) => (exitCode = code ?? 1));
  child.unref();

  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 150));
    if (exitCode !== null) {
      throw new ParedeError('DAEMON_FAILED', `O daemon terminou ao iniciar (código ${exitCode}).`, tail(logFile) || undefined);
    }
    const session = readSession();
    if (session && session.pid === child.pid && (await isAlive(session))) return session;
  }
  throw new ParedeError('DAEMON_TIMEOUT', 'O daemon não respondeu em 20s.', `Veja o log: ${logFile}`);
}

/** Adaptador da porta BrowserSession: RPC HTTP local para o daemon Playwright. */
export const rpcSession: BrowserSession = {
  ensure: async () => {
    await ensureDaemon();
  },
  active: () => readSession() !== null,
  call: rpc,
  describe: () => {
    const s = readSession();
    return s ? { name: s.name, pid: s.pid, port: s.port, log: logFilePath(s.name) } : null;
  },
};
