import { existsSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { compareImages } from '../../../application/use-cases/compare-images.js';
import { extractVideoFrames } from '../../../application/use-cases/extract-video-frames.js';
import { ParedeError } from '../../../domain/errors.js';
import { slug, stamp } from '../../../domain/naming.js';
import { parseDuration, parseNumber } from '../../../domain/units.js';
import { kv, next, ok, parse, type Command } from './shared.js';

const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${(s % 60).toFixed(1).padStart(4, '0')}`;

export const mediaFrames: Command = {
  name: 'media-frames',
  group: 'media',
  summary: 'Lets the agent "watch" a video: timestamped frames + numbered contact sheets.',
  usage: `media-frames <video> [options]
  --every 1.5            one frame every N seconds (default: ~24 frames across the whole video)
  --scenes 0.25          instead of a fixed interval, one frame per scene change (0–1)
  --from 5 --to 20       a time range in seconds
  --max 60               frame limit
  --width 640            width of each extracted frame
  --columns 5            contact sheet columns
  --out <dir>

Use it on screen recordings the user sends (references, bugs, prototypes).`,
  async execute(argv, ctx) {
    const { values, positionals } = parse(
      argv,
      { every: { type: 'string' }, scenes: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' }, max: { type: 'string' }, width: { type: 'string' }, columns: { type: 'string' }, out: { type: 'string' } },
      this.usage,
    );
    const input = positionals.join(' ').trim();
    if (!input) throw new ParedeError('BAD_ARG', 'Provide the video file.', this.usage);
    const path = /^https?:/.test(input) ? input : resolve(input);
    if (!/^https?:/.test(path) && !existsSync(path)) throw new ParedeError('NOT_FOUND', `File not found: ${path}`);
    const outDir = values.out ? resolve(values.out) : ctx.artifacts.dir('media', `${slug(basename(path).replace(/\.[^.]+$/, ''))}-${stamp()}`);
    const result = await extractVideoFrames(ctx.encoder(), {
      input: path,
      outDir,
      everySec: values.every ? parseDuration(values.every, 's') / 1000 : undefined,
      scenes: values.scenes !== undefined ? Number(values.scenes) : undefined,
      fromSec: values.from ? parseDuration(values.from, 's') / 1000 : undefined,
      toSec: values.to ? parseDuration(values.to, 's') / 1000 : undefined,
      target: 24,
      maxFrames: parseNumber(values.max, 'max', 60),
      width: parseNumber(values.width, 'width', 640),
      columns: parseNumber(values.columns, 'columns', 5),
    });
    const manifest = resolve(outDir, 'frames.json');
    writeFileSync(manifest, JSON.stringify(result, null, 2));
    const i = result.info;
    return {
      data: { manifest, ...result },
      text: [
        ok(`${result.frames.length} frames from ${basename(path)} (${fmtTime(i.durationSec)} · ${i.width}x${i.height} · ${i.fps} fps${i.hasAudio ? ' · with audio' : ''})`),
        kv('mode', result.mode === 'scenes' ? 'scene change' : `every ${result.everySec}s`),
        ...result.sheets.map((s) => kv('sheet', s)),
        kv('times', result.frames.slice(0, 12).map((f) => `#${f.index + 1} ${fmtTime(f.timeSec)}`).join(' · ') + (result.frames.length > 12 ? ' …' : '')),
        kv('manifest', manifest),
        next('read the contact sheets (numbers = frames; times in the manifest), then single frames if you need detail'),
      ].join('\n'),
    };
  },
};

export const diff: Command = {
  name: 'web-diff',
  group: 'media',
  summary: 'Compares two images (before × after, build × reference): SSIM, PSNR, a difference map and side by side.',
  usage: `web-diff <a.png> <b.png> [--out folder]
  The second image is resized to the size of the first one when needed.`,
  async execute(argv, ctx) {
    const { values, positionals } = parse(argv, { out: { type: 'string' } }, this.usage);
    const [a, b] = positionals.map((p) => resolve(p));
    if (!a || !b) throw new ParedeError('BAD_ARG', 'Provide two images.', this.usage);
    for (const f of [a, b]) if (!existsSync(f)) throw new ParedeError('NOT_FOUND', `File not found: ${f}`);
    const outDir = values.out ? resolve(values.out) : ctx.artifacts.dir('diff', stamp());
    const r = await compareImages(ctx.encoder(), a, b, outDir);
    return {
      data: r,
      text: [
        ok(`${r.verdict} — SSIM ${r.ssim.toFixed(4)} · PSNR ${r.psnr === null ? '—' : r.psnr === Infinity ? '∞' : `${r.psnr.toFixed(1)} dB`}${r.resized ? ' (b resized)' : ''}`),
        kv('difference', r.diff),
        kv('side by side', r.sideBySide),
        next('read the side by side (a | b | difference magnified 4×) to find what changed'),
      ].join('\n'),
    };
  },
};
