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
  `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>smoke</title><meta name="description" content="fixture">
<style>
:root{--ink:#111;--paper:#fafafa;--accent:#ff4d00}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 system-ui}
section{height:100vh;display:grid;place-items:center}
#cta{padding:16px 24px;border:0;background:var(--ink);color:#fff;transition:background-color .3s cubic-bezier(.16,1,.3,1),transform .3s cubic-bezier(.16,1,.3,1)}
#cta:hover{background:var(--accent);transform:translateY(-2px)}
#cta:focus-visible{outline:3px solid var(--accent);outline-offset:4px}
#card{position:absolute;left:40px;top:40px;width:120px;height:80px;background:#fff;box-shadow:0 8px 24px rgba(0,0,0,.15);cursor:grab;transform:rotate(-4deg)}
.pulse{animation:pulse 2s ease-in-out infinite}@keyframes pulse{50%{opacity:.5}}
@media (prefers-reduced-motion: reduce){.pulse{animation:none}}
</style></head>
<body><main><section><h1 class="pulse">parede-da-ia</h1><button id="cta">Instalar</button><div id="card"></div></section>
<section><canvas id="c" width="200" height="100"></canvas><p id="moved">0</p></section></main>
<script>
document.getElementById('c').getContext('webgl');
document.getElementById('cta').onclick=()=>document.title='clicked';
const card=document.getElementById('card');let drag=null;
card.addEventListener('pointerdown',e=>{drag={x:e.clientX-card.offsetLeft,y:e.clientY-card.offsetTop};card.setPointerCapture(e.pointerId)});
card.addEventListener('pointermove',e=>{if(!drag)return;card.style.left=(e.clientX-drag.x)+'px';card.style.top=(e.clientY-drag.y)+'px'});
card.addEventListener('pointerup',()=>{drag=null;document.getElementById('moved').textContent=card.style.left});
</script></body></html>`,
);

const run = (...args) => JSON.parse(execFileSync(process.execPath, [bin, ...args, '--json'], { env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
let failures = 0;
const assert = (cond, msg) => {
  if (!cond) failures++;
  console.log(`${cond ? '✔' : '✖'} ${msg}`);
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
  const drag = run('web-control', 'drag', '#card', '+200,+100', '--steps', '12');
  assert(drag.results[0].result.to.x > drag.results[0].result.from.x, 'web-control drag com mouse real');
  assert(JSON.parse(run('web-eval', 'document.getElementById("moved").textContent').value) !== '0', 'web-eval lê o estado após o drag');
  const scroll = run('web-control', 'scroll-down', '600', '--steps', '6', '--interval', '20ms');
  assert(scroll.results[0].result.scrolledBy > 0, 'web-control scroll-down via wheel');
  const shot = run('web-screenshot', '--full-page', '--dpr', '2');
  assert(existsSync(shot.path) && shot.pixels.width === 2560, 'web-screenshot full-page @2x');
  const multi = run('web-screenshot', '--viewports', 'desktop,mobile');
  assert(Array.isArray(multi) && multi.length === 2 && multi[1].viewport.width === 390, 'web-screenshot --viewports');
  const rec = run('web-record-frames', '--interval', '0.2', '--while', 'scroll-up 600 --steps 6', '--tile-width', '160');
  assert(rec.frameCount >= 3, `web-record-frames (${rec.frameCount} frames, ffmpeg: ${rec.ffmpeg ?? 'ausente'})`);
  assert(rec.pageFrames && rec.pageFrames.fps > 0, 'web-record-frames mede fps/jank da página');
  const scrap = run('web-scrap');
  assert(scrap.colors.cssVariables.some((v) => v.name === '--ink'), 'web-scrap extrai variáveis CSS de cor');
  assert(scrap.media.canvases[0]?.context === 'webgl', 'web-scrap identifica contexto WebGL via hook');
  assert(typeof scrap.aesthetic?.primary === 'string', `web-scrap classifica a estética (${scrap.aesthetic?.primary})`);
  const motion = run('web-motion', '--observe', '1');
  assert(motion.transitions.easings.some((e) => e.value.includes('cubic-bezier(0.16, 1, 0.3, 1)')), 'web-motion encontra a curva das transições');
  assert(motion.reducedMotion.respected === true, 'web-motion detecta regra prefers-reduced-motion');
  const inter = run('web-interactions', '--selector', '#cta', '--hold', '400ms');
  const cta = inter.items[0];
  assert(cta && cta.hover.changes.some((c) => c.property === 'background-color'), 'web-interactions mede o hover');
  assert(cta && cta.focus.visible, 'web-interactions confirma foco visível');
  const audit = run('web-audit', '--viewports', 'desktop,mobile', '--focus-steps', '3');
  assert(typeof audit.overall === 'number' && existsSync(audit.reportFile), `web-audit gera nota (${audit.overall}) e relatório`);
  const tokens = run('web-tokens');
  assert(existsSync(tokens.css) && Object.keys(tokens.tokens.color).length > 0, 'web-tokens exporta CSS + JSON');
  const diff = run('web-diff', multi[0].path, multi[0].path);
  assert(diff.ssim > 0.999, `web-diff reconhece imagens idênticas (SSIM ${diff.ssim})`);
  if (rec.outputs?.video) {
    const media = run('media-frames', rec.outputs.video, '--every', '0.4');
    assert(media.frames.length >= 2 && existsSync(media.sheets[0]), 'media-frames extrai frames e folha de contato');
  } else assert(false, 'media-frames (sem vídeo para testar: FFmpeg ausente?)');
} finally {
  run('web-close');
}
if (failures) {
  console.error(`\n${failures} verificação(ões) falharam`);
  process.exitCode = 1;
}
