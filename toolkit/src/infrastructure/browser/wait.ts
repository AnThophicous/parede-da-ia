import { detectOverlay } from './inject/scanner.js';
import type { BrowserManager } from './manager.js';

/**
 * Espera "padrão ouro": load → networkidle → fontes prontas → dois frames pintados.
 * Se a rede nunca ociosa (analytics, long-polling, vídeo em stream), segue em frente e avisa.
 */
export async function waitPageLoad(m: BrowserManager, timeoutMs: number, idleCapMs = 10_000) {
  const page = m.requirePage();
  const started = Date.now();
  const warnings: string[] = [];

  await page.waitForLoadState('load', { timeout: timeoutMs });
  const remaining = () => Math.max(1000, timeoutMs - (Date.now() - started));
  try {
    // Sites com analytics/streams nunca ociosam: limita a espera para não travar o agente.
    await page.waitForLoadState('networkidle', { timeout: Math.min(remaining(), idleCapMs) });
  } catch {
    warnings.push('A rede não ficou ociosa (polling/analytics/stream). A página pode estar pronta mesmo assim.');
  }
  await page.evaluate(() => Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 4000))])).catch(() => undefined);
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))).catch(() => undefined);

  const overlay = await page.evaluate(detectOverlay).catch(() => null);
  if (overlay) {
    warnings.push(
      `Overlay de tela cheia detectado (${overlay.selector}${overlay.looksLikeLoader ? ', parece pre-loader' : ''}). ` +
        `Use \`web-wait <s>\` ou \`web-wait --until-hidden "${overlay.selector}"\` antes de capturar.`,
    );
  }

  const info = await page.evaluate(() => ({
    readyState: document.readyState,
    title: document.title,
    resources: performance.getEntriesByType('resource').length,
    documentHeight: document.documentElement.scrollHeight,
  }));
  const errors = await m.consoleErrorsSince(0);
  return { ...info, ms: Date.now() - started, overlay, consoleErrors: errors.length, firstErrors: errors.slice(0, 5), warnings };
}

export async function waitForSelector(m: BrowserManager, selector: string, state: 'hidden' | 'visible' | 'detached' | 'attached', timeoutMs: number) {
  const started = Date.now();
  await m.requirePage().locator(selector).first().waitFor({ state, timeout: timeoutMs });
  return { selector, state, ms: Date.now() - started };
}
