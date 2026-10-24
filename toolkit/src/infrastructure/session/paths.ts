import { mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ArtifactKind, ArtifactStore } from '../../application/ports.js';

/** Root of the toolkit package (dist/infrastructure/session → toolkit). */
export const TOOLKIT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
/** Root of the parede-da-ia repository (holds prompts/, library/ and doc.md). */
export const REPO_ROOT = resolve(TOOLKIT_ROOT, '..');

/** A single version: read from package.json (one source of truth). */
export const VERSION: string = (() => {
  try {
    return (JSON.parse(readFileSync(join(TOOLKIT_ROOT, 'package.json'), 'utf8')) as { version: string }).version;
  } catch {
    return '0.0.0';
  }
})();

/** Per-user global state: sessions, logs and background recordings. */
export const PAREDE_HOME = process.env.PAREDE_HOME ? resolve(process.env.PAREDE_HOME) : join(homedir(), '.parede');

/** Several parallel sessions are possible with PAREDE_SESSION=<name>. */
export const SESSION_NAME = (process.env.PAREDE_SESSION ?? 'default').replace(/[^\w.-]/g, '_');

export function ensureDir(dir: string): string {
  mkdirSync(dir, { recursive: true });
  return dir;
}

export const sessionFilePath = (name = SESSION_NAME) => join(PAREDE_HOME, 'sessions', `${name}.json`);
export const logFilePath = (name = SESSION_NAME) => join(PAREDE_HOME, 'logs', `${name}.log`);
export const recordingStatePath = (name = SESSION_NAME) => join(PAREDE_HOME, 'sessions', `${name}.recording.json`);

/** Artifacts live in the current project, in ./.parede/ by default (PAREDE_OUT changes the root). */
export function outputRoot(): string {
  return resolve(process.env.PAREDE_OUT ?? join(process.cwd(), '.parede'));
}

export function outputPath(kind: ArtifactKind, file: string): string {
  return join(ensureDir(join(outputRoot(), kind)), file);
}

export const fileArtifacts: ArtifactStore = {
  root: outputRoot,
  path: outputPath,
  dir: (kind, name) => ensureDir(join(outputRoot(), kind, name)),
};
