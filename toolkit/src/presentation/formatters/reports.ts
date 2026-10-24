import { summarizeChanges } from '../../domain/interactions.js';
import type { AuditReport, InteractionsReport, MotionReport, ScrapReport } from '../../domain/reports.js';
import { formatBytes } from '../../domain/units.js';
import { kv, list, next, ok, warn } from '../cli/commands/shared.js';

/**
 * Resumos otimizados para leitura por LLMs: densos, sem ruído, com o caminho do
 * JSON completo para consultas pontuais. Uma linha = um fato verificável.
 */

export function formatScrap(r: ScrapReport, file: string): string {
  const c = r.colors;
  const swatch = (entries: { value: string; share: number }[], n: number) => list(entries.slice(0, n).map((e) => `${e.value} (${e.share}%)`));
  const e = r.effects;
  const fx = [
    e.mixBlendMode && `mix-blend ×${e.mixBlendMode}`,
    e.backdropFilter && `backdrop-filter ×${e.backdropFilter}`,
    e.largeBlurs && `blur grande ×${e.largeBlurs}`,
    e.transform3d && `3D transforms ×${e.transform3d}`,
    e.rotated && `inclinados ×${e.rotated}`,
    e.draggable && `arrastáveis ×${e.draggable}`,
    e.clipPath && `clip-path ×${e.clipPath}`,
    e.mask && `mask ×${e.mask}`,
    e.sticky && `sticky ×${e.sticky}`,
    e.cssAnimations.length && `@keyframes em uso ×${e.cssAnimations.length}`,
    e.scrollDrivenAnimations && `scroll-driven CSS ×${e.scrollDrivenAnimations}`,
    e.grainOverlays && `grain/noise ×${e.grainOverlays}`,
    e.customCursor && 'cursor customizado',
    e.rafPerSecond > 20 && `loop rAF ~${e.rafPerSecond}/s`,
  ].filter(Boolean) as string[];
  const canvases = r.media.canvases.map((cv) => `${cv.context}${cv.fullscreen ? ' (fullscreen)' : ''}`);
  const fonts = r.fonts.families
    .filter((f) => f.usedShare > 0 || f.sources.length)
    .sort((a, b) => b.usedShare - a.usedShare)
    .slice(0, 6)
    .map((f) => `${f.family}${f.usedShare ? ` ${f.usedShare}%` : ''} [${f.sources.join(', ') || 'sistema'}]`);
  const a = r.aesthetic;
  const lines = [
    ok(`web-scrap ${r.page.url}`),
    kv('estética', `${a.primary}${a.secondary ? ` + ${a.secondary}` : ''} (${Math.round(a.confidence * 100)}%) — ${list(a.signals.slice(0, 4))} → ${a.playbook}`),
    kv('stack', list(r.stack.map((s) => (s.version ? `${s.name} ${s.version}` : s.name)))),
    kv('hosting', list(r.hosting)),
    kv('fontes', list(fonts)),
    kv('escala', list(r.fonts.scale.slice(0, 7).map((s) => `${s.size}/${s.weight}`))),
    kv('ícones', `${list(r.icons.libraries, 'nenhuma biblioteca')} · SVG inline ×${r.icons.inlineSvg}`),
    kv('fundo', swatch(c.background, 4)),
    kv('texto', swatch(c.text, 4)),
    kv('acento', swatch(c.accent, 4)),
    kv('gradientes', r.gradients.length ? list(r.gradients.slice(0, 3).map((g) => `${g.type} ×${g.count}`)) : '—'),
    kv('variáveis', `${c.cssVariables.length} de cor (de ${c.cssVariablesTotal} custom properties)`),
    kv('mono?', c.isMonochrome ? 'sim — paleta 100% acromática' : `não — cromáticas: ${c.chromaticColors.slice(0, 6).join(' ')}`),
    kv('mídia', `${r.media.images.length} img (${Object.entries(r.media.imageFormats).map(([k, v]) => `${k}×${v}`).join(' ')}) · ${r.media.videos.length} vídeo · canvas: ${list(canvases, '0')} · ${r.media.shaders.length} shaders`),
    kv('efeitos', list(fx)),
    kv('movimento', r.motion.durations.length ? `${list(r.motion.durations.slice(0, 3).map((d) => d.value))} · ${list(r.motion.easings.slice(0, 2).map((x) => x.value))}` : 'sem transições CSS'),
    kv('layout', `grid de 4px: ${r.layout.spacingOn4pxGrid ?? '—'}% · largura máx. ${r.layout.maxContentWidth ? `${r.layout.maxContentWidth}px` : '—'} · grid ×${e.grid} · flex ×${e.flex}`),
    kv('vitals', `LCP ${r.perf.lcpMs !== null ? `${(r.perf.lcpMs / 1000).toFixed(2)}s` : '—'} · CLS ${r.perf.cls ?? '—'} · long tasks ${r.perf.longTasks}`),
    kv('rede', `${r.network.requests} req · ${formatBytes(r.network.totalBytes)} · ${r.network.domains.length} domínios${r.network.failed.length ? ` · ${r.network.failed.length} falhas` : ''}`),
    kv('contraste', r.contrast.failures ? `${r.contrast.failures} falha(s) WCAG AA em ${r.contrast.checked} textos` : `ok em ${r.contrast.checked} textos`),
  ];
  for (const issue of r.contrast.issues.slice(0, 5)) {
    lines.push(`    · ${issue.ratio}:1 (mín ${issue.required}) ${issue.fg} sobre ${issue.bg}${issue.uncertain ? ' [incerto: imagem/blend]' : ''} — ${issue.selector} "${issue.text.slice(0, 40)}"`);
  }
  if (r.media.imagesMissingAlt) lines.push(warn(`${r.media.imagesMissingAlt} imagem(ns) sem alt`));
  if (r.media.imagesOversized) lines.push(warn(`${r.media.imagesOversized} imagem(ns) muito maiores que o tamanho renderizado`));
  if (r.console.errors.length) lines.push(warn(`${r.console.errors.length} erro(s) de console: ${r.console.errors.slice(0, 3).map((x) => x.text.slice(0, 90)).join(' | ')}`));
  lines.push(kv('json', file));
  lines.push(next(`leia ${a.playbook} para traduzir a referência em direção de arte`));
  return lines.join('\n');
}

export function formatMotion(r: MotionReport, file: string): string {
  const lines = [
    ok(`web-motion ${r.url}`),
    kv('libs', list(r.libraries, 'nenhuma exposta (pode estar empacotada)')),
    kv('rodando', `${r.running.total} animação(ões) · ${list(Object.entries(r.running.byKind).map(([k, v]) => `${k} ×${v}`))}`),
    kv('transições', `${r.transitions.elements} elementos · durações ${list(r.transitions.durations.slice(0, 4).map((d) => `${d.value} (${d.share}%)`))}`),
    kv('curvas', list(r.transitions.easings.slice(0, 4).map((e) => `${e.value} (${e.share}%)`))),
    kv('props', list(r.transitions.properties.slice(0, 6).map((p) => p.value))),
  ];
  if (r.gsap) {
    lines.push(kv('gsap', `${r.gsap.version ?? '?'}${r.gsap.global ? '' : ' (empacotado — use --observe)'} · ${r.gsap.tweens.length} tweens · ${r.gsap.scrollTriggers.length} ScrollTriggers`));
    const eases = new Map<string, number>();
    for (const t of r.gsap.tweens) eases.set(t.ease, (eases.get(t.ease) ?? 0) + 1);
    if (eases.size) lines.push(kv('eases', list([...eases.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([e, n]) => `${e} ×${n}`))));
    for (const st of r.gsap.scrollTriggers.slice(0, 5)) lines.push(`    · ScrollTrigger ${st.trigger} start "${st.start}" end "${st.end}"${st.scrub !== null ? ` scrub ${st.scrub}` : ''}${st.pin ? ' pin' : ''}`);
  }
  if (r.smoothScroll.library) lines.push(kv('scroll', `${r.smoothScroll.library}${r.smoothScroll.options ? ` ${JSON.stringify(r.smoothScroll.options)}` : ''}`));
  if (r.observed) {
    lines.push(kv('observado', `${r.observed.elements.length} elementos animados em ${(r.observed.durationMs / 1000).toFixed(1)}s · ${r.observed.mutations} mutações · props ${list(r.observed.properties.slice(0, 5).map((p) => p.value))}`));
    for (const el of r.observed.elements.slice(0, 6)) {
      const [prop, v] = Object.entries(el.props)[0] ?? [];
      lines.push(`    · ${el.selector} ×${el.changes}${prop ? ` ${prop}: ${v.first.slice(0, 40)} → ${v.last.slice(0, 40)}` : ''}`);
    }
  }
  if (r.frames) lines.push(kv('frames', `${r.frames.fps} fps · p95 ${r.frames.p95FrameMs}ms · pior ${r.frames.worstFrameMs}ms · ${r.frames.longFrames} frames longos`));
  lines.push(kv('a11y', r.reducedMotion.respected ? `prefers-reduced-motion tratado (${r.reducedMotion.rulesFound} regra(s))` : 'nenhuma regra prefers-reduced-motion encontrada'));
  if (r.scrollDriven || r.viewTransitions) lines.push(kv('nativo', `scroll-driven ×${r.scrollDriven} · view transitions ×${r.viewTransitions}`));
  if (r.keyframes.length) lines.push(kv('keyframes', list(r.keyframes.slice(0, 6).map((k) => k.name))));
  lines.push(kv('tokens', r.tokens.css.replace(/\n\s*/g, ' ')));
  lines.push(kv('json', file));
  lines.push(next('combine com web-record-frames para ver a coreografia; use os tokens como ponto de partida'));
  return lines.join('\n');
}

export function formatInteractions(r: InteractionsReport, file: string): string {
  const lines = [
    ok(`web-interactions ${r.url} · ${r.tested} elementos testados`),
    kv('resumo', `${r.withoutHoverFeedback} sem feedback de hover · ${r.withoutFocusIndicator} sem foco visível · ${r.magnetic} magnéticos`),
  ];
  for (const it of r.items.slice(0, 20)) {
    lines.push(`  ${it.verdict.some((v) => /sem feedback|invisível/.test(v)) ? '✖' : '◉'} ${it.selector}${it.label ? ` "${it.label.slice(0, 30)}"` : ''}`);
    lines.push(`      hover: ${summarizeChanges(it.hover.changes)}${it.hover.transition ? ` [${it.hover.transition.slice(0, 70)}]` : ''}`);
    lines.push(`      foco: ${it.focus.visible ? summarizeChanges(it.focus.changes, 2) : 'INVISÍVEL'}${it.press.changes.length ? ` · active: ${summarizeChanges(it.press.changes, 2)}` : ''}`);
    if (it.verdict.length) lines.push(`      → ${it.verdict.join(' · ')}`);
  }
  if (r.sheet) lines.push(kv('folha', r.sheet));
  lines.push(kv('json', file));
  lines.push(next('leia a folha antes/hover/foco para julgar a qualidade de cada microinteração'));
  return lines.join('\n');
}

export function formatAudit(r: AuditReport): string {
  const bar = (n: number) => `${'█'.repeat(Math.round(n / 10))}${'░'.repeat(10 - Math.round(n / 10))} ${n}`;
  const lines = [
    `${r.verdict === 'aprovado' ? '✔' : '✖'} web-audit ${r.url} — ${r.verdict.toUpperCase()} (${r.overall}/100)`,
    ...Object.entries(r.scores).map(([k, v]) => kv(k.slice(0, 10), bar(v))),
  ];
  const order = { erro: 0, aviso: 1, info: 2 } as const;
  const unique = new Map<string, (typeof r.issues)[number]>();
  for (const i of r.issues) if (!unique.has(i.id)) unique.set(i.id, i);
  for (const i of [...unique.values()].sort((a, b) => order[a.severity] - order[b.severity])) {
    const where = r.issues.filter((x) => x.id === i.id).map((x) => x.viewport.split(' ')[0]);
    lines.push(`  ${i.severity === 'erro' ? '✖' : i.severity === 'aviso' ? '⚠' : '·'} [${i.category}] ${i.message} (${[...new Set(where)].join(', ')})${i.targets.length ? `\n      ${i.targets.slice(0, 3).join(' · ')}` : ''}`);
  }
  for (const v of r.viewports) if (v.screenshot) lines.push(kv(v.name.split(' ')[0], v.screenshot));
  if (r.reportFile) lines.push(kv('relatório', r.reportFile));
  lines.push(next(r.verdict === 'aprovado' ? 'leia as capturas por viewport antes de entregar' : 'corrija os ✖ primeiro, depois os ⚠; rode web-audit de novo'));
  return lines.join('\n');
}

export function auditMarkdown(r: AuditReport): string {
  const rows = Object.entries(r.scores).map(([k, v]) => `| ${k} | ${v} |`).join('\n');
  const issues = r.issues
    .map((i) => `- **${i.severity}** · ${i.category} · ${i.viewport} — ${i.message}${i.targets.length ? `\n  - ${i.targets.slice(0, 8).join('\n  - ')}` : ''}`)
    .join('\n');
  const shots = r.viewports.filter((v) => v.screenshot).map((v) => `- ${v.name}: \`${v.screenshot}\``).join('\n');
  return `# Auditoria parede-da-ia — ${r.url}

Gerado em ${r.generatedAt} · **${r.verdict.toUpperCase()} (${r.overall}/100)**

| Categoria | Nota |
|-----------|------|
${rows}

## Web Vitals e peso

- LCP: ${r.perf.lcpMs !== null ? `${(r.perf.lcpMs / 1000).toFixed(2)}s (${r.perf.lcpElement ?? '?'})` : '—'}
- CLS: ${r.perf.cls ?? '—'}
- Long tasks: ${r.perf.longTasks} (${r.perf.longTaskMs}ms)
- Requisições: ${r.perf.requests} · ${formatBytes(r.perf.totalBytes)} (JS ${formatBytes(r.perf.jsBytes)}) · ${r.perf.fontFiles} arquivos de fonte

## Problemas

${issues || '_Nenhum problema encontrado._'}

## Capturas

${shots}
`;
}
