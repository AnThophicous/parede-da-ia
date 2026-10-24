import type { Page } from 'playwright';
import { describeAction, type Action, type Target } from '../../domain/actions.js';
import { ParedeError } from '../../domain/errors.js';
import { inventoryPage } from './inject/scanner.js';
import type { BrowserManager } from './manager.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const readScroll = (page: Page) =>
  page.evaluate(() => ({
    y: window.scrollY,
    max: document.documentElement.scrollHeight - window.innerHeight,
    vh: window.innerHeight,
    vw: window.innerWidth,
  }));

/** O wheel só rola o elemento sob o cursor: garante um cursor posicionado sobre a página. */
async function ensurePointer(m: BrowserManager, page: Page) {
  if (m.mouse.known) return;
  const vp = page.viewportSize() ?? { width: 1280, height: 800 };
  await moveTo(m, page, vp.width / 2, vp.height / 2, 1);
}

async function moveTo(m: BrowserManager, page: Page, x: number, y: number, steps: number) {
  await page.mouse.move(x, y, { steps });
  m.mouse = { x, y, known: true };
}

function resolveDistance(raw: string | undefined, vh: number): number {
  if (!raw) return Math.round(vh * 0.85);
  const vhMatch = /^(\d+(?:\.\d+)?)vh$/i.exec(raw);
  if (vhMatch) return Math.round((Number(vhMatch[1]) / 100) * vh);
  const px = Number(raw.replace(/px$/i, ''));
  if (!Number.isFinite(px)) throw new ParedeError('BAD_ARG', `Distância inválida: "${raw}".`, 'Use pixels (1200) ou viewport (150vh).');
  return px;
}

async function targetPoint(page: Page, target: Target) {
  if ('x' in target) return { x: target.x, y: target.y };
  const locator = page.locator(target.selector).first();
  await locator.scrollIntoViewIfNeeded({ timeout: 10_000 });
  const box = await locator.boundingBox();
  if (!box) throw new ParedeError('SELECTOR', `"${target.selector}" não está visível.`, 'Rode `web-control inventory` para listar alvos visíveis.');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Executa uma ação com eventos reais de mouse/teclado/wheel. */
export async function runAction(m: BrowserManager, action: Action): Promise<Record<string, unknown>> {
  const page = m.requirePage();
  switch (action.type) {
    case 'scroll': {
      await ensurePointer(m, page);
      const before = await readScroll(page);
      const total = resolveDistance(action.distance, before.vh) * (action.direction === 'down' ? 1 : -1);
      const step = total / action.steps;
      for (let i = 0; i < action.steps; i++) {
        await page.mouse.wheel(0, step);
        await sleep(action.intervalMs);
      }
      await sleep(120);
      const after = await readScroll(page);
      const scrolledBy = Math.round(after.y - before.y);
      // Documento do tamanho da viewport + wheel aceito = scroll virtual (WebGL/transform): use frames para ver o efeito.
      const virtualScroll = after.max <= 2 && scrolledBy === 0;
      return { scrolledBy, requested: Math.round(total), atBottom: !virtualScroll && after.y >= after.max - 2, ...(virtualScroll ? { virtualScroll: true } : {}) };
    }
    case 'scroll-to': {
      await ensurePointer(m, page);
      if (action.instant) {
        await page.evaluate((t) => {
          if (t === 'top') window.scrollTo(0, 0);
          else if (t === 'bottom') window.scrollTo(0, document.documentElement.scrollHeight);
          else if (/^\d+$/.test(t)) window.scrollTo(0, Number(t));
          else document.querySelector(t)?.scrollIntoView({ block: 'start' });
        }, action.target);
        return { mode: 'instant' };
      }
      const goal = async () => {
        const s = await readScroll(page);
        if (action.target === 'top') return 0;
        if (action.target === 'bottom') return s.max;
        if (/^\d+$/.test(action.target)) return Math.min(Number(action.target), s.max);
        const top = await page.locator(action.target).first().evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
        return Math.min(Math.max(0, top - s.vh * 0.15), s.max);
      };
      let stuck = 0;
      let last = -1;
      for (let i = 0; i < action.steps; i++) {
        const s = await readScroll(page);
        const delta = (await goal()) - s.y;
        if (Math.abs(delta) < 4) break;
        stuck = Math.abs(s.y - last) < 1 ? stuck + 1 : 0;
        if (stuck >= 6) break;
        last = s.y;
        await page.mouse.wheel(0, Math.sign(delta) * Math.min(Math.abs(delta), Math.max(80, s.vh * 0.25)));
        await sleep(action.intervalMs);
      }
      const end = await readScroll(page);
      return { reached: Math.round(end.y), stuck: stuck >= 6 };
    }
    case 'click': {
      if ('selector' in action.target) {
        const locator = page.locator(action.target.selector).first();
        await locator.click({ button: action.button, clickCount: action.count, force: action.force, timeout: 10_000 });
        const box = await locator.boundingBox().catch(() => null);
        if (box) m.mouse = { x: box.x + box.width / 2, y: box.y + box.height / 2, known: true };
      } else {
        await moveTo(m, page, action.target.x, action.target.y, 8);
        await page.mouse.click(action.target.x, action.target.y, { button: action.button, clickCount: action.count });
      }
      await sleep(150);
      return {};
    }
    case 'hover': {
      const point = await targetPoint(page, action.target);
      await moveTo(m, page, point.x, point.y, 12);
      await sleep(action.holdMs);
      return { at: point };
    }
    case 'mousemove': {
      await ensurePointer(m, page);
      for (const p of action.path) await moveTo(m, page, p.x, p.y, action.steps);
      return { at: action.path[action.path.length - 1] };
    }
    case 'keypress': {
      for (let i = 0; i < action.repeat; i++) {
        await page.keyboard.press(action.key);
        if (i < action.repeat - 1) await sleep(action.delayMs);
      }
      return {};
    }
    case 'type': {
      await page.keyboard.type(action.text, { delay: action.delayMs });
      return {};
    }
    case 'wait': {
      await sleep(action.ms);
      return {};
    }
    case 'inventory': {
      return await page.evaluate(inventoryPage, action.limit);
    }
    case 'drag': {
      const start = await targetPoint(page, action.from);
      const end = action.relative ? { x: start.x + action.to.x, y: start.y + action.to.y } : action.to;
      await moveTo(m, page, start.x, start.y, 6);
      await page.mouse.down();
      await sleep(action.holdMs);
      await moveTo(m, page, end.x, end.y, action.steps);
      await sleep(80);
      await page.mouse.up();
      await sleep(200);
      return { from: start, to: end };
    }
  }
}

/** Executa uma sequência e devolve o estado final + erros de console novos. */
export async function runActions(m: BrowserManager, actions: Action[]) {
  const since = m.sinceOpen();
  const results: { action: string; result: Record<string, unknown> }[] = [];
  for (const action of actions) {
    results.push({ action: describeAction(action), result: await runAction(m, action) });
  }
  return { results, state: await m.state(), consoleErrors: await m.consoleErrorsSince(since) };
}
