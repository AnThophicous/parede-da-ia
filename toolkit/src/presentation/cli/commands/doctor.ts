import { spawnSync } from 'node:child_process';
import { accessSync, constants, existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { isAlive } from '../../../infrastructure/session/client.js';
import { resolveFfmpeg } from '../../../infrastructure/ffmpeg/ffmpeg.js';
import { ensureDir, PAREDE_HOME, REPO_ROOT, VERSION } from '../../../infrastructure/session/paths.js';
import { readSession } from '../../../infrastructure/session/session.js';
import { MARK_START } from './setup.js';
import type { Command } from './shared.js';

type Check = { name: string; status: 'ok' | 'warn' | 'fail'; detail: string; fix?: string };

export const doctor: Command = {
  name: 'doctor',
  group: 'operations',
  summary: 'Checks Node, Playwright/Chromium, FFmpeg, PATH, the session and the agent registration.',
  usage: 'parede doctor',
  async execute() {
    const checks: Check[] = [];
    const add = (c: Check) => checks.push(c);

    const [major, minor] = process.versions.node.split('.').map(Number);
    add(major > 18 || (major === 18 && minor >= 17)
      ? { name: 'node', status: 'ok', detail: `v${process.versions.node}` }
      : { name: 'node', status: 'fail', detail: `v${process.versions.node}`, fix: 'Install Node.js 18.17+ (20 or 22 LTS recommended).' });

    try {
      const require = createRequire(import.meta.url);
      const pkg = JSON.parse(readFileSync(require.resolve('playwright/package.json'), 'utf8')) as { version: string };
      const { chromium } = await import('playwright');
      const exe = chromium.executablePath();
      add({ name: 'playwright', status: 'ok', detail: `v${pkg.version}` });
      add(existsSync(exe)
        ? { name: 'chromium', status: 'ok', detail: exe }
        : { name: 'chromium', status: 'fail', detail: 'binary missing', fix: 'npx playwright install chromium   (Linux: npx playwright install --with-deps chromium)' });
    } catch {
      add({ name: 'playwright', status: 'fail', detail: 'package not installed', fix: 'cd toolkit && npm install' });
    }

    const ffmpeg = resolveFfmpeg();
    add(ffmpeg
      ? { name: 'ffmpeg', status: 'ok', detail: `${ffmpeg.source} → ${ffmpeg.path}` }
      : { name: 'ffmpeg', status: 'warn', detail: 'not found (frames work, spritesheet/MP4 do not)', fix: 'brew install ffmpeg | sudo apt install ffmpeg | winget install Gyan.FFmpeg — or npm i ffmpeg-static' });

    try {
      ensureDir(PAREDE_HOME);
      accessSync(PAREDE_HOME, constants.W_OK);
      add({ name: 'state', status: 'ok', detail: PAREDE_HOME });
    } catch {
      add({ name: 'state', status: 'fail', detail: `cannot write to ${PAREDE_HOME}`, fix: 'Set PAREDE_HOME to a writable folder.' });
    }

    const which = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['web-scrap'], { encoding: 'utf8', windowsHide: true });
    add(which.status === 0
      ? { name: 'PATH', status: 'ok', detail: which.stdout.trim().split(/\r?\n/)[0] }
      : { name: 'PATH', status: 'warn', detail: 'web-* commands are not on the PATH', fix: `cd "${join(REPO_ROOT, 'toolkit')}" && npm link   (or use: node "${join(REPO_ROOT, 'toolkit', 'bin', 'parede.js')}" <command>)` });

    add(existsSync(join(REPO_ROOT, 'prompts', 'router.md'))
      ? { name: 'router', status: 'ok', detail: join(REPO_ROOT, 'prompts', 'router.md') }
      : { name: 'router', status: 'warn', detail: 'prompts/router.md not found in the clone', fix: 'Clone the whole repository (not only the toolkit).' });

    const home = homedir();
    const registered = [
      ['Claude Code', join(home, '.claude', 'skills', 'parede-da-ia', 'SKILL.md')],
      ['Claude Code', join(home, '.claude', 'CLAUDE.md')],
      ['Codex', join(home, '.codex', 'AGENTS.md')],
      ['OpenCode', join(home, '.config', 'opencode', 'AGENTS.md')],
      ['Gemini CLI', join(home, '.gemini', 'GEMINI.md')],
      ['Windsurf', join(home, '.codeium', 'windsurf', 'memories', 'global_rules.md')],
    ]
      .filter(([, file]) => existsSync(file) && (file.endsWith('SKILL.md') || readFileSync(file, 'utf8').includes(MARK_START)))
      .map(([agent]) => agent);
    const agents = [...new Set(registered)];
    add(agents.length
      ? { name: 'agents', status: 'ok', detail: agents.join(', ') }
      : { name: 'agents', status: 'warn', detail: 'router not registered in any agent', fix: 'parede setup --agent auto' });

    const session = readSession();
    add({ name: 'session', status: 'ok', detail: session && (await isAlive(session)) ? `active (pid ${session.pid})` : 'none active' });

    const icon = { ok: '✔', warn: '⚠', fail: '✖' } as const;
    const lines = [`parede-da-ia ${VERSION} — doctor`, ...checks.map((c) => `${icon[c.status]} ${c.name.padEnd(10)} ${c.detail}${c.fix ? `\n    → ${c.fix}` : ''}`)];
    const failed = checks.some((c) => c.status === 'fail');
    if (failed) process.exitCode = 1;
    return { data: { version: VERSION, healthy: !failed, checks }, text: lines.join('\n') };
  },
};
