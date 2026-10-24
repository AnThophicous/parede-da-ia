import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { ensureDir, sessionFilePath } from './paths.js';

export interface SessionInfo {
  name: string;
  port: number;
  token: string;
  pid: number;
  startedAt: string;
  version: string;
}

export function readSession(file = sessionFilePath()): SessionInfo | null {
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as SessionInfo;
  } catch {
    return null;
  }
}

export function writeSession(info: SessionInfo, file = sessionFilePath()): void {
  ensureDir(dirname(file));
  writeFileSync(file, JSON.stringify(info, null, 2), { mode: 0o600 });
}

/** Removes the session file; with `onlyPid`, only if it still belongs to that process. */
export function removeSession(onlyPid?: number, file = sessionFilePath()): void {
  if (onlyPid !== undefined && readSession(file)?.pid !== onlyPid) return;
  rmSync(file, { force: true });
}

export function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return (err as NodeJS.ErrnoException).code === 'EPERM';
  }
}
