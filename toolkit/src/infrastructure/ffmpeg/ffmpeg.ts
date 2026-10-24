import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import type { CompareJob, CompareResult, ExtractedFrame, ExtractJob, MediaEncoder, MediaInfo, SequenceJob, SpritesheetJob } from '../../application/ports.js';
import { ParedeError } from '../../domain/errors.js';

export interface FfmpegBinary {
  path: string;
  source: 'env' | 'system' | 'ffmpeg-static';
}

/** Order: PAREDE_FFMPEG/FFMPEG_PATH → ffmpeg on the PATH → the optional ffmpeg-static package. */
export function resolveFfmpeg(): FfmpegBinary | null {
  const fromEnv = process.env.PAREDE_FFMPEG ?? process.env.FFMPEG_PATH;
  if (fromEnv && existsSync(fromEnv)) return { path: fromEnv, source: 'env' };

  const probe = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore', windowsHide: true });
  if (probe.status === 0) return { path: 'ffmpeg', source: 'system' };

  try {
    const bundled = createRequire(import.meta.url)('ffmpeg-static') as string | null;
    if (bundled && existsSync(bundled)) return { path: bundled, source: 'ffmpeg-static' };
  } catch {
    // optional package missing
  }
  return null;
}

/** Runs FFmpeg and returns stderr (where showinfo, ssim and psnr end up). */
function run(bin: string, args: string[], okCodes = [0]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
    child.on('error', reject);
    child.on('close', (code) =>
      okCodes.includes(code ?? -1)
        ? resolve(stderr)
        : reject(new ParedeError('FFMPEG', `FFmpeg failed (code ${code}).`, stderr.trim().split('\n').slice(-4).join('\n'))),
    );
  });
}

const framePattern = (dir: string, ext: 'png' | 'jpeg') => join(dir, `frame_%05d.${ext === 'jpeg' ? 'jpg' : 'png'}`);
const cropFilter = (crop?: SpritesheetJob['crop']) =>
  crop ? `crop=${Math.round(crop.width)}:${Math.round(crop.height)}:${Math.round(crop.x)}:${Math.round(crop.y)},` : '';

/** A system font to label frames (drawtext). Without a font, labels are omitted. */
function labelFont(): string | null {
  const candidates =
    process.platform === 'win32'
      ? ['C:/Windows/Fonts/consola.ttf', 'C:/Windows/Fonts/arial.ttf', 'C:/Windows/Fonts/segoeui.ttf']
      : process.platform === 'darwin'
        ? ['/System/Library/Fonts/Supplemental/Arial.ttf', '/Library/Fonts/Arial.ttf', '/System/Library/Fonts/Menlo.ttc']
        : ['/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/dejavu/DejaVuSans.ttf', '/usr/share/fonts/TTF/DejaVuSans.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'];
  return candidates.find((f) => existsSync(f)) ?? null;
}
const escapeFilterPath = (p: string) => p.replace(/\\/g, '/').replace(/:/g, '\\:');

function parseProbe(stderr: string): MediaInfo {
  const duration = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(stderr);
  const video = /Stream #\d+:\d+.*?Video:.*?(\d{2,5})x(\d{2,5})/.exec(stderr);
  const fps = /(\d+(?:\.\d+)?)\s*fps/.exec(stderr);
  return {
    durationSec: duration ? Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]) : 0,
    width: video ? Number(video[1]) : 0,
    height: video ? Number(video[2]) : 0,
    fps: fps ? Number(fps[1]) : 0,
    hasAudio: /Stream #\d+:\d+.*?Audio:/.test(stderr),
  };
}

export class FfmpegEncoder implements MediaEncoder {
  readonly source: string;
  constructor(private readonly bin: FfmpegBinary) {
    this.source = bin.source;
  }

  async probe(file: string): Promise<MediaInfo> {
    if (!existsSync(file) && !/^https?:/.test(file)) throw new ParedeError('NOT_FOUND', `File not found: ${file}`);
    // Without an output FFmpeg exits with code 1, but stderr carries the metadata.
    return parseProbe(await run(this.bin.path, ['-hide_banner', '-i', file], [0, 1]));
  }

  /** Spritesheets with the `tile` filter (max 8×8 per sheet → spritesheet-01.png, -02.png...). */
  async spritesheets(job: SpritesheetJob): Promise<string[]> {
    const cols = Math.min(8, job.columns ?? Math.ceil(Math.sqrt(job.frameCount)));
    const rows = Math.min(8, Math.ceil(job.frameCount / cols));
    await run(this.bin.path, [
      '-y', '-loglevel', 'error',
      '-framerate', '1', '-start_number', '0', '-i', framePattern(job.framesDir, job.ext),
      '-vf', `${cropFilter(job.crop)}scale=${job.tileWidth}:-2:flags=lanczos,tile=${cols}x${rows}:margin=8:padding=8:color=black`,
      '-start_number', '1', join(job.outDir, 'spritesheet-%02d.png'),
    ]);
    return readdirSync(job.outDir)
      .filter((f) => /^spritesheet-\d+\.png$/.test(f))
      .sort()
      .map((f) => join(job.outDir, f));
  }

  async video(job: SequenceJob): Promise<string> {
    await run(this.bin.path, [
      '-y', '-loglevel', 'error',
      '-framerate', String(job.fps), '-start_number', '0', '-i', framePattern(job.framesDir, job.ext),
      '-vf', `${cropFilter(job.crop)}pad=ceil(iw/2)*2:ceil(ih/2)*2`,
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', String(Math.max(job.fps, 24)),
      job.out,
    ]);
    return job.out;
  }

  async gif(job: SequenceJob): Promise<string> {
    await run(this.bin.path, [
      '-y', '-loglevel', 'error',
      '-framerate', String(job.fps), '-start_number', '0', '-i', framePattern(job.framesDir, job.ext),
      '-vf', `${cropFilter(job.crop)}scale=${job.width ?? 720}:-2:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3`,
      '-loop', '0',
      job.out,
    ]);
    return job.out;
  }

  /**
   * Extracts frames from a video (screen recordings of references, for example).
   * Uniform mode (one frame every N s) or by scene change; real timestamps through showinfo.
   */
  async extractFrames(job: ExtractJob): Promise<ExtractedFrame[]> {
    const from = job.fromSec ?? 0;
    const selector = job.sceneThreshold !== undefined
      ? `select='eq(n\\,0)+gt(scene\\,${job.sceneThreshold})'`
      : `fps=1/${job.everySec ?? 1}`;
    const args = ['-y', '-hide_banner', '-loglevel', 'info'];
    if (from > 0) args.push('-ss', String(from));
    args.push('-i', job.input);
    if (job.toSec !== undefined) args.push('-t', String(Math.max(0.1, job.toSec - from)));
    args.push(
      '-vf', `setpts=PTS+${from}/TB,${selector},scale=${job.width}:-2:flags=lanczos,showinfo`,
      '-fps_mode', 'vfr', '-frames:v', String(job.maxFrames), '-q:v', '3',
      join(job.outDir, 'frame_%04d.jpg'),
    );
    const stderr = await run(this.bin.path, args);
    const times = [...stderr.matchAll(/\[Parsed_showinfo[^\]]*\].*?pts_time:\s*([\d.]+)/g)].map((m) => Number(m[1]));
    const files = readdirSync(job.outDir).filter((f) => /^frame_\d{4}\.jpg$/.test(f)).sort();
    return files.map((f, i) => ({ index: i, file: join(job.outDir, f), timeSec: Math.round((times[i] ?? from + i * (job.everySec ?? 1)) * 100) / 100 }));
  }

  /** A contact sheet labeled with each frame's index and timestamp. */
  async contactSheet(frames: ExtractedFrame[], out: string, columns: number, tileWidth: number): Promise<string> {
    if (!frames.length) throw new ParedeError('NO_FRAMES', 'No frames to build the contact sheet.');
    const dir = frames[0].file.replace(/[\\/][^\\/]+$/, '');
    const start = Number(/frame_(\d+)\.jpg$/.exec(frames[0].file)?.[1] ?? 1);
    const cols = Math.min(columns, frames.length);
    const rows = Math.ceil(frames.length / cols);
    const font = labelFont();
    // Label = frame number (1-based, continuous across sheets); the manifest maps number → timestamp.
    const label = font
      ? `,drawtext=fontfile='${escapeFilterPath(font)}':text='%{eif\\:n+${start}\\:d}':x=10:y=10:fontsize=${Math.round(tileWidth / 14)}:fontcolor=white:box=1:boxcolor=black@0.7:boxborderw=6`
      : '';
    const base = ['-y', '-loglevel', 'error', '-framerate', '1', '-start_number', String(start), '-i', join(dir, 'frame_%04d.jpg')];
    const tile = `tile=${cols}x${rows}:margin=8:padding=8:color=black`;
    try {
      await run(this.bin.path, [...base, '-vf', `scale=${tileWidth}:-2:flags=lanczos${label},${tile}`, '-frames:v', '1', out]);
    } catch (err) {
      if (!label) throw err;
      await run(this.bin.path, [...base, '-vf', `scale=${tileWidth}:-2:flags=lanczos,${tile}`, '-frames:v', '1', out]);
    }
    return out;
  }

  /** Visual difference between two images: SSIM, PSNR, a difference map and side by side. */
  async compare(job: CompareJob): Promise<CompareResult> {
    const [a, b] = await Promise.all([this.probe(job.a), this.probe(job.b)]);
    if (!a.width || !b.width) throw new ParedeError('BAD_IMAGE', 'Could not read the image dimensions.');
    const { width: W, height: H } = a;
    const resized = a.width !== b.width || a.height !== b.height;
    const scaleB = `scale=${W}:${H}:flags=bicubic`;

    const ssimLog = await run(this.bin.path, ['-hide_banner', '-i', job.a, '-i', job.b, '-lavfi', `[1:v]${scaleB}[b];[0:v][b]ssim`, '-f', 'null', '-']);
    const psnrLog = await run(this.bin.path, ['-hide_banner', '-i', job.a, '-i', job.b, '-lavfi', `[1:v]${scaleB}[b];[0:v][b]psnr`, '-f', 'null', '-']);
    const ssim = Number(/All:\s*([\d.]+)/.exec(ssimLog)?.[1] ?? NaN);
    const psnrRaw = /average:\s*([\d.]+|inf)/.exec(psnrLog)?.[1];
    const psnr = psnrRaw === undefined ? null : psnrRaw === 'inf' ? Infinity : Number(psnrRaw);

    const diff = join(job.outDir, 'diff.png');
    const sideBySide = join(job.outDir, 'side-by-side.png');
    const amplify = 'lutrgb=r=val*4:g=val*4:b=val*4';
    const shrink = W * 3 > 3000 ? ',scale=3000:-2:flags=lanczos' : '';
    await run(this.bin.path, [
      '-y', '-loglevel', 'error', '-i', job.a, '-i', job.b,
      '-filter_complex',
      `[0:v]format=gbrp,split=2[a1][a2];[1:v]${scaleB},format=gbrp,split=2[b1][b2];` +
        `[a1][b1]blend=all_mode=difference,format=rgb24,${amplify},split=2[d1][d2];` +
        `[a2]format=rgb24[a3];[b2]format=rgb24[b3];[a3][b3][d1]hstack=inputs=3${shrink}[s]`,
      '-map', '[d2]', '-frames:v', '1', diff,
      '-map', '[s]', '-frames:v', '1', sideBySide,
    ]);
    return { ssim, psnr, diff, sideBySide, resized };
  }
}

export function createFfmpegEncoder(): MediaEncoder | null {
  const bin = resolveFfmpeg();
  return bin ? new FfmpegEncoder(bin) : null;
}
