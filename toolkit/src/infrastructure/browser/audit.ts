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

      if (c.overflowX > 1) add({ id: 'overflow-x', category: 'responsivo', severity: 'erro', message: `rolagem horizontal de ${c.overflowX}px`, targets: c.offenders.map((o) => `${o.selector} (+${o.by}px)`) });
      if (c.tooSmall.length) add({ id: 'tap-target', category: 'acessibilidade', severity: 'erro', message: `${c.tooSmall.length} alvo(s) de toque menores que ${BUDGET.tapTargetMin}px (WCAG 2.5.8)`, targets: c.tooSmall });
      if (c.uncomfortable.length) add({ id: 'tap-comfort', category: 'responsivo', severity: 'aviso', message: `${c.uncomfortable.length} alvo(s) abaixo de ${BUDGET.tapTargetComfort}px (confortável para o polegar)`, targets: c.uncomfortable });
      if (c.smallText.length) add({ id: 'small-text', category: 'responsivo', severity: 'aviso', message: `texto menor que ${BUDGET.mobileTextMin}px no mobile`, targets: c.smallText });
      if (c.missingAlt.length) add({ id: 'img-alt', category: 'acessibilidade', severity: 'erro', message: `${c.missingAlt.length} imagem(ns) sem alt`, targets: c.missingAlt });
      if (c.noDimensions.length) add({ id: 'img-dimensions', category: 'performance', severity: 'aviso', message: `${c.noDimensions.length} imagem(ns) sem width/height ou aspect-ratio (risco de layout shift)`, targets: c.noDimensions });
      if (c.unnamedButtons.length) add({ id: 'button-name', category: 'acessibilidade', severity: 'erro', message: 'botões sem nome acessível', targets: c.unnamedButtons });
      if (c.unnamedLinks.length) add({ id: 'link-name', category: 'acessibilidade', severity: 'erro', message: 'links sem texto ou aria-label', targets: c.unnamedLinks });
      if (c.unlabeledInputs.length) add({ id: 'input-label', category: 'acessibilidade', severity: 'erro', message: 'campos de formulário sem rótulo', targets: c.unlabeledInputs });
      if (c.fakeLinks.length) add({ id: 'fake-link', category: 'acessibilidade', severity: 'aviso', message: '<a> sem href real (use <button> para ações)', targets: c.fakeLinks });
      if (c.unsafeBlank.length) add({ id: 'blank-noopener', category: 'seo', severity: 'aviso', message: 'target="_blank" sem rel="noopener"', targets: c.unsafeBlank });
      if (c.h1 !== 1) add({ id: 'h1-count', category: 'conteudo', severity: 'aviso', message: `${c.h1} <h1> na página (esperado: 1)` });
      if (c.skipped.length) add({ id: 'heading-skip', category: 'conteudo', severity: 'aviso', message: 'níveis de título pulados', targets: c.skipped });
      if (!c.lang) add({ id: 'html-lang', category: 'acessibilidade', severity: 'erro', message: '<html> sem atributo lang' });
      if (!c.title) add({ id: 'title', category: 'seo', severity: 'erro', message: 'página sem <title>' });
      if (!c.description) add({ id: 'meta-description', category: 'seo', severity: 'aviso', message: 'sem meta description' });
      if (!c.viewportMeta) add({ id: 'meta-viewport', category: 'responsivo', severity: 'erro', message: 'sem <meta name="viewport">' });
      if (!c.ogImage) add({ id: 'og-image', category: 'seo', severity: 'info', message: 'sem og:image (prévia ao compartilhar)' });

      const shot = join(p.dir, `${vp.name}-${vp.width}x${vp.height}.png`);
      await page.screenshot({ path: shot, fullPage: p.fullPage, animations: 'allow', caret: 'hide', scale: 'css', timeout: 60_000 }).catch(() => null);
      viewports.push({ name, width: vp.width, height: vp.height, screenshot: shot, overflowX: c.overflowX, issues: local });
      issues.push(...local);
    }
  } finally {
    if (original) await page.setViewportSize(original).catch(() => undefined);
    await settle();
  }

  // Contraste (no viewport original) via o mesmo scanner do web-scrap.
  const scan = await page.evaluate(scanPage, { maxElements: 3000, extraVarNames: [] });
  const certain = scan.contrast.issues.filter((i) => !i.uncertain);
  const unsure = scan.contrast.issues.filter((i) => i.uncertain);
  if (certain.length) push({ id: 'contrast', category: 'acessibilidade', severity: 'erro', viewport: 'desktop', message: `${certain.length} texto(s) abaixo do contraste WCAG AA`, targets: certain.slice(0, 10).map((i) => `${i.selector} ${i.ratio}:1 (mín ${i.required})`) });
  if (unsure.length) push({ id: 'contrast-unsure', category: 'acessibilidade', severity: 'info', viewport: 'desktop', message: `${unsure.length} texto(s) sobre imagem/vídeo/WebGL para conferir visualmente`, targets: unsure.slice(0, 6).map((i) => i.selector) });

  // Foco visível: Tab real, compara o elemento focado com ele mesmo sem foco.
  const missingFocus: string[] = [];
  let focused = 0;
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
    // devolve o foco ao ponto da navegação sequencial
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
  }
  if (focused === 0) push({ id: 'no-focusable', category: 'acessibilidade', severity: 'aviso', viewport: 'desktop', message: 'Tab não alcançou nenhum elemento (foco preso ou sem interativos)' });
  if (missingFocus.length) push({ id: 'focus-visible', category: 'acessibilidade', severity: 'erro', viewport: 'desktop', message: `${missingFocus.length} elemento(s) sem indicador de foco visível`, targets: [...new Set(missingFocus)] });

  // Movimento: bibliotecas de animação sem tratamento de prefers-reduced-motion.
  const motion = await page.evaluate(collectMotion);
  const animated = motion.libraries.length > 0 || motion.running.total > 3;
  if (animated && !motion.reducedMotion.respected) {
    push({ id: 'reduced-motion', category: 'movimento', severity: 'aviso', viewport: 'todos', message: `há movimento (${motion.libraries.join(', ') || `${motion.running.total} animações`}) mas nenhuma regra prefers-reduced-motion foi encontrada` });
  }

  // Performance: Web Vitals + orçamento de peso.
  const perf = await perfSnapshot(m);
  const totalBytes = m.network.reduce((n, e) => n + (e.bytes ?? 0), 0);
  const jsBytes = m.network.filter((e) => e.type === 'script').reduce((n, e) => n + (e.bytes ?? 0), 0);
  const fontFiles = m.network.filter((e) => e.type === 'font').length;
  if (perf.cls !== null && perf.cls > BUDGET.clsWarn) push({ id: 'cls', category: 'performance', severity: perf.cls > BUDGET.clsError ? 'erro' : 'aviso', viewport: 'carga', message: `CLS ${perf.cls} (bom ≤ ${BUDGET.clsWarn})` });
  if (perf.lcpMs !== null && perf.lcpMs > BUDGET.lcpWarnMs) push({ id: 'lcp', category: 'performance', severity: perf.lcpMs > BUDGET.lcpErrorMs ? 'erro' : 'aviso', viewport: 'carga', message: `LCP ${(perf.lcpMs / 1000).toFixed(2)}s em ${perf.lcpElement ?? '?'} (bom ≤ 2.5s)` });
  if (perf.longTasks > BUDGET.longTasksWarn) push({ id: 'long-tasks', category: 'performance', severity: 'aviso', viewport: 'carga', message: `${perf.longTasks} long tasks (${perf.longTaskMs}ms bloqueando a main thread)` });
  if (totalBytes > BUDGET.bytesWarn) push({ id: 'weight', category: 'performance', severity: totalBytes > BUDGET.bytesError ? 'erro' : 'aviso', viewport: 'carga', message: `${(totalBytes / 1048576).toFixed(1)} MB transferidos` });
  if (jsBytes > BUDGET.jsWarn) push({ id: 'js-weight', category: 'performance', severity: 'aviso', viewport: 'carga', message: `${(jsBytes / 1048576).toFixed(1)} MB de JavaScript` });
  if (fontFiles > BUDGET.fontFilesWarn) push({ id: 'font-files', category: 'performance', severity: 'aviso', viewport: 'carga', message: `${fontFiles} arquivos de fonte (subconjunto/variable font reduziriam)` });

  const errors = (await m.consoleEntries()).filter((c) => c.type === 'error' || c.type === 'pageerror');
  if (errors.length) push({ id: 'console', category: 'console', severity: 'erro', viewport: 'todos', message: `${errors.length} erro(s) de console`, targets: errors.slice(0, 6).map((e) => e.text.slice(0, 140)) });
  const failed = m.network.filter((e) => e.failure || (e.status ?? 0) >= 400);
  if (failed.length) push({ id: 'network-fail', category: 'console', severity: 'aviso', viewport: 'carga', message: `${failed.length} requisição(ões) com falha`, targets: failed.slice(0, 6).map((e) => `${e.status ?? e.failure} ${e.url.slice(0, 100)}`) });

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
