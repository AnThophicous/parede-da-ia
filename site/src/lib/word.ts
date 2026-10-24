/**
 * Geometry of the word shared by the particles, the solid word and the eyes, so the hand-off
 * between them lands on exactly the same pixels. Mirrors the sizing in library/particles/text-morph.js.
 */

export const WORD = 'Parede da IA';
export const WORD_FONT = { family: '"Inter Tight Variable", sans-serif', weight: 600 };

export type Letter = { ch: string; x: number; w: number; cx: number };

export function wordLayout(W: number, H: number) {
  const ctx = document.createElement('canvas').getContext('2d')!;
  ctx.font = `${WORD_FONT.weight} 100px ${WORD_FONT.family}`;
  const measured = ctx.measureText(WORD).width || 1;
  const size = Math.min((W * 0.78) / measured, H * 0.0052) * 100;
  ctx.font = `${WORD_FONT.weight} ${size}px ${WORD_FONT.family}`;
  const total = ctx.measureText(WORD).width;
  let x = (W - total) / 2;
  const letters: Letter[] = [];
  for (const ch of WORD) {
    const w = ctx.measureText(ch).width;
    letters.push({ ch, x, w, cx: x + w / 2 });
    x += w;
  }
  return { size, letters, cy: H / 2 };
}

/** Deterministic pseudo-random per index (same scatter every visit). */
export const seeded = (i: number, salt = 0) => {
  const s = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
