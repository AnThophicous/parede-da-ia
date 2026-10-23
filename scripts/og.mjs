#!/usr/bin/env node
// Gera docs/assets/og.svg: esfera sombreada com dithering Bayer 8×8 (só preto e branco).
// Uso: node scripts/og.mjs   → depois renderize o PNG com a própria toolkit:
//   web-url-fetch scripts/og-render.html --viewport 1200x630 --dpr 1
//   web-wait-page-load && web-screenshot --out docs/assets/og.png
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const W = 1200;
const H = 630;
const CELL = 6;
const sphere = { cx: 948, cy: 292, r: 206 };
const light = normalize([-0.55, 0.7, 0.85]);

function normalize(v) {
  const l = Math.hypot(...v);
  return v.map((x) => x / l);
}
const bayer = (() => {
  const m = [[0]];
  let size = 1;
  let mat = m;
  while (size < 8) {
    const next = Array.from({ length: size * 2 }, () => new Array(size * 2));
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const v = mat[y][x] * 4;
        next[y][x] = v;
        next[y][x + size] = v + 2;
        next[y + size][x] = v + 3;
        next[y + size][x + size] = v + 1;
      }
    }
    mat = next;
    size *= 2;
  }
  return mat.map((row) => row.map((v) => (v + 0.5) / 64));
})();

const rects = [];
for (let y = 0; y < H; y += CELL) {
  for (let x = 0; x < W; x += CELL) {
    const dx = (x + CELL / 2 - sphere.cx) / sphere.r;
    const dy = (y + CELL / 2 - sphere.cy) / sphere.r;
    const d2 = dx * dx + dy * dy;
    let lum = 0;
    if (d2 <= 1) {
      const n = [dx, -dy, Math.sqrt(1 - d2)];
      const diff = Math.max(0, n[0] * light[0] + n[1] * light[1] + n[2] * light[2]);
      const rim = Math.pow(1 - n[2], 2.4);
      lum = diff * 0.85 + rim * 0.35;
    } else {
      lum = 0.05 * Math.max(0, 1 - (Math.sqrt(d2) - 1) / 0.22);
    }
    const t = bayer[(y / CELL) % 8][(x / CELL) % 8];
    if (lum > t) rects.push(`M${x} ${y}h${CELL}v${CELL}h-${CELL}z`);
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#000"/>
  <path fill="#fff" d="${rects.join('')}"/>
  <g fill="#fff" font-family="'Inter Tight', 'Helvetica Neue', Arial, sans-serif">
    <text x="64" y="92" font-family="'JetBrains Mono', ui-monospace, monospace" font-size="20" letter-spacing="2.4" fill="#8f8f8f">FRAMEWORK OPEN-SOURCE · PLAYWRIGHT · FFMPEG · MCP</text>
    <text x="56" y="352" font-size="196" font-weight="800" letter-spacing="-12">Parede</text>
    <text x="150" y="500" font-size="196" font-weight="800" letter-spacing="-12"><tspan font-family="'Instrument Serif', Georgia, serif" font-style="italic" font-weight="400" letter-spacing="-6">da</tspan> IA</text>
    <text x="64" y="574" font-size="26" fill="#b5b5b5">Olhos, mãos e repertório para Claude Code, Codex e OpenCode.</text>
  </g>
</svg>
`;

const out = fileURLToPath(new URL('../docs/assets/og.svg', import.meta.url));
writeFileSync(out, svg);
console.log(`✔ ${out} (${rects.length} células acesas, ${(svg.length / 1024).toFixed(1)} KB)`);
