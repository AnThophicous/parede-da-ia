import { join } from 'node:path';
import type { MediaEncoder, SpritesheetJob } from '../ports.js';

export interface RecordedFrames {
  dir: string;
  framesDir: string;
  format: 'png' | 'jpeg';
  frameCount: number;
  intervalMs: number;
  durationMs: number;
  stopReason: string;
  laggedFrames: number;
  crop: SpritesheetJob['crop'] | null;
  pageFrames: { fps: number; p95FrameMs: number; worstFrameMs: number; longFrames: number } | null;
  animated: { elements: { selector: string; changes: number }[]; properties: { value: string; share: number }[] } | null;
  actions: { action: string; error?: string }[];
}

export interface FinalizeOptions {
  spritesheet: boolean;
  video: boolean;
  gif: boolean;
  tileWidth: number;
  columns?: number;
}

/** Turns raw frames into agent-readable artifacts: spritesheets, MP4 and GIF. */
export async function finalizeRecording(frames: RecordedFrames, encoder: MediaEncoder | null, o: FinalizeOptions) {
  const outputs: { spritesheets: string[]; video: string | null; gif: string | null } = { spritesheets: [], video: null, gif: null };
  const warnings: string[] = [];
  const crop = frames.crop ?? undefined;

  if (frames.frameCount === 0) warnings.push('No frames captured.');
  else if (!encoder) warnings.push('FFmpeg not found: frames saved, but no spritesheet/video. Install ffmpeg or run `npm i ffmpeg-static` in the toolkit.');
  else {
    const fps = Math.max(0.1, 1000 / frames.intervalMs);
    const sequence = { framesDir: frames.framesDir, ext: frames.format, fps, crop };
    try {
      if (o.spritesheet) outputs.spritesheets = await encoder.spritesheets({ framesDir: frames.framesDir, ext: frames.format, frameCount: frames.frameCount, outDir: frames.dir, tileWidth: o.tileWidth, columns: o.columns, crop });
      if (o.video && frames.frameCount > 1) outputs.video = await encoder.video({ ...sequence, out: join(frames.dir, 'session.mp4') });
      if (o.gif && frames.frameCount > 1) outputs.gif = await encoder.gif({ ...sequence, out: join(frames.dir, 'session.gif') });
    } catch (err) {
      const e = err as Error & { hint?: string };
      warnings.push(`${e.message}${e.hint ? ` — ${e.hint}` : ''}`);
    }
  }

  if (frames.laggedFrames > frames.frameCount * 0.2) {
    warnings.push(`${frames.laggedFrames} frames lagged: the machine can't keep up with ${frames.intervalMs}ms. Raise --interval or use --format jpeg.`);
  }
  if (frames.pageFrames && frames.pageFrames.longFrames > frames.pageFrames.fps) {
    warnings.push(`jank: ${frames.pageFrames.longFrames} page frames above 34ms (worst: ${frames.pageFrames.worstFrameMs}ms).`);
  }
  for (const a of frames.actions) if (a.error) warnings.push(`action "${a.action}" failed: ${a.error}`);
  return { ...frames, ffmpeg: encoder?.source ?? null, outputs, warnings };
}

export type RecordingManifest = Awaited<ReturnType<typeof finalizeRecording>>;
