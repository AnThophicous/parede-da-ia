import { join } from 'node:path';
import { ParedeError } from '../../domain/errors.js';
import type { ExtractedFrame, MediaEncoder, MediaInfo } from '../ports.js';

export interface VideoFramesOptions {
  input: string;
  outDir: string;
  /** Seconds between frames; when absent, computed for ~`target` frames. */
  everySec?: number;
  /** 0–1 threshold for "scene change" mode (ignores everySec). */
  scenes?: number;
  fromSec?: number;
  toSec?: number;
  target: number;
  maxFrames: number;
  width: number;
  columns: number;
}

export interface VideoFramesResult {
  input: string;
  info: MediaInfo;
  mode: 'uniform' | 'scenes';
  everySec: number | null;
  frames: ExtractedFrame[];
  sheets: string[];
}

/**
 * Lets the agent "watch" a video: screen recordings of references, moving prototypes,
 * reproduced bugs. Produces timestamped frames and numbered contact sheets.
 */
export async function extractVideoFrames(encoder: MediaEncoder | null, o: VideoFramesOptions): Promise<VideoFramesResult> {
  if (!encoder) throw new ParedeError('FFMPEG_MISSING', 'media-frames needs FFmpeg.', 'Install ffmpeg or run `npm i ffmpeg-static` in the toolkit.');
  const info = await encoder.probe(o.input);
  if (!info.width) throw new ParedeError('BAD_MEDIA', `No video track found in ${o.input}.`);
  const from = o.fromSec ?? 0;
  const to = Math.min(o.toSec ?? info.durationSec, info.durationSec || Infinity);
  const span = Math.max(0.5, to - from);
  const everySec = o.scenes !== undefined ? null : (o.everySec ?? Math.max(0.25, Math.round((span / o.target) * 100) / 100));

  const frames = await encoder.extractFrames({
    input: o.input,
    outDir: o.outDir,
    everySec: everySec ?? undefined,
    sceneThreshold: o.scenes,
    fromSec: from || undefined,
    toSec: o.toSec,
    maxFrames: o.maxFrames,
    width: o.width,
  });

  // Contact sheets in blocks of up to 6×5 frames (legible in a single image).
  const perSheet = Math.min(30, o.columns * 5);
  const sheets: string[] = [];
  for (let i = 0; i < frames.length; i += perSheet) {
    const chunk = frames.slice(i, i + perSheet);
    const sheet = join(o.outDir, `contact-${String(sheets.length + 1).padStart(2, '0')}.png`);
    sheets.push(await encoder.contactSheet(chunk, sheet, o.columns, Math.min(480, Math.round(2400 / o.columns))));
  }
  return { input: o.input, info, mode: o.scenes !== undefined ? 'scenes' : 'uniform', everySec, frames, sheets };
}
