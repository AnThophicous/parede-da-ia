import { detectOverlay } from './inject/scanner.js';
import type { BrowserManager } from './manager.js';

/**
 * The "gold standard" wait: load → networkidle → fonts ready → two painted frames.
 * If the network never goes idle (analytics, long polling, streaming video), it moves on and warns.
 */
export async function waitPageLoad(m: BrowserManager, timeoutMs: number, idleCapMs = 10_000) {
  const page = m.requirePage();
  const started = Date.now();
  const warnings: string[] = [];

  await page.waitForLoadState('load', { timeout: timeoutMs });
  const remaining = () => Math.max(1000, timeoutMs - (Date.now() - started));
  try {
    // Sites with analytics/streams never go idle: cap the wait so the agent never hangs.
    await page.waitForLoadState('networkidle', { timeout: Math.min(remaining(), idleCapMs) });
  } catch {
    warnings.push('The network never went idle (polling/analytics/stream). The page may be ready anyway.');
  }
  await page.evaluate(() => Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 4000))])).catch(() => undefined);
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))).catch(() => undefined);

  const overlay = await page.evaluate(detectOverlay).catch(() => null);
  if (overlay) {
    warnings.push(
      `Full-screen overlay detected (${overlay.selector}${overlay.looksLikeLoader ? ', looks like a preloader' : ''}). ` +
        `Use \`web-wait <s>\` or \`web-wait --until-hidden "${overlay.selector}"\` before capturing.`,
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
