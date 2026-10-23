#!/usr/bin/env node
// Smoke test ponta a ponta: sobe uma página fixture, roda todos os comandos e valida as saídas.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const bin = fileURLToPath(new URL('../bin/parede.js', import.meta.url));
const work = mkdtempSync(join(tmpdir(), 'parede-smoke-'));
const env = { ...process.env, PAREDE_OUT: join(work, 'out'), PAREDE_SESSION: 'smoke' };

writeFileSync(
  join(work, 'index.html'),
  `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>smoke</title>
<style>:root{--ink:#111;--paper:#fafafa}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 system-ui}
section{height:100vh;display:grid;place-items:center}button:hover{background:#000;color:#fff}</style></head>
<body><section><h1>parede-da-ia</h1><button id="cta">Instalar</button></section><section><canvas id="c" width="200" height="100"></canvas></section>
<script>document.getElementById('c').getContext('webgl');document.getElementById('cta').onclick=()=>document.title='clicked'</script></body></html>`,
);

const run = (...args) => {
  const out = execFileSync(process.execPath, [bin, ...args, '--json'], { env, encoding: 'utf8' });
  return JSON.parse(out);
};
const assert = (cond, msg) => {
  if (!cond) {
    console.error(`✖ ${msg}`);
    process.exitCode = 1;
  } else console.log(`✔ ${msg}`);
};

try {
  const open = run('web-url-fetch', join(work, 'index.html'), '--viewport', '1280x720', '--dpr', '1');
  assert(open.title === 'smoke', 'web-url-fetch abre arquivo local');
  assert(run('web-wait-page-load').readyState === 'complete', 'web-wait-page-load');
  assert(run('web-wait', '0.2').waitedMs === 200, 'web-wait');
  const inv = run('web-control', 'inventory');
  assert(inv.results[0].result.items.some((i) => i.selector === '#cta'), 'web-control inventory encontra #cta');
  const click = run('web-control', 'click', '#cta');
  assert(click.state.title === 'clicked', 'web-control click dispara handler real');
  const scroll = run('web-control', 'scroll-down', '600', '--steps', '6', '--interval', '20ms');
  assert(scroll.results[0].result.scrolledBy > 0, 'web-control scroll-down via wheel');
  const shot = run('web-screenshot', '--full-page', '--dpr', '2');
  assert(existsSync(shot.path) && shot.pixels.width === 2560, 'web-screenshot full-page @2x');
  const rec = run('web-record-frames', '--interval', '0.2', '--while', 'scroll-up 600 --steps 6', '--tile-width', '160');
  assert(rec.frameCount >= 3, `web-record-frames (${rec.frameCount} frames, ffmpeg: ${rec.ffmpeg ?? 'ausente'})`);
  const scrap = run('web-scrap');
  assert(scrap.colors.cssVariables.some((v) => v.name === '--ink'), 'web-scrap extrai variáveis CSS de cor');
  assert(scrap.media.canvases[0]?.context === 'webgl', 'web-scrap identifica contexto WebGL via hook');
} finally {
  run('web-close');
}
