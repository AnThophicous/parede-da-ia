import { spawn } from 'node:child_process';
import { existsSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { finalizeRecording, type RecordedFrames, type RecordingManifest } from '../../../application/use-cases/finalize-recording.js';
import { parseSequence } from '../../../domain/actions.js';
import { ParedeError } from '../../../domain/errors.js';
import { stamp } from '../../../domain/naming.js';
import { parseDuration, parseNumber, parseViewport } from '../../../domain/units.js';
// Gravação em background é operação de processo (spawn/estado em disco): fala com a infraestrutura.
import { ensureDir, recordingStatePath, TOOLKIT_ROOT } from '../../../infrastructure/session/paths.js';
import { isPidAlive } from '../../../infrastructure/session/session.js';
import { kv, next, ok, parse, requireSession, warn, type Command } from './shared.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const usage = `web-record-frames [opções]
  --interval 0.5         segundos por frame (padrão 0.5s; aceita 250ms)
  --duration 6           duração total em segundos (padrão 5s, ou até as ações do --while terminarem)
  --while "<ações>"      ações executadas DURANTE a gravação, ex.: "scroll-down 3000 --steps 60"
  --tail 1               segundos extras gravados depois que as ações do --while terminam
  --selector <css>       recorta spritesheet/vídeo neste elemento (microinterações de perto)
  --max-frames 600       trava de segurança contra gravações sem fim
  --viewport 390x844     viewport temporária durante a gravação
  --format jpeg|png      formato dos frames (padrão jpeg q85; png = sem perdas, mais pesado)
  --tile-width 360       largura de cada frame na spritesheet
  --columns 6            colunas da spritesheet (padrão: raiz quadrada, máx. 8)
  --no-spritesheet       não gera spritesheets
  --no-video             não gera MP4
  --gif                  gera também um GIF (dither bayer)
  --out <dir>            pasta de saída (padrão .parede/recordings/<data>)
  --detach               grava em background e retorna na hora (pare com --stop)
  --stop                 encerra a gravação em background e gera os artefatos

O manifesto inclui fps/jank da página e quais elementos animaram durante a gravação.

⚠ Custo: frames vêm do screencast do compositor (barato), mas intervalos < 100ms,
  viewports grandes e cenas WebGL pesadas ainda consomem CPU/RAM/disco.
  Em máquinas modestas prefira --interval 0.25–0.5, --format jpeg e viewport ≤ 1440px.`;

function render(m: RecordingManifest, manifestFile: string) {
  const pf = m.pageFrames;
  return [
    ok(`${m.frameCount} frames em ${(m.durationMs / 1000).toFixed(1)}s (a cada ${m.intervalMs}ms · parada: ${m.stopReason})`),
    kv('frames', m.framesDir),
    ...m.outputs.spritesheets.map((s) => kv('sprite', s)),
    ...(m.outputs.video ? [kv('vídeo', m.outputs.video)] : []),
    ...(m.outputs.gif ? [kv('gif', m.outputs.gif)] : []),
    ...(pf ? [kv('página', `${pf.fps} fps · p95 ${pf.p95FrameMs}ms · ${pf.longFrames} frames longos`)] : []),
    ...(m.animated?.elements.length ? [kv('animou', m.animated.elements.slice(0, 5).map((e) => `${e.selector} ×${e.changes}`).join(' · '))] : []),
    ...(m.crop ? [kv('recorte', `${Math.round(m.crop.width)}×${Math.round(m.crop.height)}px`)] : []),
    kv('manifest', manifestFile),
    ...m.warnings.map(warn),
    next('leia a spritesheet para avaliar a coreografia de scroll/hover quadro a quadro'),
  ].join('\n');
}

export const recordFrames: Command = {
  name: 'web-record-frames',
  group: 'mídia',
  summary: 'Grava frames da sessão (padrão 0.5s/frame) → spritesheet + MP4 + métricas de jank.',
  usage,
  async execute(argv, ctx) {
    const { values } = parse(
      argv,
      {
        interval: { type: 'string' },
        duration: { type: 'string' },
        while: { type: 'string' },
        tail: { type: 'string' },
        selector: { type: 'string' },
        'max-frames': { type: 'string' },
        viewport: { type: 'string' },
        format: { type: 'string' },
        quality: { type: 'string' },
        'tile-width': { type: 'string' },
        columns: { type: 'string' },
        'no-spritesheet': { type: 'boolean' },
        'no-video': { type: 'boolean' },
        gif: { type: 'boolean' },
        out: { type: 'string' },
        detach: { type: 'boolean' },
        stop: { type: 'boolean' },
      },
      usage,
    );

    const statePath = recordingStatePath();
    if (values.stop) {
      if (!existsSync(statePath)) throw new ParedeError('NO_RECORDING', 'Nenhuma gravação em background.', 'Inicie com `web-record-frames --detach`.');
      const state = JSON.parse(readFileSync(statePath, 'utf8')) as { dir: string };
      writeFileSync(join(state.dir, '.stop'), String(Date.now()));
      const manifestFile = join(state.dir, 'manifest.json');
      const deadline = Date.now() + 180_000;
      while (!existsSync(manifestFile) && Date.now() < deadline) await sleep(300);
      rmSync(statePath, { force: true });
      if (!existsSync(manifestFile)) throw new ParedeError('TIMEOUT', 'A gravação não finalizou em 3 min.', `Veja ${join(state.dir, 'record.log')}`);
      const manifest = JSON.parse(readFileSync(manifestFile, 'utf8')) as RecordingManifest;
      return { data: manifest, text: render(manifest, manifestFile) };
    }

    requireSession(ctx);
    const intervalMs = Math.max(16, parseDuration(values.interval ?? '0.5', 's'));
    const actions = values.while ? parseSequence(values.while) : [];
    const durationMs = values.duration ? parseDuration(values.duration, 's') : actions.length || values.detach ? undefined : 5000;
    const dir = values.out ? ensureDir(resolve(values.out)) : ctx.artifacts.dir('recordings', stamp());
    const format = (values.format === 'png' ? 'png' : 'jpeg') as 'png' | 'jpeg';

    if (values.detach) {
      if (existsSync(statePath)) {
        const previous = JSON.parse(readFileSync(statePath, 'utf8')) as { pid: number; dir: string };
        const finished = existsSync(join(previous.dir, 'manifest.json')) || !isPidAlive(previous.pid);
        if (!finished) throw new ParedeError('BUSY', 'Já existe uma gravação em background.', 'Rode `web-record-frames --stop` antes.');
        rmSync(statePath, { force: true });
      }
      const forwarded = argv.filter((a) => a !== '--detach');
      const outIdx = forwarded.indexOf('--out');
      if (outIdx >= 0) forwarded.splice(outIdx, 2);
      const log = openSync(join(dir, 'record.log'), 'a');
      const child = spawn(process.execPath, [join(TOOLKIT_ROOT, 'bin', 'parede.js'), 'web-record-frames', ...forwarded, '--out', dir, ...(durationMs === undefined && !actions.length ? ['--duration', '3600'] : [])], {
        detached: true,
        stdio: ['ignore', log, log],
        windowsHide: true,
        env: process.env,
      });
      child.unref();
      writeFileSync(statePath, JSON.stringify({ pid: child.pid, dir, startedAt: new Date().toISOString() }));
      return {
        data: { detached: true, pid: child.pid, dir },
        text: [ok(`gravando em background (pid ${child.pid}) a cada ${intervalMs}ms`), kv('saída', dir), next('dispare web-control ... e depois rode: web-record-frames --stop')].join('\n'),
      };
    }

    const lines: string[] = [];
    if (intervalMs < 100) lines.push(warn(`intervalo de ${intervalMs}ms: alto consumo de CPU/RAM/disco. Use só para micro-interações curtas.`));
    const maxFrames = parseNumber(values['max-frames'], 'max-frames', 600);
    if (durationMs && durationMs / intervalMs > maxFrames) lines.push(warn(`duração pede ${Math.ceil(durationMs / intervalMs)} frames; limitado a ${maxFrames} (--max-frames).`));

    const frames = await ctx.session.call<RecordedFrames>('record', {
      dir,
      intervalMs,
      durationMs,
      maxFrames,
      actions,
      tailMs: parseDuration(values.tail ?? '1', 's'),
      format,
      quality: values.quality ? parseNumber(values.quality, 'quality', 85) : undefined,
      viewport: values.viewport ? parseViewport(values.viewport) : undefined,
      selector: values.selector,
      stopFile: join(dir, '.stop'),
    });
    const manifest = await finalizeRecording(frames, ctx.encoder(), {
      spritesheet: !values['no-spritesheet'],
      video: !values['no-video'],
      gif: Boolean(values.gif),
      tileWidth: parseNumber(values['tile-width'], 'tile-width', values.selector ? 240 : 360),
      columns: values.columns ? parseNumber(values.columns, 'columns', 6) : undefined,
    });
    const manifestFile = join(dir, 'manifest.json');
    writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
    rmSync(join(dir, '.stop'), { force: true });
    return { data: manifest, text: [...lines, render(manifest, manifestFile)].join('\n') };
  },
};
