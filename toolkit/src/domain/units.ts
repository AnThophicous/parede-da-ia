import { ParedeError } from './errors.js';

export interface Viewport {
  width: number;
  height: number;
}

/**
 * Converte "500ms", "2s", "1.5" em milissegundos.
 * Números sem unidade usam `bareUnit` (segundos para esperas, ms para intervalos de passo).
 */
export function parseDuration(value: string | number, bareUnit: 's' | 'ms' = 's'): number {
  if (typeof value === 'number') return bareUnit === 's' ? value * 1000 : value;
  const match = /^\s*(\d+(?:\.\d+)?)\s*(ms|s|m)?\s*$/i.exec(value);
  if (!match) throw new ParedeError('BAD_ARG', `Duração inválida: "${value}".`, 'Use 0.5, 500ms, 2s ou 1m.');
  const amount = Number(match[1]);
  const unit = (match[2] ?? bareUnit).toLowerCase();
  if (unit === 'ms') return Math.round(amount);
  if (unit === 'm') return Math.round(amount * 60_000);
  return Math.round(amount * 1000);
}

export function parseViewport(value: string): Viewport {
  const match = /^\s*(\d{2,5})\s*[x×,]\s*(\d{2,5})\s*$/i.exec(value);
  if (!match) throw new ParedeError('BAD_ARG', `Viewport inválido: "${value}".`, 'Use LARGURAxALTURA, ex.: 1440x900 ou 390x844.');
  return { width: Number(match[1]), height: Number(match[2]) };
}

export function parseNumber(value: string | undefined, name: string, fallback: number): number {
  if (value === undefined) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) throw new ParedeError('BAD_ARG', `--${name} precisa ser numérico (recebido "${value}").`);
  return n;
}

/** "120,340" → { x, y }; qualquer outra coisa é tratada como seletor. */
export function parsePoint(value: string): { x: number; y: number } | null {
  const match = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(value);
  return match ? { x: Number(match[1]), y: Number(match[2]) } : null;
}

/** Tokenizador estilo shell (aspas simples/duplas) usado em `sequence` e `--while`. */
export function tokenize(source: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;
  let hasToken = false;
  for (const ch of source) {
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      hasToken = true;
    } else if (/\s/.test(ch)) {
      if (hasToken || current) tokens.push(current);
      current = '';
      hasToken = false;
    } else {
      current += ch;
      hasToken = true;
    }
  }
  if (quote) throw new ParedeError('BAD_ARG', `Aspas não fechadas em: ${source}`);
  if (hasToken || current) tokens.push(current);
  return tokens;
}

/** Divide "a; b; c" respeitando aspas. */
export function splitSequence(source: string): string[] {
  const parts: string[] = [];
  let current = '';
  let quote: string | null = null;
  for (const ch of source) {
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === ';') {
      if (current.trim()) parts.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};
