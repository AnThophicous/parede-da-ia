import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describeAction, type Action } from '../../domain/actions.js';
import { ParedeError } from '../../domain/errors.js';
import { imageSize } from '../../domain/image.js';
import type { Viewport } from '../../domain/units.js';
import { runAction } from './control.js';
import { startObserve, stopObserve } from './inject/motion.js';
import type { BrowserManager } from './manager.js';

export interface RecordParams {
  dir: string;
  intervalMs: number;
  durationMs?: number;
  maxFrames: number;
  actions: Action[];
  tailMs: number;
  format: 'png' | 'jpeg';
  quality?: number;
  viewport?: Viewport;
  stopFile: string;
  /** Crops the spritesheet/video to this element's box (its position when the recording starts). */
  selector?: string;
}

const CROP_PAD = 16;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Captures a frame every `intervalMs` while (optionally) running actions in parallel.
 * Stops when: the duration ends, the frame limit is reached, the stop file appears
 * or — in `--while` mode without a duration — the actions finish and the tail is recorded.
 */
export async function recordFrames(m: BrowserManager, p: RecordParams) {
  const page = m.requirePage();
  const framesDir = join(p.dir, 'frames');
  mkdirSync(framesDir, { recursive: true });

  const previousViewport = page.viewportSize();
  if (p.viewport) {
    await page.setViewportSize(p.viewport);
    await sleep(250);
  }

  const frames: { index: number; t: number; scrollY: number }[] = [];
  const actionLog: { action: string; startedAt: number; endedAt?: number; error?: string }[] = [];
  const ext = p.format === 'jpeg' ? 'jpg' : 'png';
  const start = Date.now();
  let actionsDone = p.actions.length === 0;
  let actionsEndedAt = 0;
  let lagged = 0;

  // Compositor screencast: Chromium pushes frames when the screen changes; on every tick
  // we record the latest one. It forces no extra renders (unlike page.screenshot),
  // so it works even on heavy WebGL scenes on modest machines.
  const viewport = page.viewportSize() ?? { width: 1280, height: 800 };
  let latest: Buffer | null = null;
  let freshFrames = 0;
  const cdp = m.context ? await m.context.newCDPSession(page).catch(() => null) : null;
  if (cdp) {
    cdp.on('Page.screencastFrame', (frame: { data: string; sessionId: number }) => {
      latest = Buffer.from(frame.data, 'base64');
      freshFrames++;
      void cdp.send('Page.screencastFrameAck', { sessionId: frame.sessionId }).catch(() => undefined);
    });
    await cdp.send('Page.startScreencast', { format: p.format, quality: p.quality ?? 85, maxWidth: viewport.width, maxHeight: viewport.height, everyNthFrame: 1 });
    const firstFrameDeadline = Date.now() + 5000;
    while (!latest && Date.now() < firstFrameDeadline) await sleep(30);
  }

  // Crop by element: converts the CSS box to the screencast frame's pixels.
  let crop: { x: number; y: number; width: number; height: number } | null = null;
  if (p.selector) {
    const locator = page.locator(p.selector).first();
    await locator.scrollIntoViewIfNeeded({ timeout: 8000 }).catch(() => undefined);
    const box = await locator.boundingBox();
    if (!box) throw new ParedeError('SELECTOR', `"${p.selector}" is not visible to crop.`, 'Run `web-control inventory` to list visible targets.');
    const size = latest ? imageSize(latest) : null;
    const scale = size ? size.width / viewport.width : 1;
    const x = Math.max(0, (box.x - CROP_PAD) * scale);
    const y = Math.max(0, (box.y - CROP_PAD) * scale);
    const maxW = (size?.width ?? viewport.width) - x;
    const maxH = (size?.height ?? viewport.height) - y;
    crop = { x, y, width: Math.min(maxW, (box.width + CROP_PAD * 2) * scale), height: Math.min(maxH, (box.height + CROP_PAD * 2) * scale) };
  }

  // Watches what animates (inline styles/classes) and the page's real frame cadence.
  await page.evaluate(startObserve).catch(() => undefined);

  const actionsRun = (async () => {
    if (!p.actions.length) return;
    await sleep(Math.min(p.intervalMs, 400));
    for (const action of p.actions) {
      const entry: { action: string; startedAt: number; endedAt?: number; error?: string } = { action: describeAction(action), startedAt: Date.now() - start };
      actionLog.push(entry);
      try {
        await runAction(m, action);
      } catch (err) {
        entry.error = (err as Error).message.split('\n')[0];
      }
      entry.endedAt = Date.now() - start;
    }
    actionsDone = true;
    actionsEndedAt = Date.now() - start;
  })();

  // scrollY is sampled in parallel: one evaluate per frame would block the recording clock.
  let lastScrollY = -1;
  let polling = false;
  const scrollPoll = setInterval(() => {
    if (polling) return;
    polling = true;
    page.evaluate(() => Math.round(window.scrollY)).then((y) => (lastScrollY = y), () => undefined).finally(() => (polling = false));
  }, 200);

  let stopReason = 'duration';
  try {
    for (let i = 0; ; i++) {
      const elapsed = Date.now() - start;
      if (p.durationMs !== undefined && elapsed >= p.durationMs) break;
      if (p.durationMs === undefined && actionsDone && elapsed >= actionsEndedAt + p.tailMs) {
        stopReason = 'actions finished';
        break;
      }
      if (frames.length >= p.maxFrames) {
        stopReason = 'frame limit';
        break;
      }
      if (existsSync(p.stopFile)) {
        stopReason = 'stop requested';
        break;
      }

      const file = join(framesDir, `frame_${String(i).padStart(5, '0')}.${ext}`);
      if (latest) writeFileSync(file, latest);
      else await page.screenshot({ path: file, type: p.format, quality: p.format === 'jpeg' ? (p.quality ?? 85) : undefined, scale: 'css', animations: 'allow', caret: 'initial' });
      frames.push({ index: i, t: elapsed, scrollY: lastScrollY });

      const next = start + (i + 1) * p.intervalMs;
      const wait = next - Date.now();
      if (wait > 0) await sleep(wait);
      else lagged++;
    }
  } finally {
    clearInterval(scrollPoll);
    await actionsRun.catch(() => undefined);
    if (cdp) {
      await cdp.send('Page.stopScreencast').catch(() => undefined);
      await cdp.detach().catch(() => undefined);
    }
  }
  const observed = await page.evaluate(stopObserve).catch(() => null);
  if (p.viewport && previousViewport) await page.setViewportSize(previousViewport).catch(() => undefined);

  const result = {
    dir: p.dir,
    framesDir,
    format: p.format,
    frameCount: frames.length,
    intervalMs: p.intervalMs,
    durationMs: Date.now() - start,
    stopReason,
    laggedFrames: lagged,
    compositorFrames: freshFrames,
    source: cdp ? 'screencast' : 'screenshot',
    viewport: p.viewport ?? previousViewport,
    url: page.url(),
    crop,
    pageFrames: observed?.frames ?? null,
    animated: observed ? { elements: observed.elements.slice(0, 12), properties: observed.properties.slice(0, 8) } : null,
    frames,
    actions: actionLog,
  };
  writeFileSync(join(p.dir, 'frames.json'), JSON.stringify(result, null, 2));
  return result;
}
