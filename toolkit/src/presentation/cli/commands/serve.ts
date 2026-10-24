import { spawn } from 'node:child_process';
import { createReadStream, existsSync, openSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { ParedeError } from '../../../domain/errors.js';
import { ensureDir, PAREDE_HOME, TOOLKIT_ROOT } from '../../../infrastructure/session/paths.js';
import { isPidAlive } from '../../../infrastructure/session/session.js';
import { parseNumber } from '../../../domain/units.js';
import { kv, next, ok, parse, type Command } from './shared.js';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.wasm': 'application/wasm',
};

const statePath = (port: number) => join(PAREDE_HOME, 'serve', `${port}.json`);

function serve(root: string, port: number, spa: boolean): Promise<never> {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
    let file = normalize(join(root, urlPath));
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) {
      if (spa && !extname(urlPath)) file = join(root, 'index.html');
      else {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end(`404 ${urlPath}`);
        return;
      }
    }
    res.writeHead(200, { 'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    createReadStream(file).pipe(res);
  });
  return new Promise((_, reject) => {
    server.on('error', (err: NodeJS.ErrnoException) =>
      reject(err.code === 'EADDRINUSE' ? new ParedeError('PORT_IN_USE', `A porta ${port} já está em uso.`, 'Use --port <outra>.') : err),
    );
    server.listen(port, '127.0.0.1', () => console.log(ok(`servindo ${root} em http://localhost:${port}`)));
  });
}

export const serveCommand: Command = {
  name: 'web-serve',
  group: 'operação',
  summary: 'Servidor estático local sem cache para o loop de QA visual (com --detach).',
  usage: `web-serve [pasta=.] [--port 4173] [--spa] [--detach] [--stop]`,
  async execute(argv) {
    const { values, positionals } = parse(
      argv,
      { port: { type: 'string' }, spa: { type: 'boolean' }, detach: { type: 'boolean' }, stop: { type: 'boolean' } },
      this.usage,
    );
    const port = parseNumber(values.port, 'port', 4173);

    if (values.stop) {
      const file = statePath(port);
      if (!existsSync(file)) return { data: { stopped: false }, text: ok(`nada rodando na porta ${port}`) };
      const { pid } = JSON.parse(readFileSync(file, 'utf8')) as { pid: number };
      if (isPidAlive(pid)) process.kill(pid);
      rmSync(file, { force: true });
      return { data: { stopped: true, pid }, text: ok(`servidor da porta ${port} encerrado`) };
    }

    const root = resolve(positionals[0] ?? '.');
    if (!existsSync(root)) throw new ParedeError('BAD_ARG', `Pasta não encontrada: ${root}`);

    if (values.detach) {
      ensureDir(join(PAREDE_HOME, 'serve'));
      const log = openSync(join(PAREDE_HOME, 'serve', `${port}.log`), 'a');
      const child = spawn(process.execPath, [join(TOOLKIT_ROOT, 'bin', 'parede.js'), 'web-serve', root, '--port', String(port), ...(values.spa ? ['--spa'] : [])], {
        detached: true,
        stdio: ['ignore', log, log],
        windowsHide: true,
      });
      child.unref();
      writeFileSync(statePath(port), JSON.stringify({ pid: child.pid, root, port }));
      await new Promise((r) => setTimeout(r, 400));
      const url = `http://localhost:${port}`;
      return { data: { url, pid: child.pid, root }, text: [ok(`servindo em background: ${url}`), kv('pasta', root), next(`web-url-fetch ${url}  ·  parar: web-serve --stop --port ${port}`)].join('\n') };
    }

    return serve(root, port, Boolean(values.spa));
  },
};
