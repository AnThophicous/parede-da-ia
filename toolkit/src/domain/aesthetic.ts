import { chroma, distinctHues, isVivid, isWarmPaper, luminance, parseHex, type Rgb } from './color.js';
import type { AestheticGuess, ScrapReport } from './reports.js';

/**
 * Famílias estéticas do parede-da-ia. Cada id corresponde a um playbook em
 * prompts/aesthetics/<id>.md. A classificação é heurística e explicável: devolve
 * os sinais que pesaram, para o agente confirmar com os próprios olhos.
 */
export const AESTHETICS = {
  'corporativo-modernista': 'Modernismo suíço econômico: grid rígido, poucas cores, tipografia sóbria, movimento contido.',
  'corporativo-marca': 'Marca protagonista: uma cor de marca forte, tipografia display marcante, fotografia e formas orgânicas.',
  'produto-saas': 'Produto/SaaS: clareza funcional, cards, sombras suaves, um acento, ícones de sistema.',
  'imersivo-webgl': 'Experiência imersiva 3D/WebGL: cena viva, física, cursor e scroll coreografados.',
  'gradiente-atmosferico': 'Atmosfera de gradientes e blur: campos de cor desfocados, vidro, grão, escuridão quente.',
  'editorial-brutalista': 'Editorial brutalista: contraste tipográfico extremo, monocromia, linhas finas, layout assimétrico.',
  'canvas-ludico': 'Canvas lúdico de portfólio: prancheta com grid, elementos arrastáveis, stickers e cursores coloridos.',
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

  /** [peso, acertou?, motivo] — pesos negativos são penalidades aplicadas quando acertam. */
  type Signal = [number, boolean, string];
  const signals: Record<AestheticId, Signal[]> = {
    'corporativo-modernista': [
      [1, lightBg, 'fundo claro dominante'],
      [1, vivid.length <= 2, 'no máximo 2 cores vívidas'],
      [1, !motionLib && !webglFull, 'movimento contido (sem GSAP/WebGL)'],
      [1, grid4 >= 70, `espaçamento disciplinado (${grid4}% no grid de 4px)`],
      [0.6, !hasSerif && !hasMono, 'tipografia sans sóbria'],
      [0.7, scaleRatio < 4.5, `escala tipográfica moderada (${scaleRatio.toFixed(1)}×)`],
      [-0.8, e.customCursor || webglFull, 'cursor customizado/WebGL (penaliza)'],
    ],
    'corporativo-marca': [
      [1.2, brandBg, 'cor de marca vívida ocupando área relevante'],
      [1, heavyDisplay, 'display pesado (≥48px, ≥700)'],
      [0.6, images >= 3, 'fotografia presente'],
      [0.5, bigRadius, 'raios generosos / pills'],
      [0.5, vivid.length >= 1 && vivid.length <= 4, 'paleta curta e assertiva'],
      [-0.8, webglFull, 'WebGL fullscreen (penaliza)'],
    ],
    'produto-saas': [
      [0.8, lightBg, 'fundo claro'],
      [0.8, shadows >= 3, `sombras de elevação (${shadows})`],
      [0.8, icons, `biblioteca de ícones (${s.icons.libraries.join(', ') || '—'})`],
      [0.4, bigRadius, 'cards arredondados'],
      [0.5, e.grid + e.flex > 80, 'muitos componentes em grid/flex'],
      [0.5, scaleRatio < 4, 'tipografia funcional'],
      [-0.8, webglFull || e.customCursor, 'efeitos imersivos (penaliza)'],
    ],
    'imersivo-webgl': [
      [1.5, webglFull, 'canvas WebGL em tela cheia'],
      [1, s.media.shaders.length >= 6, `${s.media.shaders.length} shaders GLSL`],
      [0.8, threeLike, 'motor 3D (Three/Babylon/Pixi/Spline)'],
      [0.8, assets3d > 0, `${assets3d} asset(s) 3D (glb/hdr/ktx2…)`],
      [0.4, e.customCursor, 'cursor customizado'],
      [0.4, motionLib, 'biblioteca de movimento'],
      [0.4, e.rafPerSecond > 30, `loop de render (~${e.rafPerSecond} rAF/s)`],
    ],
    'gradiente-atmosferico': [
      [1.2, e.largeBlurs >= 1, `blur grande em ${e.largeBlurs} elemento(s)`],
      [0.8, radialish >= 2 || gradientCount >= 6, `gradientes radiais/cônicos (${radialish})`],
      [1, webglFull && noiseShader, 'campo de cor procedural (shader com noise) em tela cheia'],
      [0.6, e.grainOverlays >= 1, 'grão/noise'],
      [0.5, e.backdropBlurs >= 1, 'vidro (backdrop-filter: blur)'],
      [0.5, darkBg, 'fundo escuro'],
      [0.4, hues >= 2, `${hues} matizes de acento`],
    ],
    'editorial-brutalista': [
      [1.2, s.colors.isMonochrome || vivid.length <= 1, s.colors.isMonochrome ? 'paleta 100% acromática' : 'quase monocromática'],
      [1, scaleRatio >= 6, `contraste de escala extremo (${scaleRatio.toFixed(1)}×)`],
      [0.6, hasSerif && families.length >= 2, 'serifa editorial em par com sans'],
      [0.4, hasMono, 'monoespaçada como voz secundária'],
      [0.5, sharp, 'cantos retos'],
      [0.4, e.mixBlendMode >= 1, 'mix-blend-mode'],
    ],
    'canvas-ludico': [
      [1, paperBg, 'fundo papel/creme'],
      [1, e.rotated >= 3, `${e.rotated} elementos inclinados (cards/stickers)`],
      [1, e.draggable >= 2, `${e.draggable} elementos arrastáveis`],
      [0.8, hues >= 4, `${hues} famílias de matiz (stickers/tags)`],
      [0.4, heavyDisplay, 'wordmark display pesado'],
      [0.3, s.gradients.some((g) => /repeating|linear/.test(g.type)) && e.blurFilters === 0, 'padrão de grid/linhas no fundo'],
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

/** Exposto para outras regras: a cor parece neutra (cinza/papel)? */
export const isNeutral = (c: Rgb) => chroma(c) <= 12;
