import { join } from 'node:path';
import type { Page } from 'playwright';
import { diffStyles, focusIsVisible, isMagnetic, judgeInteraction, summarizeChanges, type StyleSnapshot } from '../../domain/interactions.js';
import type { InteractionItem, InteractionsReport } from '../../domain/reports.js';
import { inventoryPage } from './inject/scanner.js';
import { snapshotStyles } from './inject/styles.js';
import type { BrowserManager } from './manager.js';

export interface InteractionsParams {
  dir: string;
  limit: number;
  selector?: string;
  holdMs: number;
  shots: boolean;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const PAD = 20;

type Snap = { snapshot: StyleSnapshot; cursor: string; transition: string } | null;

async function crop(page: Page, box: { x: number; y: number; width: number; height: number }, file: string) {
  const vp = page.viewportSize() ?? { width: 1280, height: 800 };
  const x = Math.max(0, box.x - PAD);
  const y = Math.max(0, box.y - PAD);
  const width = Math.min(vp.width - x, box.width + PAD * 2);
  const height = Math.min(vp.height - y, box.height + PAD * 2);
  if (width < 4 || height < 4) return null;
  await page.screenshot({ path: file, clip: { x, y, width, height }, scale: 'css', animations: 'allow', caret: 'hide' });
  return file;
}

/** Builds a labeled before/hover/focus sheet on a temporary page and captures it. */
async function buildSheet(m: BrowserManager, items: InteractionItem[], file: string) {
  const { readFileSync } = await import('node:fs');
  const img = (p: string | null) => (p ? `<img src="data:image/png;base64,${readFileSync(p).toString('base64')}">` : '<div class="none">—</div>');
  const esc = (t: string) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
  const rows = items
    .map(
      (it, i) => `<section><h2>${i + 1}. ${esc(it.selector)} <small>${esc(it.label)}</small></h2>
      <div class="row"><figure>${img(it.shots.before)}<figcaption>before</figcaption></figure><figure>${img(it.shots.hover)}<figcaption>hover · ${esc(summarizeChanges(it.hover.changes, 3))}</figcaption></figure><figure>${img(it.shots.focus)}<figcaption>focus · ${it.focus.visible ? 'visible' : 'INVISIBLE'}</figcaption></figure></div>
      <p>${esc(it.verdict.join(' · ') || 'ok')}</p></section>`,
    )
    .join('');
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;padding:24px;background:#111;color:#eee;font:13px/1.4 ui-monospace,Menlo,Consolas,monospace}
    section{border-top:1px solid #333;padding:16px 0}h2{font-size:14px;margin:0 0 10px}small{color:#999;font-weight:400}
    .row{display:flex;gap:16px;align-items:flex-start}figure{margin:0;max-width:33%}img{display:block;max-width:100%;background:#fff;border:1px solid #333}
    figcaption{color:#aaa;margin-top:6px}p{color:#ccc;margin:10px 0 0}.none{padding:20px;color:#666}</style>${rows}`;
  const context = m.context!;
  const sheet = await context.newPage();
  try {
    await sheet.setViewportSize({ width: 1400, height: 900 });
    await sheet.setContent(html, { waitUntil: 'load' });
    await sheet.screenshot({ path: file, fullPage: true });
  } finally {
    await sheet.close();
  }
  return file;
}

export async function testInteractions(m: BrowserManager, p: InteractionsParams): Promise<InteractionsReport> {
  const page = m.requirePage();
  const vp = page.viewportSize() ?? { width: 1280, height: 800 };
  const rest = { x: vp.width - 2, y: vp.height - 2 };
  const targets = p.selector
    ? [{ selector: p.selector, tag: '', label: '' }]
    : (await page.evaluate(inventoryPage, p.limit * 3)).items.filter((i) => !i.disabled).slice(0, p.limit);

  const items: InteractionItem[] = [];
  for (const [index, target] of targets.entries()) {
    const locator = page.locator(target.selector).first();
    try {
      await locator.scrollIntoViewIfNeeded({ timeout: 4000 });
    } catch {
      continue;
    }
    await sleep(250);
    const box = await locator.boundingBox();
    if (!box || box.width < 2 || box.height < 2) continue;
    const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const snap = (): Promise<Snap> => page.evaluate(snapshotStyles, target.selector).catch(() => null);
    // Re-read the box on every capture: hovers with transforms and fixed menus move the target.
    const shot = async (kind: string) => {
      if (!p.shots) return null;
      const current = (await locator.boundingBox().catch(() => null)) ?? box;
      return crop(page, current, join(p.dir, `${String(index + 1).padStart(2, '0')}-${kind}.png`)).catch(() => null);
    };

    await page.mouse.move(rest.x, rest.y, { steps: 2 });
    await sleep(p.holdMs / 2);
    const before = await snap();
    if (!before) continue;
    const beforeShot = await shot('before');

    await page.mouse.move(center.x, center.y, { steps: 8 });
    await sleep(p.holdMs);
    const hover = await snap();
    const hoverShot = await shot('hover');

    // Magnetic probe: moves the cursor inside the target and checks whether the translation follows it.
    const nudge = { x: box.width * 0.3, y: box.height * 0.2 };
    await page.mouse.move(center.x + nudge.x, center.y + nudge.y, { steps: 4 });
    await sleep(Math.max(300, p.holdMs / 2));
    const nudged = await snap();
    const magnetic = Boolean(hover && nudged && isMagnetic(hover.snapshot, nudged.snapshot, nudge));

    // :active without firing a click: press, measure, leave the target and release.
    await page.mouse.move(center.x, center.y, { steps: 2 });
    await page.mouse.down();
    await sleep(140);
    const pressed = await snap();
    await page.mouse.move(rest.x, rest.y, { steps: 2 });
    await page.mouse.up();
    // pressing and dragging to the rest point selects text: clear it so the next crops stay clean
    await page.evaluate(() => window.getSelection()?.removeAllRanges()).catch(() => undefined);
    m.mouse = { x: rest.x, y: rest.y, known: true };
    await sleep(p.holdMs / 2);

    // Keyboard focus: Shift switches to keyboard modality, so :focus-visible applies.
    await page.keyboard.press('Shift');
    await locator.focus().catch(() => undefined);
    await sleep(p.holdMs / 2);
    const focused = await snap();
    const focusShot = await shot('focus');
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

    const hoverChanges = hover ? diffStyles(before.snapshot, hover.snapshot) : [];
    const focusChanges = focused ? diffStyles(before.snapshot, focused.snapshot) : [];
    const pressChanges = pressed && hover ? diffStyles(hover.snapshot, pressed.snapshot) : [];
    const base = {
      selector: target.selector,
      tag: target.tag || (await locator.evaluate((el) => el.tagName.toLowerCase()).catch(() => '?')),
      label: target.label,
      cursor: hover?.cursor ?? before.cursor,
      hover: { changes: hoverChanges, transition: hover?.transition ?? before.transition, magnetic },
      focus: { changes: focusChanges, visible: focusIsVisible(focusChanges) },
      press: { changes: pressChanges },
      shots: { before: beforeShot, hover: hoverShot, focus: focusShot },
    };
    items.push({ ...base, verdict: judgeInteraction(base) });
  }

  const sheet = p.shots && items.length ? await buildSheet(m, items, join(p.dir, 'interactions.png')).catch(() => null) : null;
  return {
    url: page.url(),
    tested: items.length,
    items,
    sheet,
    withoutHoverFeedback: items.filter((i) => !i.hover.changes.length).length,
    withoutFocusIndicator: items.filter((i) => !i.focus.visible).length,
    magnetic: items.filter((i) => i.hover.magnetic).length,
  };
}
