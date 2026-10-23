import { spawnSync } from 'node:child_process';
import { accessSync, constants, existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { isAlive } from '../core/client.js';
import { resolveFfmpeg } from '../core/ffmpeg.js';
import { ensureDir, PAREDE_HOME, REPO_ROOT, VERSION } from '../core/paths.js';
import { readSession } from '../core/session.js';
import { MARK_START } from './setup.js';
import type { Command } from './shared.js';

type Check = { name: string; status: 'ok' | 'warn' | 'fail'; detail: string; fix?: string };

export const doctor: Command = {
  name: 'doctor',
  summary: 'Diagnostica Node, Playwright/Chromium, FFmpeg, PATH, sessão e registro nos agentes.',
  usage: 'parede doctor',
  async execute() {
    const checks: Check[] = [];
    const add = (c: Check) => checks.push(c);

    const [major, minor] = process.versions.node.split('.').map(Number);
    add(major > 18 || (major === 18 && minor >= 17)
      ? { name: 'node', status: 'ok', detail: `v${process.versions.node}` }
      : { name: 'node', status: 'fail', detail: `v${process.versions.node}`, fix: 'Instale Node.js 18.17+ (recomendado 20 ou 22 LTS).' });

    try {
      const require = createRequire(import.meta.url);
      const pkg = JSON.parse(readFileSync(require.resolve('playwright/package.json'), 'utf8')) as { version: string };
      const { chromium } = await import('playwright');
      const exe = chromium.executablePath();
      add({ name: 'playwright', status: 'ok', detail: `v${pkg.version}` });
      add(existsSync(exe)
        ? { name: 'chromium', status: 'ok', detail: exe }
        : { name: 'chromium', status: 'fail', detail: 'binário ausente', fix: 'npx playwright install chromium   (Linux: npx playwright install --with-deps chromium)' });
    } catch {
      add({ name: 'playwright', status: 'fail', detail: 'pacote não instalado', fix: 'cd toolkit && npm install' });
    }

    const ffmpeg = resolveFfmpeg();
    add(ffmpeg
      ? { name: 'ffmpeg', status: 'ok', detail: `${ffmpeg.source} → ${ffmpeg.path}` }
      : { name: 'ffmpeg', status: 'warn', detail: 'não encontrado (frames funcionam, spritesheet/MP4 não)', fix: 'brew install ffmpeg | sudo apt install ffmpeg | winget install Gyan.FFmpeg — ou npm i ffmpeg-static' });

    try {
      ensureDir(PAREDE_HOME);
      accessSync(PAREDE_HOME, constants.W_OK);
      add({ name: 'estado', status: 'ok', detail: PAREDE_HOME });
    } catch {
      add({ name: 'estado', status: 'fail', detail: `sem escrita em ${PAREDE_HOME}`, fix: 'Defina PAREDE_HOME para uma pasta gravável.' });
    }

    const which = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['web-scrap'], { encoding: 'utf8', windowsHide: true });
    add(which.status === 0
      ? { name: 'PATH', status: 'ok', detail: which.stdout.trim().split(/\r?\n/)[0] }
      : { name: 'PATH', status: 'warn', detail: 'comandos web-* não estão no PATH', fix: `cd "${join(REPO_ROOT, 'toolkit')}" && npm link   (ou use: node "${join(REPO_ROOT, 'toolkit', 'bin', 'parede.js')}" <comando>)` });

    add(existsSync(join(REPO_ROOT, 'prompts', 'router.md'))
      ? { name: 'router', status: 'ok', detail: join(REPO_ROOT, 'prompts', 'router.md') }
      : { name: 'router', status: 'warn', detail: 'prompts/router.md não encontrado no clone', fix: 'Clone o repositório completo (não só a toolkit).' });

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
      ? { name: 'agentes', status: 'ok', detail: agents.join(', ') }
      : { name: 'agentes', status: 'warn', detail: 'router não registrado em nenhum agente', fix: 'parede setup --agent auto' });

    const session = readSession();
    add({ name: 'sessão', status: 'ok', detail: session && (await isAlive(session)) ? `ativa (pid ${session.pid})` : 'nenhuma ativa' });

    const icon = { ok: '✔', warn: '⚠', fail: '✖' } as const;
    const lines = [`parede-da-ia ${VERSION} — doctor`, ...checks.map((c) => `${icon[c.status]} ${c.name.padEnd(10)} ${c.detail}${c.fix ? `\n    → ${c.fix}` : ''}`)];
    const failed = checks.some((c) => c.status === 'fail');
    if (failed) process.exitCode = 1;
    return { data: { version: VERSION, healthy: !failed, checks }, text: lines.join('\n') };
  },
};
