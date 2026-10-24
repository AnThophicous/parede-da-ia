import { summarizeChanges } from '../../domain/interactions.js';
import type { AuditReport, InteractionsReport, MotionReport, ScrapReport } from '../../domain/reports.js';
import { formatBytes } from '../../domain/units.js';
import { kv, list, next, ok, warn } from '../cli/commands/shared.js';

/**
 * Summaries optimized for LLM reading: dense, noise-free, with the path to the
 * full JSON for targeted lookups. One line = one verifiable fact.
 */

export function formatScrap(r: ScrapReport, file: string): string {
  const c = r.colors;
  const swatch = (entries: { value: string; share: number }[], n: number) => list(entries.slice(0, n).map((e) => `${e.value} (${e.share}%)`));
  const e = r.effects;
  const fx = [
    e.mixBlendMode && `mix-blend ×${e.mixBlendMode}`,
    e.backdropFilter && `backdrop-filter ×${e.backdropFilter}`,
    e.largeBlurs && `large blur ×${e.largeBlurs}`,
    e.transform3d && `3D transforms ×${e.transform3d}`,
    e.rotated && `tilted ×${e.rotated}`,
    e.draggable && `draggable ×${e.draggable}`,
    e.clipPath && `clip-path ×${e.clipPath}`,
    e.mask && `mask ×${e.mask}`,
    e.sticky && `sticky ×${e.sticky}`,
    e.cssAnimations.length && `@keyframes in use ×${e.cssAnimations.length}`,
    e.scrollDrivenAnimations && `scroll-driven CSS ×${e.scrollDrivenAnimations}`,
    e.grainOverlays && `grain/noise ×${e.grainOverlays}`,
    e.customCursor && 'custom cursor',
    e.rafPerSecond > 20 && `loop rAF ~${e.rafPerSecond}/s`,
  ].filter(Boolean) as string[];
  const canvases = r.media.canvases.map((cv) => `${cv.context}${cv.fullscreen ? ' (fullscreen)' : ''}`);
  const fonts = r.fonts.families
    .filter((f) => f.usedShare > 0 || f.sources.length)
    .sort((a, b) => b.usedShare - a.usedShare)
    .slice(0, 6)
    .map((f) => `${f.family}${f.usedShare ? ` ${f.usedShare}%` : ''} [${f.sources.join(', ') || 'system'}]`);
  const a = r.aesthetic;
  const lines = [
    ok(`web-scrap ${r.page.url}`),
    kv('aesthetic', `${a.primary}${a.secondary ? ` + ${a.secondary}` : ''} (${Math.round(a.confidence * 100)}%) — ${list(a.signals.slice(0, 4))} → ${a.playbook}`),
    kv('stack', list(r.stack.map((s) => (s.version ? `${s.name} ${s.version}` : s.name)))),
    kv('hosting', list(r.hosting)),
    kv('fonts', list(fonts)),
    kv('scale', list(r.fonts.scale.slice(0, 7).map((s) => `${s.size}/${s.weight}`))),
    kv('icons', `${list(r.icons.libraries, 'no library')} · inline SVG ×${r.icons.inlineSvg}`),
    kv('background', swatch(c.background, 4)),
    kv('texto', swatch(c.text, 4)),
    kv('accent', swatch(c.accent, 4)),
    kv('gradients', r.gradients.length ? list(r.gradients.slice(0, 3).map((g) => `${g.type} ×${g.count}`)) : '—'),
    kv('variables', `${c.cssVariables.length} color (of ${c.cssVariablesTotal} custom properties)`),
    kv('mono?', c.isMonochrome ? 'yes — 100% achromatic palette' : `no — chromatic: ${c.chromaticColors.slice(0, 6).join(' ')}`),
    kv('media', `${r.media.images.length} img (${Object.entries(r.media.imageFormats).map(([k, v]) => `${k}×${v}`).join(' ')}) · ${r.media.videos.length} video · canvas: ${list(canvases, '0')} · ${r.media.shaders.length} shaders`),
    kv('effects', list(fx)),
    kv('motion', r.motion.durations.length ? `${list(r.motion.durations.slice(0, 3).map((d) => d.value))} · ${list(r.motion.easings.slice(0, 2).map((x) => x.value))}` : 'no CSS transitions'),
    kv('layout', `4px grid: ${r.layout.spacingOn4pxGrid ?? '—'}% · max width ${r.layout.maxContentWidth ? `${r.layout.maxContentWidth}px` : '—'} · grid ×${e.grid} · flex ×${e.flex}`),
    kv('vitals', `LCP ${r.perf.lcpMs !== null ? `${(r.perf.lcpMs / 1000).toFixed(2)}s` : '—'} · CLS ${r.perf.cls ?? '—'} · long tasks ${r.perf.longTasks}`),
    kv('network', `${r.network.requests} req · ${formatBytes(r.network.totalBytes)} · ${r.network.domains.length} domains${r.network.failed.length ? ` · ${r.network.failed.length} failed` : ''}`),
    kv('contrast', r.contrast.failures ? `${r.contrast.failures} WCAG AA failure(s) in ${r.contrast.checked} texts` : `ok in ${r.contrast.checked} texts`),
  ];
  for (const issue of r.contrast.issues.slice(0, 5)) {
    lines.push(`    · ${issue.ratio}:1 (min ${issue.required}) ${issue.fg} on ${issue.bg}${issue.uncertain ? ' [uncertain: image/blend]' : ''} — ${issue.selector} "${issue.text.slice(0, 40)}"`);
  }
  if (r.media.imagesMissingAlt) lines.push(warn(`${r.media.imagesMissingAlt} image(s) without alt`));
  if (r.media.imagesOversized) lines.push(warn(`${r.media.imagesOversized} image(s) much larger than their rendered size`));
  if (r.console.errors.length) lines.push(warn(`${r.console.errors.length} console error(s): ${r.console.errors.slice(0, 3).map((x) => x.text.slice(0, 90)).join(' | ')}`));
  lines.push(kv('json', file));
  lines.push(next(`read ${a.playbook} to turn the reference into art direction`));
  return lines.join('\n');
}

export function formatMotion(r: MotionReport, file: string): string {
  const lines = [
    ok(`web-motion ${r.url}`),
    kv('libs', list(r.libraries, 'none exposed (it may be bundled)')),
    kv('running', `${r.running.total} animation(s) · ${list(Object.entries(r.running.byKind).map(([k, v]) => `${k} ×${v}`))}`),
    kv('transitions', `${r.transitions.elements} elements · durations ${list(r.transitions.durations.slice(0, 4).map((d) => `${d.value} (${d.share}%)`))}`),
    kv('easings', list(r.transitions.easings.slice(0, 4).map((e) => `${e.value} (${e.share}%)`))),
    kv('props', list(r.transitions.properties.slice(0, 6).map((p) => p.value))),
  ];
  if (r.gsap) {
    lines.push(kv('gsap', `${r.gsap.version ?? '?'}${r.gsap.global ? '' : ' (bundled — use --observe)'} · ${r.gsap.tweens.length} tweens · ${r.gsap.scrollTriggers.length} ScrollTriggers`));
    const eases = new Map<string, number>();
    for (const t of r.gsap.tweens) eases.set(t.ease, (eases.get(t.ease) ?? 0) + 1);
    if (eases.size) lines.push(kv('eases', list([...eases.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([e, n]) => `${e} ×${n}`))));
    for (const st of r.gsap.scrollTriggers.slice(0, 5)) lines.push(`    · ScrollTrigger ${st.trigger} start "${st.start}" end "${st.end}"${st.scrub !== null ? ` scrub ${st.scrub}` : ''}${st.pin ? ' pin' : ''}`);
  }
  if (r.smoothScroll.library) lines.push(kv('scroll', `${r.smoothScroll.library}${r.smoothScroll.options ? ` ${JSON.stringify(r.smoothScroll.options)}` : ''}`));
  if (r.observed) {
    lines.push(kv('observed', `${r.observed.elements.length} animated elements in ${(r.observed.durationMs / 1000).toFixed(1)}s · ${r.observed.mutations} mutations · props ${list(r.observed.properties.slice(0, 5).map((p) => p.value))}`));
    for (const el of r.observed.elements.slice(0, 6)) {
      const [prop, v] = Object.entries(el.props)[0] ?? [];
      lines.push(`    · ${el.selector} ×${el.changes}${prop ? ` ${prop}: ${v.first.slice(0, 40)} → ${v.last.slice(0, 40)}` : ''}`);
    }
  }
  if (r.frames) lines.push(kv('frames', `${r.frames.fps} fps · p95 ${r.frames.p95FrameMs}ms · worst ${r.frames.worstFrameMs}ms · ${r.frames.longFrames} long frames`));
  lines.push(kv('a11y', r.reducedMotion.respected ? `prefers-reduced-motion handled (${r.reducedMotion.rulesFound} rule(s))` : 'no prefers-reduced-motion rule found'));
  if (r.scrollDriven || r.viewTransitions) lines.push(kv('native', `scroll-driven ×${r.scrollDriven} · view transitions ×${r.viewTransitions}`));
  if (r.keyframes.length) lines.push(kv('keyframes', list(r.keyframes.slice(0, 6).map((k) => k.name))));
  lines.push(kv('tokens', r.tokens.css.replace(/\n\s*/g, ' ')));
  lines.push(kv('json', file));
  lines.push(next('combine with web-record-frames to see the choreography; use the tokens as a starting point'));
  return lines.join('\n');
}

export function formatInteractions(r: InteractionsReport, file: string): string {
  const lines = [
    ok(`web-interactions ${r.url} · ${r.tested} elements tested`),
    kv('summary', `${r.withoutHoverFeedback} without hover feedback · ${r.withoutFocusIndicator} without visible focus · ${r.magnetic} magnetic`),
  ];
  for (const it of r.items.slice(0, 20)) {
    lines.push(`  ${it.verdict.some((v) => /no hover feedback|invisible/.test(v)) ? '✖' : '◉'} ${it.selector}${it.label ? ` "${it.label.slice(0, 30)}"` : ''}`);
    lines.push(`      hover: ${summarizeChanges(it.hover.changes)}${it.hover.transition ? ` [${it.hover.transition.slice(0, 70)}]` : ''}`);
    lines.push(`      focus: ${it.focus.visible ? summarizeChanges(it.focus.changes, 2) : 'INVISIBLE'}${it.press.changes.length ? ` · active: ${summarizeChanges(it.press.changes, 2)}` : ''}`);
    if (it.verdict.length) lines.push(`      → ${it.verdict.join(' · ')}`);
  }
  if (r.sheet) lines.push(kv('sheet', r.sheet));
  lines.push(kv('json', file));
  lines.push(next('read the before/hover/focus sheet to judge the quality of each microinteraction'));
  return lines.join('\n');
}

export function formatAudit(r: AuditReport): string {
  const bar = (n: number) => `${'█'.repeat(Math.round(n / 10))}${'░'.repeat(10 - Math.round(n / 10))} ${n}`;
  const lines = [
    `${r.verdict === 'approved' ? '✔' : '✖'} web-audit ${r.url} — ${r.verdict.toUpperCase()} (${r.overall}/100)`,
    ...Object.entries(r.scores).map(([k, v]) => kv(k.slice(0, 10), bar(v))),
  ];
  const order = { error: 0, warning: 1, info: 2 } as const;
  const unique = new Map<string, (typeof r.issues)[number]>();
  for (const i of r.issues) if (!unique.has(i.id)) unique.set(i.id, i);
  for (const i of [...unique.values()].sort((a, b) => order[a.severity] - order[b.severity])) {
    const where = r.issues.filter((x) => x.id === i.id).map((x) => x.viewport.split(' ')[0]);
    lines.push(`  ${i.severity === 'error' ? '✖' : i.severity === 'warning' ? '⚠' : '·'} [${i.category}] ${i.message} (${[...new Set(where)].join(', ')})${i.targets.length ? `\n      ${i.targets.slice(0, 3).join(' · ')}` : ''}`);
  }
  for (const v of r.viewports) if (v.screenshot) lines.push(kv(v.name.split(' ')[0], v.screenshot));
  if (r.reportFile) lines.push(kv('report', r.reportFile));
  lines.push(next(r.verdict === 'approved' ? 'read the captures per viewport before delivering' : 'fix the ✖ first, then the ⚠; run web-audit again'));
  return lines.join('\n');
}

export function auditMarkdown(r: AuditReport): string {
  const rows = Object.entries(r.scores).map(([k, v]) => `| ${k} | ${v} |`).join('\n');
  const issues = r.issues
    .map((i) => `- **${i.severity}** · ${i.category} · ${i.viewport} — ${i.message}${i.targets.length ? `\n  - ${i.targets.slice(0, 8).join('\n  - ')}` : ''}`)
    .join('\n');
  const shots = r.viewports.filter((v) => v.screenshot).map((v) => `- ${v.name}: \`${v.screenshot}\``).join('\n');
  return `# parede-da-ia audit — ${r.url}

Generated at ${r.generatedAt} · **${r.verdict.toUpperCase()} (${r.overall}/100)**

| Category | Score |
|----------|-------|
${rows}

## Web Vitals and weight

- LCP: ${r.perf.lcpMs !== null ? `${(r.perf.lcpMs / 1000).toFixed(2)}s (${r.perf.lcpElement ?? '?'})` : '—'}
- CLS: ${r.perf.cls ?? '—'}
- Long tasks: ${r.perf.longTasks} (${r.perf.longTaskMs}ms)
- Requests: ${r.perf.requests} · ${formatBytes(r.perf.totalBytes)} (JS ${formatBytes(r.perf.jsBytes)}) · ${r.perf.fontFiles} font files

## Issues

${issues || '_No issues found._'}

## Captures

${shots}
`;
}
