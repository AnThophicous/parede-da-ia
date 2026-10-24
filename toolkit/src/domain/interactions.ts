import type { InteractionItem, StyleChange } from './reports.js';

export type StyleSnapshot = Record<'self' | '::before' | '::after' | 'child', Record<string, string> | null>;

const IGNORE_SAME = new Set(['cursor']);

/** Difference between two computed-style snapshots (before × after an interaction). */
export function diffStyles(before: StyleSnapshot, after: StyleSnapshot): StyleChange[] {
  const changes: StyleChange[] = [];
  for (const target of ['self', '::before', '::after', 'child'] as const) {
    const a = before[target];
    const b = after[target];
    if (!a || !b) {
      if (a !== b) changes.push({ target, property: 'presence', from: a ? 'visible' : 'absent', to: b ? 'visible' : 'absent' });
      continue;
    }
    for (const property of Object.keys(b)) {
      if (IGNORE_SAME.has(property)) continue;
      if (a[property] !== b[property]) changes.push({ target, property, from: a[property] ?? '', to: b[property] ?? '' });
    }
  }
  return changes;
}

/** Translation component (px) of a computed transform: matrix(...) or matrix3d(...). */
export function translationOf(transform: string | undefined, translate?: string): { x: number; y: number } {
  let x = 0;
  let y = 0;
  const m2 = /^matrix\(([^)]+)\)/.exec(transform ?? '');
  const m3 = /^matrix3d\(([^)]+)\)/.exec(transform ?? '');
  if (m2) {
    const v = m2[1].split(',').map(Number);
    x = v[4] ?? 0;
    y = v[5] ?? 0;
  } else if (m3) {
    const v = m3[1].split(',').map(Number);
    x = v[12] ?? 0;
    y = v[13] ?? 0;
  }
  const t = (translate ?? '').split(' ').map((p) => parseFloat(p) || 0);
  return { x: x + (t[0] ?? 0), y: y + (t[1] ?? 0) };
}

/** Magnetic = the element (or its first child) moves toward the cursor. */
export function isMagnetic(hover: StyleSnapshot, nudged: StyleSnapshot, nudge: { x: number; y: number }): boolean {
  for (const target of ['self', 'child'] as const) {
    const a = hover[target];
    const b = nudged[target];
    if (!a || !b) continue;
    const ta = translationOf(a.transform, a.translate);
    const tb = translationOf(b.transform, b.translate);
    const dx = tb.x - ta.x;
    const dy = tb.y - ta.y;
    if (dx * Math.sign(nudge.x) > 0.8 || dy * Math.sign(nudge.y) > 0.8) return true;
  }
  return false;
}

const FOCUS_PROPS = /outline|box-shadow|border|background|color|text-decoration|transform|scale/;

export function focusIsVisible(changes: StyleChange[]): boolean {
  return changes.some((c) => FOCUS_PROPS.test(c.property) && !(c.property.startsWith('outline') && /none|0px/.test(c.to)));
}

/** A critical reading of a microinteraction, in the vocabulary of modules 03/11/18. */
export function judgeInteraction(item: Omit<InteractionItem, 'verdict'>): string[] {
  const verdict: string[] = [];
  if (!item.hover.changes.length) verdict.push('no hover feedback: the element does not confirm it is clickable');
  if (item.hover.changes.length && !item.hover.transition) verdict.push('hover without a transition: the change is abrupt (consider 150–300ms)');
  if (/\b0s\b/.test(item.hover.transition) && item.hover.changes.length) verdict.push('transition declared with 0s');
  if (!item.focus.visible) verdict.push('invisible keyboard focus (WCAG 2.4.7)');
  if (item.cursor !== 'pointer' && /^(a|button)$/.test(item.tag) && item.cursor !== 'none') verdict.push(`cursor "${item.cursor}" on a clickable element`);
  if (item.hover.magnetic) verdict.push('magnetic effect detected');
  if (item.press.changes.length) verdict.push('an :active state with tactile response');
  return verdict;
}

/** A short summary of the changes for reports ("background #fff→#000 · ::before transform"). */
export function summarizeChanges(changes: StyleChange[], max = 4): string {
  if (!changes.length) return '—';
  const parts = changes.slice(0, max).map((c) => {
    const where = c.target === 'self' ? '' : `${c.target} `;
    const short = (v: string) => (v.length > 28 ? `${v.slice(0, 26)}…` : v);
    return `${where}${c.property} ${short(c.from)}→${short(c.to)}`;
  });
  return parts.join(' · ') + (changes.length > max ? ` · +${changes.length - max}` : '');
}
