import { ParedeError } from '../../domain/errors.js';
import type { BrowserManager } from './manager.js';

const MAX_CHARS = 20_000;

/**
 * Evaluates a JavaScript expression in the page (inspection/debugging by the agent).
 * Accepts expressions and `await`; the result comes back serialized and truncated.
 */
export async function evaluateExpression(m: BrowserManager, expression: string) {
  if (!expression.trim()) throw new ParedeError('BAD_ARG', 'Empty expression.');
  const page = m.requirePage();
  const wrapped = `(async () => { const __r = await (${expression}); try { return { type: typeof __r, json: JSON.stringify(__r, (k, v) => (v instanceof Element ? '<' + v.tagName.toLowerCase() + (v.id ? '#' + v.id : '') + '>' : v), 2) }; } catch (e) { return { type: typeof __r, json: String(__r) }; } })()`;
  const result = (await page.evaluate(wrapped)) as { type: string; json: string | undefined };
  const text = result.json ?? 'undefined';
  return { type: result.type, value: text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}… (+${text.length - MAX_CHARS} characters)` : text };
}
