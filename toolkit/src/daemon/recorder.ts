import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describeAction, type Action } from '../core/actions.js';
import type { Viewport } from '../core/units.js';
import type { BrowserManager } from './browser.js';
import { runAction } from './control.js';

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
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Captura um frame a cada `intervalMs` enquanto (opcionalmente) executa ações em paralelo.
 * Para quando: a duração acaba, o limite de frames é atingido, o arquivo de stop aparece
 * ou — no modo `--while` sem duração — as ações terminam e o "rabo" (tail) é gravado.
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

  // Screencast do compositor: o Chromium empurra frames quando a tela muda; a cada tick
  // gravamos o mais recente. Não força renders extras (ao contrário de page.screenshot),
  // então funciona mesmo em cenas WebGL pesadas em máquinas modestas.
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

  // scrollY é amostrado em paralelo: um evaluate por frame bloquearia o relógio da gravação.
  let lastScrollY = -1;
  let polling = false;
  const scrollPoll = setInterval(() => {
    if (polling) return;
    polling = true;
    page.evaluate(() => Math.round(window.scrollY)).then((y) => (lastScrollY = y), () => undefined).finally(() => (polling = false));
  }, 200);

  let stopReason = 'duração';
  try {
    for (let i = 0; ; i++) {
      const elapsed = Date.now() - start;
      if (p.durationMs !== undefined && elapsed >= p.durationMs) break;
      if (p.durationMs === undefined && actionsDone && elapsed >= actionsEndedAt + p.tailMs) {
        stopReason = 'ações concluídas';
        break;
      }
      if (frames.length >= p.maxFrames) {
        stopReason = 'limite de frames';
        break;
      }
      if (existsSync(p.stopFile)) {
        stopReason = 'stop solicitado';
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
    if (p.viewport && previousViewport) await page.setViewportSize(previousViewport).catch(() => undefined);
  }

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
    frames,
    actions: actionLog,
  };
  writeFileSync(join(p.dir, 'frames.json'), JSON.stringify(result, null, 2));
  return result;
}
