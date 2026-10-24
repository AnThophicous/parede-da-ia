import type { AppContext } from '../../application/ports.js';
import { ParedeError, toParedeError } from '../../domain/errors.js';
import { audit, interactions, motion, scrap, tokens } from './commands/analysis.js';
import { close, evaluate, logs, status, urlFetch, waitPageLoad, waitSeconds } from './commands/browser.js';
import { doctor } from './commands/doctor.js';
import { control, screenshot } from './commands/interact.js';
import { diff, mediaFrames } from './commands/media.js';
import { recordFrames } from './commands/record.js';
import { serveCommand } from './commands/serve.js';
import { setup } from './commands/setup.js';
import type { Command, CommandResult } from './commands/shared.js';

export const COMMANDS: Command[] = [
  urlFetch, waitPageLoad, waitSeconds, control, screenshot, evaluate, close,
  scrap, motion, interactions, audit, tokens,
  recordFrames, mediaFrames, diff,
  serveCommand, status, logs, doctor, setup,
];

const registry = new Map<string, Command>();
for (const c of COMMANDS) {
  registry.set(c.name, c);
  registry.set(c.name.replace(/^(web|media)-/, ''), c);
}

export function help(version: string): string {
  const width = Math.max(...COMMANDS.map((c) => c.name.length)) + 2;
  const groups: Command['group'][] = ['browser', 'analysis', 'media', 'operations'];
  return [
    `parede-da-ia ${version} — eyes, hands and taste for AI agents`,
    '',
    'Typical flow:',
    '  web-url-fetch https://lusion.co → web-wait-page-load → web-scrap → web-motion --observe 3',
    '  web-record-frames --while "scroll-down 4000 --steps 80" --interval 0.25',
    '  web-audit --viewports desktop,tablet,mobile   (QA before delivering)',
    '',
    ...groups.flatMap((g) => [`${g.toUpperCase()}`, ...COMMANDS.filter((c) => c.group === g).map((c) => `  ${c.name.padEnd(width)}${c.summary}`), '']),
    'Global flags: --json (structured output) · --help (command usage)',
    'Environment: PAREDE_SESSION (parallel sessions) · PAREDE_OUT (artifacts folder) · PAREDE_FFMPEG · PAREDE_GPU=0 · PAREDE_IDLE_MINUTES',
  ].join('\n');
}

/** Programmatic execution (used by MCP): never prints nor exits the process. */
export async function execute(name: string, argv: string[], ctx: AppContext): Promise<CommandResult> {
  const command = registry.get(name);
  if (!command) throw new ParedeError('BAD_COMMAND', `Unknown command: ${name}`, 'Run `parede help`.');
  return command.execute(argv, ctx);
}

/** Terminal interface: prints text (or JSON) and sets the exit code. */
export async function runCli(command: string | null, argv: string[], ctx: AppContext, version: string): Promise<void> {
  let name = command;
  let args = argv;
  if (!name) {
    name = argv[0] ?? 'help';
    args = argv.slice(1);
  }
  if (name === '--version' || name === '-v') {
    console.log(version);
    return;
  }
  if (name === 'help' || name === '--help' || name === '-h') {
    const target = args[0] ? registry.get(args[0]) : undefined;
    console.log(target ? target.usage : help(version));
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
    const result = await execute(name, args, ctx);
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
