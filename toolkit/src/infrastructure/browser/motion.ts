import type { Action } from '../../domain/actions.js';
import type { MotionReport, Ranked } from '../../domain/reports.js';
import { runAction } from './control.js';
import { collectMotion, startObserve, stopObserve } from './inject/motion.js';
import type { BrowserManager } from './manager.js';

export interface MotionParams {
  /** Watches style mutations + frames for N ms (0 = only what is declared). */
  observeMs: number;
  /** Actions run during the observation (e.g. scroll-down 3000). */
  actions: Action[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Suggests motion tokens (CSS) from the most used durations/easings. */
function motionTokens(durations: Ranked[], easings: Ranked[]) {
  const ds = durations.slice(0, 4).map((d) => d.value);
  const es = easings.slice(0, 4).map((e) => e.value);
  const css = [
    ':root {',
    ...ds.map((d, i) => `  --motion-duration-${i + 1}: ${d};`),
    ...es.map((e, i) => `  --motion-ease-${i + 1}: ${e};`),
    '}',
  ].join('\n');
  return { durations: ds, easings: es, css };
}

export async function analyzeMotion(m: BrowserManager, p: MotionParams): Promise<MotionReport> {
  const page = m.requirePage();
  let observed: MotionReport['observed'] = null;
  let frames: MotionReport['frames'] = null;

  if (p.observeMs > 0 || p.actions.length) {
    await page.evaluate(startObserve);
    const started = Date.now();
    for (const action of p.actions) await runAction(m, action).catch(() => undefined);
    const remaining = p.observeMs - (Date.now() - started);
    if (remaining > 0) await sleep(remaining);
    const result = await page.evaluate(stopObserve);
    if (result) {
      observed = { durationMs: result.durationMs, mutations: result.mutations, elements: result.elements, properties: result.properties };
      frames = result.frames;
    }
  }

  const declared = await page.evaluate(collectMotion);
  return {
    ...declared,
    observed,
    frames,
    tokens: motionTokens(declared.transitions.durations, declared.transitions.easings),
  };
}
