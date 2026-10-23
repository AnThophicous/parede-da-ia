import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { ParedeError } from './errors.js';

export interface FfmpegBinary {
  path: string;
  source: 'env' | 'system' | 'ffmpeg-static';
}

/** Ordem: PAREDE_FFMPEG/FFMPEG_PATH → ffmpeg no PATH → pacote opcional ffmpeg-static. */
export function resolveFfmpeg(): FfmpegBinary | null {
  const fromEnv = process.env.PAREDE_FFMPEG ?? process.env.FFMPEG_PATH;
  if (fromEnv && existsSync(fromEnv)) return { path: fromEnv, source: 'env' };

  const probe = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore', windowsHide: true });
  if (probe.status === 0) return { path: 'ffmpeg', source: 'system' };

  try {
    const bundled = createRequire(import.meta.url)('ffmpeg-static') as string | null;
    if (bundled && existsSync(bundled)) return { path: bundled, source: 'ffmpeg-static' };
  } catch {
    // pacote opcional ausente
  }
  return null;
}

function run(bin: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new ParedeError('FFMPEG', `FFmpeg falhou (código ${code}).`, stderr.trim().split('\n').slice(-4).join('\n'))),
    );
  });
}

export interface SpritesheetOptions {
  framesDir: string;
  ext: 'png' | 'jpeg';
  frameCount: number;
  outDir: string;
  tileWidth: number;
  columns?: number;
}

/**
 * Monta spritesheets com o filtro `tile`. Cada folha tem no máximo 8×8 frames;
 * gravações maiores geram spritesheet-01.png, spritesheet-02.png, ...
 */
export async function buildSpritesheets(ffmpeg: FfmpegBinary, o: SpritesheetOptions): Promise<string[]> {
  const perSheetCols = Math.min(8, o.columns ?? Math.ceil(Math.sqrt(o.frameCount)));
  const rows = Math.min(8, Math.ceil(o.frameCount / perSheetCols));
  const input = join(o.framesDir, `frame_%05d.${o.ext === 'jpeg' ? 'jpg' : 'png'}`);
  const pattern = join(o.outDir, 'spritesheet-%02d.png');
  await run(ffmpeg.path, [
    '-y', '-loglevel', 'error',
    '-framerate', '1', '-start_number', '0', '-i', input,
    '-vf', `scale=${o.tileWidth}:-2:flags=lanczos,tile=${perSheetCols}x${rows}:margin=8:padding=8:color=black`,
    '-start_number', '1', pattern,
  ]);
  return readdirSync(o.outDir)
    .filter((f) => /^spritesheet-\d+\.png$/.test(f))
    .sort()
    .map((f) => join(o.outDir, f));
}

export async function buildVideo(ffmpeg: FfmpegBinary, framesDir: string, ext: 'png' | 'jpeg', fps: number, out: string): Promise<string> {
  await run(ffmpeg.path, [
    '-y', '-loglevel', 'error',
    '-framerate', String(fps), '-start_number', '0', '-i', join(framesDir, `frame_%05d.${ext === 'jpeg' ? 'jpg' : 'png'}`),
    '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', String(Math.max(fps, 24)),
    out,
  ]);
  return out;
}

export async function buildGif(ffmpeg: FfmpegBinary, framesDir: string, ext: 'png' | 'jpeg', fps: number, out: string, width = 720): Promise<string> {
  await run(ffmpeg.path, [
    '-y', '-loglevel', 'error',
    '-framerate', String(fps), '-start_number', '0', '-i', join(framesDir, `frame_%05d.${ext === 'jpeg' ? 'jpg' : 'png'}`),
    '-vf', `scale=${width}:-2:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3`,
    '-loop', '0',
    out,
  ]);
  return out;
}
