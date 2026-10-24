import { ParedeError } from '../../domain/errors.js';
import type { CompareResult, MediaEncoder } from '../ports.js';

export interface ComparisonVerdict extends CompareResult {
  verdict: 'idênticas' | 'quase idênticas' | 'diferenças pequenas' | 'diferenças relevantes' | 'muito diferentes';
}

/** Faixas de SSIM calibradas para QA visual de interfaces (antes × depois, build × referência). */
export function similarityVerdict(ssim: number): ComparisonVerdict['verdict'] {
  if (ssim >= 0.999) return 'idênticas';
  if (ssim >= 0.985) return 'quase idênticas';
  if (ssim >= 0.95) return 'diferenças pequenas';
  if (ssim >= 0.85) return 'diferenças relevantes';
  return 'muito diferentes';
}

export async function compareImages(encoder: MediaEncoder | null, a: string, b: string, outDir: string): Promise<ComparisonVerdict> {
  if (!encoder) throw new ParedeError('FFMPEG_MISSING', 'web-diff precisa do FFmpeg.', 'Instale ffmpeg ou rode `npm i ffmpeg-static` na toolkit.');
  const result = await encoder.compare({ a, b, outDir });
  return { ...result, verdict: similarityVerdict(result.ssim) };
}
