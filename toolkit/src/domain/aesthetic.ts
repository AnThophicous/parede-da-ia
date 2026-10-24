import { chroma, distinctHues, isVivid, isWarmPaper, luminance, parseHex, type Rgb } from './color.js';
import type { AestheticGuess, ScrapReport } from './reports.js';

/**
 * parede-da-ia's aesthetic families. Each id maps to a playbook in
 * prompts/aesthetics/<id>.md. The classification is heuristic and explainable: it returns
 * the signals that weighed in, so the agent can confirm them with its own eyes.
 */
export const AESTHETICS = {
  'corporate-modernist': 'Economical Swiss modernism: rigid grid, few colors, sober type, restrained motion.',
  'corporate-brand': 'The brand leads: one strong brand color, striking display type, photography and organic shapes.',
  'product-saas': 'Product/SaaS: functional clarity, cards, soft shadows, one accent, system icons.',
  'immersive-webgl': 'Immersive 3D/WebGL experience: a living scene, physics, choreographed cursor and scroll.',
  'atmospheric-gradient': 'Gradient and blur atmosphere: blurred color fields, glass, grain, warm darkness.',
  'editorial-brutalist': 'Brutalist editorial: extreme typographic contrast, monochrome, hairlines, asymmetric layout.',
  'playful-canvas': 'A playful portfolio canvas: a drafting board with a grid, draggable elements, stickers and colored cursors.',
} as const;

export type AestheticId = keyof typeof AESTHETICS;

const px = (v: string) => parseFloat(v) || 0;

export function classifyAesthetic(s: ScrapReport): AestheticGuess {
  const colors = (list: { value: string }[]) => list.map((c) => parseHex(c.value)).filter((c): c is Rgb => Boolean(c));
  const bgs = colors(s.colors.background);
  const dominantBg = bgs[0];
  const darkBg = dominantBg ? luminance(dominantBg) < 0.15 : false;
  const lightBg = dominantBg ? luminance(dominantBg) > 0.75 : false;
  const paperBg = dominantBg ? isWarmPaper(dominantBg) : false;
  const allUsed = colors([...s.colors.background, ...s.colors.text, ...s.colors.accent, ...s.colors.svg, ...s.colors.borders]);
  const vivid = allUsed.filter(isVivid);
  const hues = distinctHues(allUsed);
  const brandBg = s.colors.background.slice(0, 4).some((c) => {
    const rgb = parseHex(c.value);
    return rgb !== null && isVivid(rgb) && c.share >= 4;
  });

  const sizes = s.fonts.scale.map((t) => px(t.size)).filter(Boolean);
  const maxSize = Math.max(16, ...sizes);
  const scaleRatio = maxSize / 16;
  const families = s.fonts.families.filter((f) => f.usedShare > 2).map((f) => f.family.toLowerCase());
  const hasSerif = families.some((f) => /serif|garamond|caslon|didot|bodoni|playfair|instrument|editorial|times|georgia|tiempos|canela|freight/.test(f) && !/sans/.test(f));
  const hasMono = families.some((f) => /mono|code|courier|plex mono|jetbrains/.test(f));
  const heavyDisplay = s.fonts.scale.some((t) => px(t.size) >= 48 && Number(t.weight) >= 700);

  const e = s.effects;
  const stackNames = s.stack.map((x) => x.name);
  const webglFull = s.media.canvases.some((c) => /webgl/.test(c.context) && c.fullscreen);
  const threeLike = stackNames.some((n) => /Three|Babylon|PixiJS|Spline|OGL/.test(n));
  const motionLib = stackNames.some((n) => /GSAP|ScrollTrigger|Lenis|Locomotive|Barba|Motion/.test(n));
  const radii = s.layout.radii.map((r) => r.value);
  const bigRadius = radii.some((r) => r === 'pill' || px(r) >= 16);
  const sharp = radii.length === 0 || radii.every((r) => r !== 'pill' && px(r) <= 4);
  const gradientCount = s.gradients.reduce((n, g) => n + g.count, 0);
  const radialish = s.gradients.filter((g) => /radial|conic/.test(g.type)).length;
  const images = s.media.images.length;
  const icons = s.icons.libraries.length > 0;
  const shadows = s.effects.shadows.length;
  const grid4 = s.layout.spacingOn4pxGrid ?? 0;

  const noiseShader = s.media.shaders.some((sh) => sh.type === 'fragment' && /noise|fbm|simplex|perlin|curl|warp/i.test(sh.source));
  const assets3d = s.network.assets3d.length;

  /** [weight, matched?, reason] — negative weights are penalties applied when they match. */
  type Signal = [number, boolean, string];
  const signals: Record<AestheticId, Signal[]> = {
    'corporate-modernist': [
      [1, lightBg, 'dominant light background'],
      [1, vivid.length <= 2, 'at most 2 vivid colors'],
      [1, !motionLib && !webglFull, 'restrained motion (no GSAP/WebGL)'],
      [1, grid4 >= 70, `disciplined spacing (${grid4}% on the 4px grid)`],
      [0.6, !hasSerif && !hasMono, 'sober sans typography'],
      [0.7, scaleRatio < 4.5, `moderate type scale (${scaleRatio.toFixed(1)}×)`],
      [-0.8, e.customCursor || webglFull, 'custom cursor/WebGL (penalty)'],
    ],
    'corporate-brand': [
      [1.2, brandBg, 'a vivid brand color covering a relevant area'],
      [1, heavyDisplay, 'heavy display (≥48px, ≥700)'],
      [0.6, images >= 3, 'photography present'],
      [0.5, bigRadius, 'generous radii / pills'],
      [0.5, vivid.length >= 1 && vivid.length <= 4, 'a short, assertive palette'],
      [-0.8, webglFull, 'fullscreen WebGL (penalty)'],
    ],
    'product-saas': [
      [0.8, lightBg, 'light background'],
      [0.8, shadows >= 3, `elevation shadows (${shadows})`],
      [0.8, icons, `icon library (${s.icons.libraries.join(', ') || '—'})`],
      [0.4, bigRadius, 'rounded cards'],
      [0.5, e.grid + e.flex > 80, 'many grid/flex components'],
      [0.5, scaleRatio < 4, 'functional typography'],
      [-0.8, webglFull || e.customCursor, 'immersive effects (penalty)'],
    ],
    'immersive-webgl': [
      [1.5, webglFull, 'fullscreen WebGL canvas'],
      [1, s.media.shaders.length >= 6, `${s.media.shaders.length} GLSL shaders`],
      [0.8, threeLike, '3D engine (Three/Babylon/Pixi/Spline)'],
      [0.8, assets3d > 0, `${assets3d} 3D asset(s) (glb/hdr/ktx2…)`],
      [0.4, e.customCursor, 'custom cursor'],
      [0.4, motionLib, 'motion library'],
      [0.4, e.rafPerSecond > 30, `render loop (~${e.rafPerSecond} rAF/s)`],
    ],
    'atmospheric-gradient': [
      [1.2, e.largeBlurs >= 1, `large blur on ${e.largeBlurs} element(s)`],
      [0.8, radialish >= 2 || gradientCount >= 6, `radial/conic gradients (${radialish})`],
      [1, webglFull && noiseShader, 'fullscreen procedural color field (noise shader)'],
      [0.6, e.grainOverlays >= 1, 'grain/noise'],
      [0.5, e.backdropBlurs >= 1, 'glass (backdrop-filter: blur)'],
      [0.5, darkBg, 'dark background'],
      [0.4, hues >= 2, `${hues} accent hues`],
    ],
    'editorial-brutalist': [
      [1.2, s.colors.isMonochrome || vivid.length <= 1, s.colors.isMonochrome ? '100% achromatic palette' : 'nearly monochrome'],
      [1, scaleRatio >= 6, `extreme scale contrast (${scaleRatio.toFixed(1)}×)`],
      [0.6, hasSerif && families.length >= 2, 'an editorial serif paired with a sans'],
      [0.4, hasMono, 'monospace as a secondary voice'],
      [0.5, sharp, 'square corners'],
      [0.4, e.mixBlendMode >= 1, 'mix-blend-mode'],
    ],
    'playful-canvas': [
      [1, paperBg, 'paper/cream background'],
      [1, e.rotated >= 3, `${e.rotated} tilted elements (cards/stickers)`],
      [1, e.draggable >= 2, `${e.draggable} draggable elements`],
      [0.8, hues >= 4, `${hues} hue families (stickers/tags)`],
      [0.4, heavyDisplay, 'heavy display wordmark'],
      [0.3, s.gradients.some((g) => /repeating|linear/.test(g.type)) && e.blurFilters === 0, 'a grid/line pattern in the background'],
    ],
  };

  const scores = {} as Record<AestheticId, number>;
  const reasons = {} as Record<AestheticId, string[]>;
  for (const id of Object.keys(signals) as AestheticId[]) {
    const list = signals[id];
    const max = list.reduce((n, [w]) => n + Math.max(0, w), 0) || 1;
    const got = list.reduce((n, [w, hit]) => (hit ? n + w : n), 0);
    scores[id] = Math.max(0, Math.round((got / max) * 100) / 100);
    reasons[id] = list.filter(([w, hit]) => hit && w > 0).map(([, , why]) => why);
  }
  const ranked = (Object.keys(scores) as AestheticId[]).sort((a, b) => scores[b] - scores[a]);
  const [primary, second] = ranked;
  const margin = scores[primary] - (scores[second] ?? 0);
  return {
    primary,
    secondary: scores[second] >= 0.35 ? second : null,
    confidence: Math.round(Math.min(1, scores[primary] * 0.7 + margin * 0.6) * 100) / 100,
    scores,
    signals: reasons[primary],
    playbook: `prompts/aesthetics/${primary}.md`,
  };
}

/** Exposed for other rules: does the color look neutral (gray/paper)? */
export const isNeutral = (c: Rgb) => chroma(c) <= 12;
