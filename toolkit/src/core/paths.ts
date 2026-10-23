import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Raiz do pacote toolkit (dist/core → toolkit). */
export const TOOLKIT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
/** Raiz do repositório parede-da-ia (contém prompts/ e doc.md). */
export const REPO_ROOT = resolve(TOOLKIT_ROOT, '..');

export const VERSION = '0.1.0';

/** Estado global por usuário: sessões, logs e gravações em background. */
export const PAREDE_HOME = process.env.PAREDE_HOME ? resolve(process.env.PAREDE_HOME) : join(homedir(), '.parede');

/** Várias sessões paralelas são possíveis com PAREDE_SESSION=<nome>. */
export const SESSION_NAME = (process.env.PAREDE_SESSION ?? 'default').replace(/[^\w.-]/g, '_');

export function ensureDir(dir: string): string {
  mkdirSync(dir, { recursive: true });
  return dir;
}

export const sessionFilePath = (name = SESSION_NAME) => join(PAREDE_HOME, 'sessions', `${name}.json`);
export const logFilePath = (name = SESSION_NAME) => join(PAREDE_HOME, 'logs', `${name}.log`);
export const recordingStatePath = (name = SESSION_NAME) => join(PAREDE_HOME, 'sessions', `${name}.recording.json`);

/** Artefatos (screenshots, gravações, scraps) ficam no projeto atual, em ./.parede/ por padrão. */
export function outputRoot(): string {
  return resolve(process.env.PAREDE_OUT ?? join(process.cwd(), '.parede'));
}

export function outputPath(kind: 'screenshots' | 'recordings' | 'scrap', file: string): string {
  return join(ensureDir(join(outputRoot(), kind)), file);
}

/** Carimbo de tempo seguro para nomes de arquivo: 2026-10-23T18-50-00. */
export function stamp(date = new Date()): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 19).replace(/:/g, '-');
}

export function slugFromUrl(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    const path = pathname.replace(/\/+$/, '').replace(/[^\w-]+/g, '-').slice(0, 40);
    return (hostname + path).replace(/^-+|-+$/g, '') || 'page';
  } catch {
    return 'page';
  }
}
