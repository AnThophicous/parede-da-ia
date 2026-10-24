import { join } from 'node:path';
import { BUDGET, scoreAudit } from '../../domain/audit.js';
import type { AuditIssue, AuditReport, ViewportAudit } from '../../domain/reports.js';
import { auditChecks, focusProbe } from './inject/audit.js';
import { collectMotion } from './inject/motion.js';
import { scanPage } from './inject/scanner.js';
import type { BrowserManager } from './manager.js';
import { perfSnapshot } from './scrap.js';

export interface AuditParams {
  dir: string;
  viewports: { name: string; width: number; height: number }[];
  fullPage: boolean;
  focusSteps: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const settle = () => sleep(650);

export async function runAudit(m: BrowserManager, p: AuditParams): Promise<AuditReport> {
  const page = m.requirePage();
  const original = page.viewportSize();
  // Load vitals read before any viewport change: the resize itself causes layout shifts and
  // long tasks (ResizeObserver, canvases) that don't belong to the page loading and would inflate CLS.
  const perf = await perfSnapshot(m);
  const issues: AuditIssue[] = [];
  const push = (issue: Omit<AuditIssue, 'targets'> & { targets?: string[] }) => issues.push({ targets: [], ...issue });
  const viewports: ViewportAudit[] = [];

  try {
    for (const vp of p.viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await settle();
      const c = await page.evaluate(auditChecks, { mobile: vp.width < 600, tapMin: BUDGET.tapTargetMin, tapComfort: BUDGET.tapTargetComfort, mobileTextMin: BUDGET.mobileTextMin });
      const name = `${vp.name} ${vp.width}x${vp.height}`;
      const local: AuditIssue[] = [];
      const add = (issue: Omit<AuditIssue, 'viewport' | 'targets'> & { targets?: string[] }) => local.push({ targets: [], viewport: name, ...issue });

      if (c.overflowX > 1) add({ id: 'overflow-x', category: 'responsive', severity: 'error', message: `horizontal scroll of ${c.overflowX}px`, targets: c.offenders.map((o) => `${o.selector} (+${o.by}px)`) });
      if (c.tooSmall.length) add({ id: 'tap-target', category: 'accessibility', severity: 'error', message: `${c.tooSmall.length} touch target(s) smaller than ${BUDGET.tapTargetMin}px (WCAG 2.5.8)`, targets: c.tooSmall });
      if (c.uncomfortable.length) add({ id: 'tap-comfort', category: 'responsive', severity: 'warning', message: `${c.uncomfortable.length} target(s) below ${BUDGET.tapTargetComfort}px (comfortable for the thumb)`, targets: c.uncomfortable });
      if (c.smallText.length) add({ id: 'small-text', category: 'responsive', severity: 'warning', message: `text smaller than ${BUDGET.mobileTextMin}px on mobile`, targets: c.smallText });
      if (c.missingAlt.length) add({ id: 'img-alt', category: 'accessibility', severity: 'error', message: `${c.missingAlt.length} image(s) without alt`, targets: c.missingAlt });
      if (c.noDimensions.length) add({ id: 'img-dimensions', category: 'performance', severity: 'warning', message: `${c.noDimensions.length} image(s) without width/height or aspect-ratio (layout shift risk)`, targets: c.noDimensions });
      if (c.unnamedButtons.length) add({ id: 'button-name', category: 'accessibility', severity: 'error', message: 'buttons without an accessible name', targets: c.unnamedButtons });
      if (c.unnamedLinks.length) add({ id: 'link-name', category: 'accessibility', severity: 'error', message: 'links without text or aria-label', targets: c.unnamedLinks });
      if (c.unlabeledInputs.length) add({ id: 'input-label', category: 'accessibility', severity: 'error', message: 'form fields without a label', targets: c.unlabeledInputs });
      if (c.fakeLinks.length) add({ id: 'fake-link', category: 'accessibility', severity: 'warning', message: '<a> without a real href (use <button> for actions)', targets: c.fakeLinks });
      if (c.unsafeBlank.length) add({ id: 'blank-noopener', category: 'seo', severity: 'warning', message: 'target="_blank" without rel="noopener"', targets: c.unsafeBlank });
      if (c.h1 !== 1) add({ id: 'h1-count', category: 'content', severity: 'warning', message: `${c.h1} <h1> on the page (expected: 1)` });
      if (c.skipped.length) add({ id: 'heading-skip', category: 'content', severity: 'warning', message: 'skipped heading levels', targets: c.skipped });
      if (!c.lang) add({ id: 'html-lang', category: 'accessibility', severity: 'error', message: '<html> without a lang attribute' });
      if (!c.title) add({ id: 'title', category: 'seo', severity: 'error', message: 'page without <title>' });
      if (!c.description) add({ id: 'meta-description', category: 'seo', severity: 'warning', message: 'no meta description' });
      if (!c.viewportMeta) add({ id: 'meta-viewport', category: 'responsive', severity: 'error', message: 'no <meta name="viewport">' });
      if (!c.ogImage) add({ id: 'og-image', category: 'seo', severity: 'info', message: 'no og:image (share preview)' });

      const shot = join(p.dir, `${vp.name}-${vp.width}x${vp.height}.png`);
      await page.screenshot({ path: shot, fullPage: p.fullPage, animations: 'allow', caret: 'hide', scale: 'css', timeout: 60_000 }).catch(() => null);
      viewports.push({ name, width: vp.width, height: vp.height, screenshot: shot, overflowX: c.overflowX, issues: local });
      issues.push(...local);
    }
  } finally {
    if (original) await page.setViewportSize(original).catch(() => undefined);
    await settle();
  }

  // Contrast (on the original viewport) through web-scrap's own scanner.
  const scan = await page.evaluate(scanPage, { maxElements: 3000, extraVarNames: [] });
  const certain = scan.contrast.issues.filter((i) => !i.uncertain);
  const unsure = scan.contrast.issues.filter((i) => i.uncertain);
  if (certain.length) push({ id: 'contrast', category: 'accessibility', severity: 'error', viewport: 'desktop', message: `${certain.length} text(s) below WCAG AA contrast`, targets: certain.slice(0, 10).map((i) => `${i.selector} ${i.ratio}:1 (min ${i.required})`) });
  if (unsure.length) push({ id: 'contrast-unsure', category: 'accessibility', severity: 'info', viewport: 'desktop', message: `${unsure.length} text(s) over image/video/WebGL to check visually`, targets: unsure.slice(0, 6).map((i) => i.selector) });

  // Visible focus: a real Tab, comparing the focused element with itself unfocused.
  // Transitions off during the probe: with `transition-all`, reading the style the moment the
  // transition starts returns the starting value and would report missing focus (a false positive).
  const missingFocus: string[] = [];
  let focused = 0;
  const noTransitions = await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' }).catch(() => null);
  await page.mouse.click(2, 2).catch(() => undefined);
  for (let i = 0; i < p.focusSteps; i++) {
    await page.keyboard.press('Tab');
    await sleep(120);
    const on = await page.evaluate(focusProbe);
    if (!on) continue;
    focused++;
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await sleep(80);
    const off = await page.evaluate(() => {
      const el = document.querySelector('[data-parede-focus]');
      if (!el) return null;
      el.removeAttribute('data-parede-focus');
      const cs = getComputedStyle(el);
      return [cs.outlineStyle, cs.outlineWidth, cs.outlineColor, cs.boxShadow, cs.borderTopColor, cs.backgroundColor, cs.color, cs.textDecorationLine, cs.transform].join('|');
    });
    if (off !== null && off === on.styles) missingFocus.push(on.selector);
    // put focus back where the sequential navigation was
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
  }
  await noTransitions?.evaluate((el) => (el as Element).remove()).catch(() => undefined);
  if (focused === 0) push({ id: 'no-focusable', category: 'accessibility', severity: 'warning', viewport: 'desktop', message: 'Tab reached no element (trapped focus or no interactive elements)' });
  if (missingFocus.length) push({ id: 'focus-visible', category: 'accessibility', severity: 'error', viewport: 'desktop', message: `${missingFocus.length} element(s) without a visible focus indicator`, targets: [...new Set(missingFocus)] });

  // Motion: animation libraries without prefers-reduced-motion handling.
  const motion = await page.evaluate(collectMotion);
  const animated = motion.libraries.length > 0 || motion.running.total > 3;
  if (animated && !motion.reducedMotion.respected) {
    push({ id: 'reduced-motion', category: 'motion', severity: 'warning', viewport: 'all', message: `there is motion (${motion.libraries.join(', ') || `${motion.running.total} animations`}) but no prefers-reduced-motion rule was found` });
  }

  // Performance: Web Vitals (read at the start) + weight budget.
  const totalBytes = m.network.reduce((n, e) => n + (e.bytes ?? 0), 0);
  const jsBytes = m.network.filter((e) => e.type === 'script').reduce((n, e) => n + (e.bytes ?? 0), 0);
  const fontFiles = m.network.filter((e) => e.type === 'font').length;
  if (perf.cls !== null && perf.cls > BUDGET.clsWarn) push({ id: 'cls', category: 'performance', severity: perf.cls > BUDGET.clsError ? 'error' : 'warning', viewport: 'load', message: `CLS ${perf.cls} (good ≤ ${BUDGET.clsWarn})` });
  if (perf.lcpMs !== null && perf.lcpMs > BUDGET.lcpWarnMs) push({ id: 'lcp', category: 'performance', severity: perf.lcpMs > BUDGET.lcpErrorMs ? 'error' : 'warning', viewport: 'load', message: `LCP ${(perf.lcpMs / 1000).toFixed(2)}s on ${perf.lcpElement ?? '?'} (good ≤ 2.5s)` });
  if (perf.longTasks > BUDGET.longTasksWarn) push({ id: 'long-tasks', category: 'performance', severity: 'warning', viewport: 'load', message: `${perf.longTasks} long tasks (${perf.longTaskMs}ms blocking the main thread)` });
  if (totalBytes > BUDGET.bytesWarn) push({ id: 'weight', category: 'performance', severity: totalBytes > BUDGET.bytesError ? 'error' : 'warning', viewport: 'load', message: `${(totalBytes / 1048576).toFixed(1)} MB transferred` });
  if (jsBytes > BUDGET.jsWarn) push({ id: 'js-weight', category: 'performance', severity: 'warning', viewport: 'load', message: `${(jsBytes / 1048576).toFixed(1)} MB of JavaScript` });
  if (fontFiles > BUDGET.fontFilesWarn) push({ id: 'font-files', category: 'performance', severity: 'warning', viewport: 'load', message: `${fontFiles} font files (subsetting/a variable font would reduce them)` });

  const errors = (await m.consoleEntries()).filter((c) => c.type === 'error' || c.type === 'pageerror');
  if (errors.length) push({ id: 'console', category: 'console', severity: 'error', viewport: 'all', message: `${errors.length} console error(s)`, targets: errors.slice(0, 6).map((e) => e.text.slice(0, 140)) });
  const failed = m.network.filter((e) => e.failure || (e.status ?? 0) >= 400);
  if (failed.length) push({ id: 'network-fail', category: 'console', severity: 'warning', viewport: 'load', message: `${failed.length} failed request(s)`, targets: failed.slice(0, 6).map((e) => `${e.status ?? e.failure} ${e.url.slice(0, 100)}`) });

  const { scores, overall, verdict } = scoreAudit(issues);
  return {
    url: page.url(),
    generatedAt: new Date().toISOString(),
    viewports,
    issues,
    scores,
    overall,
    verdict,
    perf: { ...perf, requests: m.network.length, totalBytes, jsBytes, fontFiles },
    reportFile: null,
  };
}
