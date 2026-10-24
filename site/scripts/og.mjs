#!/usr/bin/env node
// Gera public/og.jpg (1200×630) a partir de og.html, capturado pela própria toolkit (dogfooding).
// Uso: node scripts/og.mjs [--frame 17000] [--out arquivo.jpg]   (frame = quadro do campo de cor, em ms)
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const site = fileURLToPath(new URL('..', import.meta.url));
const parede = fileURLToPath(new URL('../../toolkit/bin/parede.js', import.meta.url));
const arg = (name, fallback) => {
  const at = process.argv.indexOf(name);
  return at > -1 ? process.argv[at + 1] : fallback;
};
const frame = arg('--frame', '17000');
const out = resolve(arg('--out', fileURLToPath(new URL('../public/og.jpg', import.meta.url))));
// Sessão própria: não navega a sessão em que o agente está trabalhando.
const env = { ...process.env, PAREDE_SESSION: 'og' };
// Assíncrono de propósito: o servidor do Vite roda neste processo e precisa do event loop livre.
const run = (...args) =>
  new Promise((ok, fail) => {
    const child = spawn(process.execPath, [parede, ...args], { env, stdio: 'inherit' });
    child.on('exit', (code) => (code === 0 ? ok() : fail(new Error(`${args[0]} saiu com código ${code}`))));
  });

const server = await createServer({ root: site, logLevel: 'error', server: { port: 5179, strictPort: true } });
await server.listen();
try {
  await run('web-url-fetch', `http://localhost:5179/parede-da-ia/og.html?frame=${frame}`, '--viewport', '1200x630', '--dpr', '1');
  await run('web-wait', '3');
  await run('web-screenshot', '--out', out);
} finally {
  await run('web-close').catch(() => undefined);
  await server.close();
}
