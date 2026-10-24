import { randomBytes } from 'node:crypto';
import http from 'node:http';
import type { Action } from './domain/actions.js';
import { toParedeError } from './domain/errors.js';
import { SESSION_NAME, VERSION } from './infrastructure/session/paths.js';
import { removeSession, writeSession } from './infrastructure/session/session.js';
import { BrowserManager, type OpenOptions } from './infrastructure/browser/manager.js';
import { runActions } from './infrastructure/browser/control.js';
import { recordFrames, type RecordParams } from './infrastructure/browser/recorder.js';
import { scrap } from './infrastructure/browser/scrap.js';
import { takeScreenshot, type ScreenshotParams } from './infrastructure/browser/screenshot.js';
import { waitForSelector, waitPageLoad } from './infrastructure/browser/wait.js';
import { analyzeMotion, type MotionParams } from './infrastructure/browser/motion.js';
import { testInteractions, type InteractionsParams } from './infrastructure/browser/interactions.js';
import { runAudit, type AuditParams } from './infrastructure/browser/audit.js';
import { evaluateExpression } from './infrastructure/browser/evaluate.js';

/**
 * COMPOSITION ROOT do daemon: liga os casos de uso de navegador (infrastructure/browser)
 * a um servidor RPC local. Um único Chromium vivo entre chamadas da CLI/MCP.
 * Escuta só em 127.0.0.1, exige token e recusa requisições com Origin (browsers).
 */
const IDLE_MS = Number(process.env.PAREDE_IDLE_MINUTES ?? 30) * 60_000;
const token = randomBytes(24).toString('hex');
const manager = new BrowserManager();
let lastActivity = Date.now();
let inFlight = 0;
let shuttingDown = false;

const log = (...args: unknown[]) => console.log(new Date().toISOString(), ...args);

type Handler = (params: any) => Promise<unknown>; // eslint-disable-line @typescript-eslint/no-explicit-any

const handlers: Record<string, Handler> = {
  health: async () => ({ pid: process.pid, session: SESSION_NAME, version: VERSION, url: manager.page && !manager.page.isClosed() ? manager.page.url() : null }),
  open: (p: OpenOptions) => manager.open(p),
  waitLoad: (p: { timeoutMs: number }) => waitPageLoad(manager, p.timeoutMs),
  waitFor: (p: { selector: string; state: 'hidden' | 'visible'; timeoutMs: number }) => waitForSelector(manager, p.selector, p.state, p.timeoutMs),
  control: (p: { actions: Action[] }) => runActions(manager, p.actions),
  screenshot: (p: ScreenshotParams) => takeScreenshot(manager, p),
  record: (p: RecordParams) => recordFrames(manager, p),
  scrap: (p: { maxElements: number }) => scrap(manager, p.maxElements),
  motion: (p: MotionParams) => analyzeMotion(manager, p),
  interactions: (p: InteractionsParams) => testInteractions(manager, p),
  audit: (p: AuditParams) => runAudit(manager, p),
  eval: (p: { expression: string }) => evaluateExpression(manager, p.expression),
  state: () => manager.state(),
  logs: async (p: { limit: number }) => (await manager.consoleEntries()).slice(-(p.limit || 50)),
  close: async () => {
    setImmediate(() => void shutdown('close solicitado'));
    return { closed: true };
  },
};

async function shutdown(reason: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  log('encerrando:', reason);
  removeSession(process.pid);
  await manager.close();
  server.close();
  process.exit(0);
}

function send(res: http.ServerResponse, status: number, body: unknown) {
  const data = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(data) });
  res.end(data);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/rpc') return send(res, 404, { ok: false, error: { code: 'NOT_FOUND', message: 'rota inválida' } });
  if (req.headers.origin) return send(res, 403, { ok: false, error: { code: 'FORBIDDEN', message: 'origem não permitida' } });
  if (req.headers['x-parede-token'] !== token) return send(res, 403, { ok: false, error: { code: 'FORBIDDEN', message: 'token inválido' } });

  const chunks: Buffer[] = [];
  req.on('data', (c: Buffer) => chunks.push(c));
  req.on('end', async () => {
    lastActivity = Date.now();
    inFlight++;
    let method = '?';
    try {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
      method = body.method;
      const handler = handlers[method];
      if (!handler) throw Object.assign(new Error(`método desconhecido: ${method}`), { code: 'BAD_METHOD' });
      const result = await handler(body.params ?? {});
      send(res, 200, { ok: true, result });
    } catch (err) {
      const e = toParedeError(err);
      if (method !== 'health') log(`erro em ${method}:`, e.message);
      send(res, 200, { ok: false, error: e.toJSON() });
    } finally {
      inFlight--;
      lastActivity = Date.now();
    }
  });
});
server.requestTimeout = 0;
server.headersTimeout = 60_000;

server.listen(0, '127.0.0.1', () => {
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  writeSession({ name: SESSION_NAME, port, token, pid: process.pid, startedAt: new Date().toISOString(), version: VERSION });
  log(`daemon ${VERSION} (sessão "${SESSION_NAME}") ouvindo em 127.0.0.1:${port}`);
});

setInterval(() => {
  if (inFlight === 0 && Date.now() - lastActivity > IDLE_MS) void shutdown(`ocioso por ${IDLE_MS / 60_000} min`);
}, 30_000).unref();

for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => void shutdown(signal));
process.on('unhandledRejection', (err) => log('unhandledRejection:', err));
