/**
 * Instantâneo de estilo computado de um elemento, seus pseudo-elementos e primeiro filho.
 * Usado para descobrir o que muda no hover/foco/clique (microinterações). Autocontido.
 */
export function snapshotStyles(selector: string) {
  const el = document.querySelector(selector);
  if (!el) return null;
  const PROPS = [
    'color', 'background-color', 'background-image', 'background-size', 'background-position',
    'border-top-color', 'border-top-width', 'border-radius', 'box-shadow',
    'outline-style', 'outline-width', 'outline-color', 'outline-offset',
    'transform', 'translate', 'scale', 'rotate', 'opacity', 'filter', 'backdrop-filter', 'clip-path',
    'letter-spacing', 'font-weight', 'text-decoration-line', 'text-underline-offset', 'text-decoration-thickness',
    'width', 'height', 'padding-left', 'gap', 'z-index',
  ];
  const pick = (cs: CSSStyleDeclaration) => {
    const out: Record<string, string> = {};
    for (const p of PROPS) out[p] = cs.getPropertyValue(p);
    return out;
  };
  const pseudo = (which: '::before' | '::after') => {
    const cs = getComputedStyle(el, which);
    return cs.content && cs.content !== 'none' && cs.content !== 'normal' ? pick(cs) : null;
  };
  const child = el.firstElementChild;
  const cs = getComputedStyle(el);
  return {
    snapshot: {
      self: pick(cs),
      '::before': pseudo('::before'),
      '::after': pseudo('::after'),
      child: child ? pick(getComputedStyle(child)) : null,
    },
    cursor: cs.cursor,
    transition: cs.transitionDuration
      .split(',')
      .map((d, i) => `${cs.transitionProperty.split(',')[i] ?? 'all'} ${d.trim()} ${cs.transitionTimingFunction.split(/,(?![^(]*\))/)[i] ?? ''}`.trim())
      .filter((t) => !/\s0s\b/.test(` ${t}`))
      .join(', '),
  };
}
