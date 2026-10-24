import { mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ArtifactKind, ArtifactStore } from '../../application/ports.js';

/** Raiz do pacote toolkit (dist/infrastructure/session → toolkit). */
export const TOOLKIT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
/** Raiz do repositório parede-da-ia (contém prompts/, library/ e doc.md). */
export const REPO_ROOT = resolve(TOOLKIT_ROOT, '..');

/** Versão única: lida do package.json (uma fonte de verdade). */
export const VERSION: string = (() => {
  try {
    return (JSON.parse(readFileSync(join(TOOLKIT_ROOT, 'package.json'), 'utf8')) as { version: string }).version;
  } catch {
    return '0.0.0';
  }
})();

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

/** Artefatos ficam no projeto atual, em ./.parede/ por padrão (PAREDE_OUT muda a raiz). */
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
