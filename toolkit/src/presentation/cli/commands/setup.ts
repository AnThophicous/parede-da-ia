import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { ParedeError } from '../../../domain/errors.js';
import { ensureDir, REPO_ROOT } from '../../../infrastructure/session/paths.js';
import { kv, next, ok, parse, type Command } from './shared.js';

export const MARK_START = '<!-- parede-da-ia:start -->';
export const MARK_END = '<!-- parede-da-ia:end -->';
const RAW_ROUTER = 'https://raw.githubusercontent.com/AnThophicous/parede-da-ia/main/prompts/router.md';

const posix = (p: string) => p.replace(/\\/g, '/');

function block(): string {
  const repo = posix(REPO_ROOT);
  return `${MARK_START}
## parede-da-ia — art direction and front-end engineering

Before any front-end, UI/UX, art direction, code review, commit, prompt or data/AI pipeline task,
read the router and follow its instructions (it says which modules to load):

- Local router: \`${repo}/prompts/router.md\`
- Remote fallback: ${RAW_ROUTER}

Tools (on the PATH via \`npm link\`, or \`node "${repo}/toolkit/bin/parede.js" <command>\`):
- see and act: \`web-url-fetch\` · \`web-wait-page-load\` · \`web-wait\` · \`web-control\` · \`web-eval\` ·
  \`web-screenshot\` · \`web-record-frames\` · \`web-close\`
- measure: \`web-scrap\` · \`web-motion\` · \`web-interactions\` · \`web-audit\` · \`web-tokens\` · \`web-diff\` · \`media-frames\`
- serve: \`web-serve\` — help: \`parede help\`.

Ready-made effect recipes (Hover Font, text morph, magnetic…): \`${repo}/library/\`.
${MARK_END}`;
}

/** Inserts or replaces the block delimited by the markers (idempotent). */
function upsert(file: string, content: string, dryRun: boolean): 'created' | 'updated' | 'unchanged' {
  const existed = existsSync(file);
  const current = existed ? readFileSync(file, 'utf8') : '';
  const pattern = new RegExp(`${MARK_START}[\\s\\S]*?${MARK_END}`);
  const updated = pattern.test(current) ? current.replace(pattern, content) : `${current.trimEnd()}${current.trim() ? '\n\n' : ''}${content}\n`;
  if (updated === current) return 'unchanged';
  if (!dryRun) {
    ensureDir(dirname(file));
    writeFileSync(file, updated);
  }
  return existed ? 'updated' : 'created';
}

function writeWhole(file: string, content: string, dryRun: boolean): 'created' | 'updated' | 'unchanged' {
  const existed = existsSync(file);
  if (existed && readFileSync(file, 'utf8') === content) return 'unchanged';
  if (!dryRun) {
    ensureDir(dirname(file));
    writeFileSync(file, content);
  }
  return existed ? 'updated' : 'created';
}

function skillContent(): string {
  const template = join(REPO_ROOT, 'skill', 'SKILL.md');
  if (!existsSync(template)) throw new ParedeError('MISSING', `Skill template missing: ${template}`);
  return readFileSync(template, 'utf8').replaceAll('{{PAREDE_REPO}}', posix(REPO_ROOT));
}

interface Target {
  agent: string;
  detectDir: string;
  apply(dryRun: boolean): { file: string; result: string }[];
}

function targets(): Record<string, Target> {
  const home = homedir();
  const simple = (agent: string, detectDir: string, file: string): Target => ({
    agent,
    detectDir,
    apply: (dryRun) => [{ file, result: upsert(file, block(), dryRun) }],
  });
  return {
    claude: {
      agent: 'Claude Code',
      detectDir: join(home, '.claude'),
      apply: (dryRun) => [
        { file: join(home, '.claude', 'skills', 'parede-da-ia', 'SKILL.md'), result: writeWhole(join(home, '.claude', 'skills', 'parede-da-ia', 'SKILL.md'), skillContent(), dryRun) },
        { file: join(home, '.claude', 'CLAUDE.md'), result: upsert(join(home, '.claude', 'CLAUDE.md'), block(), dryRun) },
      ],
    },
    codex: simple('Codex CLI', join(home, '.codex'), join(home, '.codex', 'AGENTS.md')),
    opencode: simple('OpenCode', join(home, '.config', 'opencode'), join(home, '.config', 'opencode', 'AGENTS.md')),
    gemini: simple('Gemini CLI', join(home, '.gemini'), join(home, '.gemini', 'GEMINI.md')),
    windsurf: simple('Windsurf', join(home, '.codeium', 'windsurf'), join(home, '.codeium', 'windsurf', 'memories', 'global_rules.md')),
  };
}

export const setup: Command = {
  name: 'setup',
  group: 'operations',
  summary: "Registers the router in the agents' global instructions (idempotent).",
  usage: `parede setup [--agent auto|all|claude|codex|opencode|gemini|windsurf] [--project] [--dry-run]
  auto (default) registers in the agents whose config folders exist
  --project      also writes ./AGENTS.md and .cursor/rules/parede-da-ia.mdc in the current directory
  --dry-run      shows what would change without writing`,
  async execute(argv) {
    const { values } = parse(argv, { agent: { type: 'string', multiple: true }, project: { type: 'boolean' }, 'dry-run': { type: 'boolean' } }, this.usage);
    const all = targets();
    const requested = values.agent?.length ? values.agent.flatMap((a) => a.split(',')) : ['auto'];
    let chosen: Target[];
    if (requested.includes('all')) chosen = Object.values(all);
    else if (requested.includes('auto')) chosen = Object.values(all).filter((t) => existsSync(t.detectDir));
    else {
      chosen = requested.map((name) => {
        const t = all[name];
        if (!t) throw new ParedeError('BAD_ARG', `Unknown agent: ${name}`, this.usage);
        return t;
      });
    }
    const dryRun = Boolean(values['dry-run']);
    const changes: { agent: string; file: string; result: string }[] = [];
    for (const t of chosen) for (const c of t.apply(dryRun)) changes.push({ agent: t.agent, ...c });

    if (values.project) {
      const cwd = process.cwd();
      changes.push({ agent: 'Project (AGENTS.md)', file: join(cwd, 'AGENTS.md'), result: upsert(join(cwd, 'AGENTS.md'), block(), dryRun) });
      const mdc = `---\ndescription: parede-da-ia — art direction and front-end engineering router\nalwaysApply: true\n---\n\n${block()}\n`;
      changes.push({ agent: 'Cursor (project)', file: join(cwd, '.cursor', 'rules', 'parede-da-ia.mdc'), result: writeWhole(join(cwd, '.cursor', 'rules', 'parede-da-ia.mdc'), mdc, dryRun) });
    }

    const lines = changes.length
      ? [ok(`${dryRun ? '[dry-run] ' : ''}router registered in ${new Set(changes.map((c) => c.agent)).size} destination(s)`), ...changes.map((c) => kv(c.result, `${c.agent} → ${c.file}`))]
      : ['⚠ no agent detected (folders ~/.claude, ~/.codex, ~/.config/opencode, ~/.gemini, ~/.codeium/windsurf missing)', next('use --agent claude (or another) to force it, or --project for this repository')];
    lines.push(next(`Optional MCP: claude mcp add parede-da-ia -- node "${posix(join(REPO_ROOT, 'toolkit', 'bin', 'parede-mcp.js'))}"`));
    return { data: { dryRun, changes }, text: lines.join('\n') };
  },
};
