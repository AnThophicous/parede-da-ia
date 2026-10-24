import { ParedeError } from '../../domain/errors.js';
import type { CompareResult, MediaEncoder } from '../ports.js';

export interface ComparisonVerdict extends CompareResult {
  verdict: 'identical' | 'nearly identical' | 'small differences' | 'relevant differences' | 'very different';
}

/** SSIM bands calibrated for visual QA of interfaces (before × after, build × reference). */
export function similarityVerdict(ssim: number): ComparisonVerdict['verdict'] {
  if (ssim >= 0.999) return 'identical';
  if (ssim >= 0.985) return 'nearly identical';
  if (ssim >= 0.95) return 'small differences';
  if (ssim >= 0.85) return 'relevant differences';
  return 'very different';
}

export async function compareImages(encoder: MediaEncoder | null, a: string, b: string, outDir: string): Promise<ComparisonVerdict> {
  if (!encoder) throw new ParedeError('FFMPEG_MISSING', 'web-diff needs FFmpeg.', 'Install ffmpeg or run `npm i ffmpeg-static` in the toolkit.');
  const result = await encoder.compare({ a, b, outDir });
  return { ...result, verdict: similarityVerdict(result.ssim) };
}
