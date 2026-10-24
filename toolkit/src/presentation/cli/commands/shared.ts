import { parseArgs, type ParseArgsConfig } from 'node:util';
import type { AppContext } from '../../../application/ports.js';
import { ParedeError } from '../../../domain/errors.js';

export interface CommandResult {
  /** Structured output (printed with --json and returned by MCP). */
  data: unknown;
  /** A summary readable by humans and agents. */
  text: string;
}

export interface Command {
  name: string;
  summary: string;
  usage: string;
  /** Group in `parede help`. */
  group: 'browser' | 'analysis' | 'media' | 'operations';
  execute(argv: string[], ctx: AppContext): Promise<CommandResult>;
}

type Options = NonNullable<ParseArgsConfig['options']>;

/** A strict parseArgs with a friendly error that includes the correct usage. */
export function parse<T extends Options>(argv: string[], options: T, usage: string) {
  try {
    return parseArgs({ args: argv, options, allowPositionals: true, strict: true });
  } catch (err) {
    throw new ParedeError('BAD_ARG', (err as Error).message, usage);
  }
}

export function requireSession(ctx: AppContext) {
  if (!ctx.session.active()) throw new ParedeError('NO_SESSION', 'No active browser session.', 'Run `web-url-fetch <url>` first.');
}

export const ok = (text: string) => `✔ ${text}`;
export const warn = (text: string) => `⚠ ${text}`;
export const next = (text: string) => `  → ${text}`;
export const kv = (label: string, value: string) => `  ${label.padEnd(10)} ${value}`;
export const list = (items: string[], empty = '—') => (items.length ? items.join(' · ') : empty);
