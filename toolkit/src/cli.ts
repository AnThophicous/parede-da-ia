import { close, logs, status, urlFetch, waitPageLoad, waitSeconds } from './commands/browser.js';
import { doctor } from './commands/doctor.js';
import { control, screenshot } from './commands/interact.js';
import { recordFrames } from './commands/record.js';
import { scrap } from './commands/scrap.js';
import { serveCommand } from './commands/serve.js';
import { setup } from './commands/setup.js';
import type { Command, CommandResult } from './commands/shared.js';
import { ParedeError, toParedeError } from './core/errors.js';
import { VERSION } from './core/paths.js';

export const COMMANDS: Command[] = [urlFetch, waitPageLoad, waitSeconds, control, recordFrames, screenshot, scrap, close, serveCommand, status, logs, doctor, setup];

const registry = new Map<string, Command>();
for (const c of COMMANDS) {
  registry.set(c.name, c);
  registry.set(c.name.replace(/^web-/, ''), c);
}

function help(): string {
  const width = Math.max(...COMMANDS.map((c) => c.name.length)) + 2;
  return [
    `parede-da-ia ${VERSION} — rootkit de inspeção web para agentes de IA`,
    '',
    'Fluxo típico:',
    '  web-url-fetch https://lusion.co → web-wait-page-load → web-scrap → web-screenshot --full-page',
    '  web-record-frames --while "scroll-down 4000 --steps 80" --interval 0.25',
    '',
    'Comandos:',
    ...COMMANDS.map((c) => `  ${c.name.padEnd(width)}${c.summary}`),
    '',
    'Flags globais: --json (saída estruturada) · --help (uso do comando)',
    'Ambiente: PAREDE_SESSION (sessões paralelas) · PAREDE_OUT (pasta de artefatos) · PAREDE_FFMPEG · PAREDE_IDLE_MINUTES',
  ].join('\n');
}

/** Execução programática (usada pelo servidor MCP): nunca imprime nem encerra o processo. */
export async function execute(name: string, argv: string[]): Promise<CommandResult> {
  const command = registry.get(name);
  if (!command) throw new ParedeError('BAD_COMMAND', `Comando desconhecido: ${name}`, 'Rode `parede help`.');
  return command.execute(argv);
}

/** Ponto de entrada dos binários. `command` é null quando chamado como `parede <comando>`. */
export async function main(command: string | null, argv: string[]): Promise<void> {
  let name = command;
  let args = argv;
  if (!name) {
    name = argv[0] ?? 'help';
    args = argv.slice(1);
  }
  if (name === '--version' || name === '-v') {
    console.log(VERSION);
    return;
  }
  if (name === 'help' || name === '--help' || name === '-h') {
    const target = args[0] ? registry.get(args[0]) : undefined;
    console.log(target ? target.usage : help());
    return;
  }

  const json = args.includes('--json');
  args = args.filter((a) => a !== '--json');
  const cmd = registry.get(name);
  if (cmd && (args.includes('--help') || args.includes('-h'))) {
    console.log(cmd.usage);
    return;
  }

  try {
    const result = await execute(name, args);
    console.log(json ? JSON.stringify(result.data, null, 2) : result.text);
  } catch (err) {
    const e = toParedeError(err);
    if (json) console.log(JSON.stringify({ ok: false, error: e.toJSON() }, null, 2));
    else {
      console.error(`✖ ${e.message}`);
      if (e.hint) console.error(e.hint.includes('\n') ? `\n${e.hint}` : `  → ${e.hint}`);
    }
    process.exitCode = 1;
  }
}
