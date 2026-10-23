import { parseArgs, type ParseArgsConfig } from 'node:util';
import { ParedeError } from '../core/errors.js';

export interface CommandResult {
  /** Saída estruturada (impressa com --json e devolvida pelo MCP). */
  data: unknown;
  /** Resumo legível para humanos e agentes. */
  text: string;
}

export interface Command {
  name: string;
  summary: string;
  usage: string;
  execute(argv: string[]): Promise<CommandResult>;
}

type Options = NonNullable<ParseArgsConfig['options']>;

/** parseArgs estrito com erro amigável que inclui o uso correto. */
export function parse<T extends Options>(argv: string[], options: T, usage: string) {
  try {
    return parseArgs({ args: argv, options, allowPositionals: true, strict: true });
  } catch (err) {
    throw new ParedeError('BAD_ARG', (err as Error).message, usage);
  }
}

export const ok = (text: string) => `✔ ${text}`;
export const warn = (text: string) => `⚠ ${text}`;
export const next = (text: string) => `  → ${text}`;
export const kv = (label: string, value: string) => `  ${label.padEnd(10)} ${value}`;
