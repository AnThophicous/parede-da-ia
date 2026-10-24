/** Pure color math (sRGB / WCAG). No dependencies. */

export interface Rgb {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function parseHex(hex: string): Rgb | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: h.length === 8 ? Math.round((parseInt(h.slice(6, 8), 16) / 255) * 100) / 100 : 1,
  };
}

const lin = (c: number) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

export const luminance = (c: Rgb) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Difference between the largest and the smallest channel: 0 = pure gray. */
export const chroma = (c: Rgb) => Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b);

export function toHsl(c: Rgb): { h: number; s: number; l: number } {
  const r = c.r / 255;
  const g = c.g / 255;
  const b = c.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return { h: Math.round(h), s: Math.round(s * 100) / 100, l: Math.round(l * 100) / 100 };
}

/** A "warm" off-white (paper, cream): very light, slightly yellowish/reddish. */
export function isWarmPaper(c: Rgb): boolean {
  const { l } = toHsl(c);
  return l >= 0.88 && l < 0.99 && c.r >= c.b && chroma(c) >= 3 && chroma(c) <= 30;
}

/** A color saturated enough to work as a brand accent. */
export function isVivid(c: Rgb): boolean {
  const { s, l } = toHsl(c);
  return s >= 0.45 && l >= 0.25 && l <= 0.85 && chroma(c) >= 60;
}

/** Number of distinct hue families (30° bands) among vivid colors. */
export function distinctHues(colors: Rgb[]): number {
  const buckets = new Set<number>();
  for (const c of colors) if (isVivid(c)) buckets.add(Math.floor(toHsl(c).h / 30));
  return buckets.size;
}
