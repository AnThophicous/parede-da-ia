import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { rpc } from '../core/client.js';
import { outputPath, slugFromUrl, stamp } from '../core/paths.js';
import { formatBytes, parseNumber } from '../core/units.js';
import type { ScrapResult } from '../daemon/scrap.js';
import { kv, next, ok, parse, warn, type Command } from './shared.js';

const list = (items: string[], empty = '—') => (items.length ? items.join(' · ') : empty);

/** Resumo de uma tela: o JSON completo fica em disco para consultas pontuais. */
function summarize(r: ScrapResult, file: string): string {
  const c = r.colors;
  const swatch = (entries: { value: string; share: number }[], n: number) => list(entries.slice(0, n).map((e) => `${e.value} (${e.share}%)`));
  const effects = r.effects;
  const fx = [
    effects.mixBlendMode && `mix-blend ×${effects.mixBlendMode}`,
    effects.backdropFilter && `backdrop-filter ×${effects.backdropFilter}`,
    effects.transform3d && `3D transforms ×${effects.transform3d}`,
    effects.clipPath && `clip-path ×${effects.clipPath}`,
    effects.mask && `mask ×${effects.mask}`,
    effects.sticky && `sticky ×${effects.sticky}`,
    effects.cssAnimations.length && `@keyframes em uso ×${effects.cssAnimations.length}`,
    effects.scrollDrivenAnimations && `scroll-driven CSS ×${effects.scrollDrivenAnimations}`,
    effects.grainOverlays && `grain/noise SVG ×${effects.grainOverlays}`,
    effects.customCursor && 'cursor customizado',
    effects.rafPerSecond > 20 && `loop rAF ~${effects.rafPerSecond}/s`,
  ].filter(Boolean) as string[];
  const canvases = r.media.canvases.map((cv) => `${cv.context}${cv.fullscreen ? ' (fullscreen)' : ''}`);
  const fonts = r.fonts.families
    .filter((f) => f.usedShare > 0 || f.sources.length)
    .sort((a, b) => b.usedShare - a.usedShare)
    .slice(0, 6)
    .map((f) => `${f.family}${f.usedShare ? ` ${f.usedShare}%` : ''} [${f.sources.join(', ') || 'sistema'}]`);
  const scale = r.fonts.scale.slice(0, 6).map((s) => `${s.size}/${s.weight}`);
  const lines = [
    ok(`web-scrap ${r.page.url}`),
    kv('stack', list(r.stack.map((s) => (s.version ? `${s.name} ${s.version}` : s.name)))),
    kv('hosting', list(r.hosting)),
    kv('fontes', list(fonts)),
    kv('escala', list(scale)),
    kv('ícones', `${list(r.icons.libraries, 'nenhuma biblioteca')} · SVG inline ×${r.icons.inlineSvg}`),
    kv('fundo', swatch(c.background, 4)),
    kv('texto', swatch(c.text, 4)),
    kv('acento', swatch(c.accent, 4)),
    kv('variáveis', `${c.cssVariables.length} de cor (de ${c.cssVariablesTotal} custom properties)`),
    kv('mono?', c.isMonochrome ? 'sim — paleta 100% acromática' : `não — cromáticas: ${c.chromaticColors.slice(0, 6).join(' ')}`),
    kv('mídia', `${r.media.images.length} img (${Object.entries(r.media.imageFormats).map(([k, v]) => `${k}×${v}`).join(' ')}) · ${r.media.videos.length} vídeo · canvas: ${list(canvases, '0')} · ${r.media.shaders.length} shaders`),
    kv('efeitos', list(fx)),
    kv('layout', `espaçamentos no grid de 4px: ${r.layout.spacingOn4pxGrid ?? '—'}% · grid ×${effects.grid} · flex ×${effects.flex}`),
    kv('rede', `${r.network.requests} req · ${formatBytes(r.network.totalBytes)} · ${r.network.domains.length} domínios${r.network.failed.length ? ` · ${r.network.failed.length} falhas` : ''}`),
    kv('contraste', r.contrast.failures ? `${r.contrast.failures} falha(s) WCAG AA em ${r.contrast.checked} textos` : `ok em ${r.contrast.checked} textos`),
  ];
  for (const issue of r.contrast.issues.slice(0, 5)) {
    lines.push(`    · ${issue.ratio}:1 (mín ${issue.required}) ${issue.fg} sobre ${issue.bg}${issue.uncertain ? ' [incerto: imagem/blend]' : ''} — ${issue.selector} "${issue.text.slice(0, 40)}"`);
  }
  if (r.media.imagesMissingAlt) lines.push(warn(`${r.media.imagesMissingAlt} imagem(ns) sem alt`));
  if (r.media.imagesOversized) lines.push(warn(`${r.media.imagesOversized} imagem(ns) muito maiores que o tamanho renderizado`));
  if (r.console.errors.length) lines.push(warn(`${r.console.errors.length} erro(s) de console: ${r.console.errors.slice(0, 3).map((e) => e.text.slice(0, 90)).join(' | ')}`));
  lines.push(kv('json', file));
  lines.push(next('consulte o JSON para paletas completas, shaders, @font-face e lista de recursos'));
  return lines.join('\n');
}

export const scrap: Command = {
  name: 'web-scrap',
  summary: 'Wappalyzer de front-end: stack, fontes, ícones, paleta, mídia, shaders, efeitos e rede em JSON.',
  usage: `web-scrap [--out arquivo.json] [--max-elements 4000]
  Rode depois de web-wait-page-load. Para capturar recursos de scroll, role antes (web-control scroll-to bottom).`,
  async execute(argv) {
    const { values } = parse(argv, { out: { type: 'string' }, 'max-elements': { type: 'string' } }, this.usage);
    const result = await rpc<ScrapResult>('scrap', { maxElements: parseNumber(values['max-elements'], 'max-elements', 4000) });
    const file = values.out ? resolve(values.out) : outputPath('scrap', `${slugFromUrl(result.page.url)}-${stamp()}.json`);
    writeFileSync(file, JSON.stringify(result, null, 2));
    return { data: { file, ...result }, text: summarize(result, file) };
  },
};
