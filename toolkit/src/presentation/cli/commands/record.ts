import { spawn } from 'node:child_process';
import { existsSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { finalizeRecording, type RecordedFrames, type RecordingManifest } from '../../../application/use-cases/finalize-recording.js';
import { parseSequence } from '../../../domain/actions.js';
import { ParedeError } from '../../../domain/errors.js';
import { stamp } from '../../../domain/naming.js';
import { parseDuration, parseNumber, parseViewport } from '../../../domain/units.js';
// Background recording is a process operation (spawn/state on disk): it talks to the infrastructure.
import { ensureDir, recordingStatePath, TOOLKIT_ROOT } from '../../../infrastructure/session/paths.js';
import { isPidAlive } from '../../../infrastructure/session/session.js';
import { kv, next, ok, parse, requireSession, warn, type Command } from './shared.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const usage = `web-record-frames [options]
  --interval 0.5         seconds per frame (default 0.5s; accepts 250ms)
  --duration 6           total duration in seconds (default 5s, or until the --while actions finish)
  --while "<actions>"    actions run DURING the recording, e.g. "scroll-down 3000 --steps 60"
  --tail 1               extra seconds recorded after the --while actions finish
  --selector <css>       crops the spritesheet/video to this element (microinteractions up close)
  --max-frames 600       safety limit against endless recordings
  --viewport 390x844     temporary viewport during the recording
  --format jpeg|png      frame format (default jpeg q85; png = lossless, heavier)
  --tile-width 360       width of each frame in the spritesheet
  --columns 6            spritesheet columns (default: square root, max 8)
  --no-spritesheet       no spritesheets
  --no-video             no MP4
  --gif                  also produces a GIF (bayer dither)
  --out <dir>            output folder (default .parede/recordings/<date>)
  --detach               records in the background and returns right away (stop with --stop)
  --stop                 stops the background recording and builds the artifacts

The manifest includes the page fps/jank and which elements animated during the recording.

⚠ Cost: frames come from the compositor screencast (cheap), but intervals < 100ms,
  large viewports and heavy WebGL scenes still consume CPU/RAM/disk.
  On modest machines prefer --interval 0.25–0.5, --format jpeg and a viewport ≤ 1440px.`;

function render(m: RecordingManifest, manifestFile: string) {
  const pf = m.pageFrames;
  return [
    ok(`${m.frameCount} frames in ${(m.durationMs / 1000).toFixed(1)}s (every ${m.intervalMs}ms · stop: ${m.stopReason})`),
    kv('frames', m.framesDir),
    ...m.outputs.spritesheets.map((s) => kv('sprite', s)),
    ...(m.outputs.video ? [kv('video', m.outputs.video)] : []),
    ...(m.outputs.gif ? [kv('gif', m.outputs.gif)] : []),
    ...(pf ? [kv('page', `${pf.fps} fps · p95 ${pf.p95FrameMs}ms · ${pf.longFrames} long frames`)] : []),
    ...(m.animated?.elements.length ? [kv('animated', m.animated.elements.slice(0, 5).map((e) => `${e.selector} ×${e.changes}`).join(' · '))] : []),
    ...(m.crop ? [kv('crop', `${Math.round(m.crop.width)}×${Math.round(m.crop.height)}px`)] : []),
    kv('manifest', manifestFile),
    ...m.warnings.map(warn),
    next('read the spritesheet to judge the scroll/hover choreography frame by frame'),
  ].join('\n');
}

export const recordFrames: Command = {
  name: 'web-record-frames',
  group: 'media',
  summary: 'Records session frames (default 0.5s/frame) → spritesheet + MP4 + jank metrics.',
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
      if (!existsSync(statePath)) throw new ParedeError('NO_RECORDING', 'No background recording.', 'Start one with `web-record-frames --detach`.');
      const state = JSON.parse(readFileSync(statePath, 'utf8')) as { dir: string };
      writeFileSync(join(state.dir, '.stop'), String(Date.now()));
      const manifestFile = join(state.dir, 'manifest.json');
      const deadline = Date.now() + 180_000;
      while (!existsSync(manifestFile) && Date.now() < deadline) await sleep(300);
      rmSync(statePath, { force: true });
      if (!existsSync(manifestFile)) throw new ParedeError('TIMEOUT', 'The recording did not finish within 3 min.', `See ${join(state.dir, 'record.log')}`);
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
        if (!finished) throw new ParedeError('BUSY', 'A background recording is already running.', 'Run `web-record-frames --stop` first.');
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
        text: [ok(`recording in the background (pid ${child.pid}) every ${intervalMs}ms`), kv('output', dir), next('fire web-control ... and then run: web-record-frames --stop')].join('\n'),
      };
    }

    const lines: string[] = [];
    if (intervalMs < 100) lines.push(warn(`a ${intervalMs}ms interval: high CPU/RAM/disk use. Use it only for short microinteractions.`));
    const maxFrames = parseNumber(values['max-frames'], 'max-frames', 600);
    if (durationMs && durationMs / intervalMs > maxFrames) lines.push(warn(`the duration asks for ${Math.ceil(durationMs / intervalMs)} frames; capped at ${maxFrames} (--max-frames).`));

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
