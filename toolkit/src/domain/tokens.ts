import type { MotionReport, Ranked, ScrapReport } from './reports.js';

/**
 * Converte o que foi medido numa página em design tokens reutilizáveis
 * (formato próximo do W3C Design Tokens + CSS custom properties).
 * Serve para auditar consistência ou para partir de uma referência sem copiá-la.
 */
export interface TokenSet {
  json: Record<string, Record<string, { $value: string; $type: string; $description?: string }>>;
  css: string;
}

const px = (v: string) => parseFloat(v) || 0;
const uniq = <T>(list: T[]) => [...new Set(list)];

function ranked(list: Ranked[], n: number) {
  return list.filter((r) => r.value && r.value !== 'none').slice(0, n);
}

export function buildTokens(s: ScrapReport, motion?: MotionReport | null): TokenSet {
  const json: TokenSet['json'] = { color: {}, font: {}, text: {}, space: {}, radius: {}, shadow: {}, motion: {} };
  const add = (group: string, name: string, value: string, type: string, description?: string) => {
    json[group][name] = { $value: value, $type: type, ...(description ? { $description: description } : {}) };
  };

  ranked(s.colors.background, 3).forEach((c, i) => add('color', i === 0 ? 'bg' : `bg-${i + 1}`, c.value, 'color', `${c.share}% da área`));
  ranked(s.colors.text, 3).forEach((c, i) => add('color', i === 0 ? 'fg' : `fg-${i + 1}`, c.value, 'color', `${c.share}% do texto`));
  ranked(s.colors.accent, 4).forEach((c, i) => add('color', `accent-${i + 1}`, c.value, 'color'));
  ranked(s.colors.borders, 2).forEach((c, i) => add('color', i === 0 ? 'border' : `border-${i + 1}`, c.value, 'color'));

  const byShare = [...s.fonts.families].sort((a, b) => b.usedShare - a.usedShare);
  const largest = [...s.fonts.scale].sort((a, b) => px(b.size) - px(a.size))[0];
  const mono = byShare.find((f) => /mono|code|courier/i.test(f.family));
  if (largest) add('font', 'display', `"${largest.family}"`, 'fontFamily');
  if (byShare[0]) add('font', 'body', `"${byShare[0].family}"`, 'fontFamily', `${byShare[0].usedShare}% do texto`);
  if (mono) add('font', 'mono', `"${mono.family}"`, 'fontFamily');

  const scale = uniq([...s.fonts.scale].sort((a, b) => px(b.size) - px(a.size)).map((t) => t.size));
  scale.slice(0, 9).forEach((size, i) => {
    const style = s.fonts.scale.find((t) => t.size === size)!;
    add('text', `size-${i + 1}`, size, 'dimension', `peso ${style.weight} · lh ${style.lineHeight} · ls ${style.letterSpacing} · ex.: "${style.sample.slice(0, 24)}"`);
  });

  uniq(s.layout.spacingScale.map((r) => Number(r.value)).filter((n) => n > 0))
    .sort((a, b) => a - b)
    .slice(0, 12)
    .forEach((n, i) => add('space', `${i + 1}`, `${n}px`, 'dimension'));

  const radiusNames = ['sm', 'md', 'lg', 'xl'];
  const radii = s.layout.radii.map((r) => r.value).filter((r) => r !== 'pill').sort((a, b) => px(a) - px(b));
  radii.slice(0, 4).forEach((r, i) => add('radius', radiusNames[i], r, 'dimension'));
  if (s.layout.radii.some((r) => r.value === 'pill')) add('radius', 'pill', '999px', 'dimension');

  s.effects.shadows.slice(0, 4).forEach((v, i) => add('shadow', `${i + 1}`, v, 'shadow'));

  const durations = motion?.transitions.durations ?? s.motion.durations;
  const easings = motion?.transitions.easings ?? s.motion.easings;
  ranked(durations, 4).forEach((d, i) => add('motion', `duration-${i + 1}`, d.value, 'duration', `${d.share}% das transições`));
  ranked(easings, 4).forEach((e, i) => add('motion', `ease-${i + 1}`, e.value, 'cubicBezier', `${e.share}% das transições`));

  const lines: string[] = [`/* Tokens extraídos de ${s.page.url} em ${s.generatedAt} por parede-da-ia web-tokens. */`, ':root {'];
  for (const [group, entries] of Object.entries(json)) {
    for (const [name, token] of Object.entries(entries)) {
      lines.push(`  --${group}-${name}: ${token.$value};${token.$description ? ` /* ${token.$description.replace(/\*\//g, '')} */` : ''}`);
    }
  }
  lines.push('}');
  return { json, css: lines.join('\n') + '\n' };
}
