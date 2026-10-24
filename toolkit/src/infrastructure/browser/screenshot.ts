import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Page } from 'playwright';
import type { Viewport } from '../../domain/units.js';
import type { BrowserManager } from './manager.js';

export interface ScreenshotParams {
  path: string;
  fullPage?: boolean;
  selector?: string;
  dpr?: number;
  viewport?: Viewport;
  clean?: boolean;
  hide?: string[];
  /** Oculta (só visualmente) banners de cookie/consentimento conhecidos. Nunca aceita nada. */
  hideBanners?: boolean;
  scrollThrough?: boolean;
  quality?: number;
  timeoutMs?: number;
}

const BANNER_SELECTORS = [
  '#onetrust-banner-sdk', '#onetrust-consent-sdk', '#CybotCookiebotDialog', '.cc-window', '.cky-consent-container',
  '#usercentrics-root', '.qc-cmp2-container', '#didomi-host', '.osano-cm-window', '#truste-consent-track',
  '[id*="cookie-banner" i]', '[class*="cookie-banner" i]', '[id*="cookie-consent" i]', '[class*="cookie-consent" i]',
  '[class*="cookies-bar" i]', '[aria-label*="cookie" i][role="dialog"]', '[aria-label*="consent" i][role="dialog"]',
];

/** CSS que remove "ruído de navegador": scrollbars, caret piscando, highlights de foco. */
const CLEAN_CSS = `
  html { scrollbar-width: none !important; }
  ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
  *, *::before, *::after { caret-color: transparent !important; }
  ::selection { background: transparent !important; }
`;

const MAX_TEXTURE = 16_384;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const settle = (page: Page) =>
  page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));

/** Rola a página inteira com wheel real para disparar lazy-load e reveals de scroll. */
async function scrollThrough(m: BrowserManager, page: Page) {
  const vp = page.viewportSize() ?? { width: 1280, height: 800 };
  await page.mouse.move(vp.width / 2, vp.height / 2);
  m.mouse = { x: vp.width / 2, y: vp.height / 2, known: true };
  let last = -1;
  for (let i = 0; i < 200; i++) {
    const y = await page.evaluate(() => window.scrollY);
    const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    if (y >= max - 2 || Math.abs(y - last) < 1) break;
    last = y;
    await page.mouse.wheel(0, vp.height * 0.6);
    await sleep(140);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(500);
}

export async function takeScreenshot(m: BrowserManager, p: ScreenshotParams) {
  const page = m.requirePage();
  const previousViewport = page.viewportSize();
  const warnings: string[] = [];
  const injected: { evaluate: (fn: (el: Element) => void) => Promise<void> }[] = [];
  let cdp: Awaited<ReturnType<NonNullable<typeof m.context>['newCDPSession']>> | null = null;

  try {
    if (p.viewport) {
      await page.setViewportSize(p.viewport);
      await sleep(250);
    }
    const viewport = page.viewportSize() ?? { width: 1280, height: 800 };
    const contextDpr = m.options?.dpr ?? 1;
    const dpr = p.dpr ?? contextDpr;

    if (p.scrollThrough) await scrollThrough(m, page);
    if (p.clean !== false) injected.push(await page.addStyleTag({ content: CLEAN_CSS }));
    const hidden = [...(p.hide ?? []), ...(p.hideBanners ? BANNER_SELECTORS : [])];
    if (hidden.length) {
      injected.push(await page.addStyleTag({ content: `${hidden.join(', ')} { visibility: hidden !important; }` }));
    }
    await settle(page);

    const docSize = await page.evaluate(() => {
      const scroller = document.scrollingElement ?? document.documentElement;
      const nested = Array.from(document.querySelectorAll('body *')).some((el) => {
        const cs = getComputedStyle(el);
        return /(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight * 1.5 && el.clientHeight >= window.innerHeight * 0.8;
      });
      return { width: scroller.scrollWidth, height: scroller.scrollHeight, nestedScroller: nested };
    });
    if (p.fullPage && docSize.height * dpr > MAX_TEXTURE) {
      warnings.push(`Página com ${docSize.height}px × dpr ${dpr} excede ${MAX_TEXTURE}px de textura; partes podem sair em branco. Use --dpr 1 ou capture por seções.`);
    }
    if (p.fullPage && docSize.nestedScroller && docSize.height <= viewport.height + 4) {
      warnings.push('O conteúdo rola dentro de um container (smooth-scroll com transform). Full-page só pega a viewport: prefira web-record-frames + scroll-down.');
    }

    mkdirSync(dirname(p.path), { recursive: true });
    const type = /\.jpe?g$/i.test(p.path) ? 'jpeg' : 'png';
    const options = { path: p.path, type, quality: type === 'jpeg' ? (p.quality ?? 92) : undefined, animations: 'allow', caret: 'hide', scale: 'device' } as const;
    let buffer: Buffer;
    if (dpr !== contextDpr && m.context) {
      // DPR diferente do contexto: Page.captureScreenshot com clip.scale re-rasteriza o conteúdo
      // na escala pedida (nitidez real, não bitmap esticado) sem recriar o contexto.
      cdp = await m.context.newCDPSession(page);
      const clip = p.selector
        ? await page.locator(p.selector).first().evaluate((el) => {
            const r = el.getBoundingClientRect();
            return { x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height };
          })
        : p.fullPage
          ? { x: 0, y: 0, width: docSize.width, height: docSize.height }
          : await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY, width: window.innerWidth, height: window.innerHeight }));
      const shot = (await cdp.send('Page.captureScreenshot', {
        format: type,
        quality: options.quality,
        captureBeyondViewport: true,
        clip: { ...clip, scale: dpr / contextDpr },
      })) as { data: string };
      buffer = Buffer.from(shot.data, 'base64');
      writeFileSync(p.path, buffer);
    } else {
      buffer = p.selector
        ? await page.locator(p.selector).first().screenshot({ ...options, timeout: p.timeoutMs ?? 60_000 })
        : await page.screenshot({ ...options, fullPage: Boolean(p.fullPage), timeout: p.timeoutMs ?? 60_000 });
    }

    const size = type === 'png' && buffer.length > 24 ? { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) } : null;
    return {
      path: p.path,
      bytes: buffer.length,
      pixels: size,
      dpr,
      viewport,
      fullPage: Boolean(p.fullPage),
      selector: p.selector ?? null,
      document: { width: docSize.width, height: docSize.height },
      warnings,
    };
  } finally {
    for (const handle of injected) await handle.evaluate((el) => el.remove()).catch(() => undefined);
    if (cdp) await cdp.detach().catch(() => undefined);
    if (previousViewport && p.viewport) await page.setViewportSize(previousViewport).catch(() => undefined);
  }
}
