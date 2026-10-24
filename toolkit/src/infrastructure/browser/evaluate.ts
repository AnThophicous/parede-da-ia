import { ParedeError } from '../../domain/errors.js';
import type { BrowserManager } from './manager.js';

const MAX_CHARS = 20_000;

/**
 * Avalia uma expressão JavaScript na página (inspeção/depuração pelo agente).
 * Aceita expressões e `await`; o resultado volta serializado e truncado.
 */
export async function evaluateExpression(m: BrowserManager, expression: string) {
  if (!expression.trim()) throw new ParedeError('BAD_ARG', 'Expressão vazia.');
  const page = m.requirePage();
  const wrapped = `(async () => { const __r = await (${expression}); try { return { type: typeof __r, json: JSON.stringify(__r, (k, v) => (v instanceof Element ? '<' + v.tagName.toLowerCase() + (v.id ? '#' + v.id : '') + '>' : v), 2) }; } catch (e) { return { type: typeof __r, json: String(__r) }; } })()`;
  const result = (await page.evaluate(wrapped)) as { type: string; json: string | undefined };
  const text = result.json ?? 'undefined';
  return { type: result.type, value: text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}… (+${text.length - MAX_CHARS} caracteres)` : text };
}
