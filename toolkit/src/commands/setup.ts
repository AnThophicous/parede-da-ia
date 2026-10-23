import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { ParedeError } from '../core/errors.js';
import { ensureDir, REPO_ROOT } from '../core/paths.js';
import { kv, next, ok, parse, type Command } from './shared.js';

export const MARK_START = '<!-- parede-da-ia:start -->';
export const MARK_END = '<!-- parede-da-ia:end -->';
const RAW_ROUTER = 'https://raw.githubusercontent.com/AnThophicous/parede-da-ia/main/prompts/router.md';

const posix = (p: string) => p.replace(/\\/g, '/');

function block(): string {
  const repo = posix(REPO_ROOT);
  return `${MARK_START}
## parede-da-ia — direção de arte e engenharia front-end

Antes de qualquer tarefa de front-end, UI/UX, direção de arte, revisão de código, commits, prompts
ou pipelines de dados/IA, leia o router e siga as instruções dele (ele diz quais módulos carregar):

- Router local: \`${repo}/prompts/router.md\`
- Fallback remoto: ${RAW_ROUTER}

Ferramentas (no PATH via \`npm link\`, ou \`node "${repo}/toolkit/bin/parede.js" <comando>\`):
\`web-url-fetch\` · \`web-wait-page-load\` · \`web-wait\` · \`web-control\` · \`web-record-frames\` ·
\`web-screenshot\` · \`web-scrap\` · \`web-serve\` · \`web-close\` — ajuda: \`parede help\`.
${MARK_END}`;
}

/** Insere ou substitui o bloco delimitado pelos marcadores (idempotente). */
function upsert(file: string, content: string, dryRun: boolean): 'criado' | 'atualizado' | 'inalterado' {
  const existed = existsSync(file);
  const current = existed ? readFileSync(file, 'utf8') : '';
  const pattern = new RegExp(`${MARK_START}[\\s\\S]*?${MARK_END}`);
  const updated = pattern.test(current) ? current.replace(pattern, content) : `${current.trimEnd()}${current.trim() ? '\n\n' : ''}${content}\n`;
  if (updated === current) return 'inalterado';
  if (!dryRun) {
    ensureDir(dirname(file));
    writeFileSync(file, updated);
  }
  return existed ? 'atualizado' : 'criado';
}

function writeWhole(file: string, content: string, dryRun: boolean): 'criado' | 'atualizado' | 'inalterado' {
  const existed = existsSync(file);
  if (existed && readFileSync(file, 'utf8') === content) return 'inalterado';
  if (!dryRun) {
    ensureDir(dirname(file));
    writeFileSync(file, content);
  }
  return existed ? 'atualizado' : 'criado';
}

function skillContent(): string {
  const template = join(REPO_ROOT, 'skill', 'SKILL.md');
  if (!existsSync(template)) throw new ParedeError('MISSING', `Template da skill ausente: ${template}`);
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
  summary: 'Registra o router nas instruções globais dos agentes (idempotente).',
  usage: `parede setup [--agent auto|all|claude|codex|opencode|gemini|windsurf] [--project] [--dry-run]
  auto (padrão)  registra nos agentes cujas pastas de config existem
  --project      também grava ./AGENTS.md e .cursor/rules/parede-da-ia.mdc no diretório atual
  --dry-run      mostra o que seria alterado sem escrever`,
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
        if (!t) throw new ParedeError('BAD_ARG', `Agente desconhecido: ${name}`, this.usage);
        return t;
      });
    }
    const dryRun = Boolean(values['dry-run']);
    const changes: { agent: string; file: string; result: string }[] = [];
    for (const t of chosen) for (const c of t.apply(dryRun)) changes.push({ agent: t.agent, ...c });

    if (values.project) {
      const cwd = process.cwd();
      changes.push({ agent: 'Projeto (AGENTS.md)', file: join(cwd, 'AGENTS.md'), result: upsert(join(cwd, 'AGENTS.md'), block(), dryRun) });
      const mdc = `---\ndescription: parede-da-ia — router de direção de arte e engenharia front-end\nalwaysApply: true\n---\n\n${block()}\n`;
      changes.push({ agent: 'Cursor (projeto)', file: join(cwd, '.cursor', 'rules', 'parede-da-ia.mdc'), result: writeWhole(join(cwd, '.cursor', 'rules', 'parede-da-ia.mdc'), mdc, dryRun) });
    }

    const lines = changes.length
      ? [ok(`${dryRun ? '[dry-run] ' : ''}router registrado em ${new Set(changes.map((c) => c.agent)).size} destino(s)`), ...changes.map((c) => kv(c.result, `${c.agent} → ${c.file}`))]
      : ['⚠ nenhum agente detectado (pastas ~/.claude, ~/.codex, ~/.config/opencode, ~/.gemini, ~/.codeium/windsurf ausentes)', next('use --agent claude (ou outro) para forçar, ou --project para este repositório')];
    lines.push(next(`MCP opcional: claude mcp add parede-da-ia -- node "${posix(join(REPO_ROOT, 'toolkit', 'bin', 'parede-mcp.js'))}"`));
    return { data: { dryRun, changes }, text: lines.join('\n') };
  },
};
