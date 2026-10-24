/**
 * parede-da-ia · Hover Font
 * O peso da fonte variável cresce nas letras próximas ao cursor (efeito de proximidade).
 *
 *   import { hoverFont } from './hover-font.js';
 *   const stop = hoverFont(document.querySelector('h1'), { from: 300, to: 850, radius: 180 });
 *
 * Sem layout shift: cada letra ganha uma caixa de largura fixa (medida no peso de repouso,
 * em `em`) e a diferença de largura do peso maior é compensada com scaleX. Nada se move.
 *
 * Requisitos: fonte variável com eixo wght (ex.: Inter Tight Variable, Geist, Roboto Flex).
 * Acessibilidade: o texto inteiro fica no aria-label do elemento; as letras são aria-hidden.
 * Desligado automaticamente em toque (pointer: coarse) e em prefers-reduced-motion.
 */

const FALLOFF = {
  linear: (d) => Math.max(0, 1 - d),
  gaussian: (d) => Math.exp(-(d * d) * 4.5),
  exponential: (d) => Math.max(0, 1 - d) ** 2,
};

/**
 * @param {HTMLElement} el
 * @param {{ from?: number, to?: number, radius?: number, falloff?: keyof typeof FALLOFF,
 *           lerp?: number, axis?: string, extraAxes?: string }} [options]
 * @returns {() => void} função que desfaz o efeito
 */
export function hoverFont(el, options = {}) {
  const { from = 300, to = 850, radius = 180, falloff = 'gaussian', lerp = 0.16, axis = 'wght', extraAxes = '' } = options;
  if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(pointer: coarse)').matches) return () => {};

  const settings = (w) => `'${axis}' ${Math.round(w)}${extraAxes ? `, ${extraAxes}` : ''}`;
  const original = el.innerHTML;
  el.setAttribute('aria-label', (el.textContent ?? '').replace(/\s+/g, ' ').trim());

  /** @type {{ span: HTMLSpanElement, cx: number, cy: number, current: number, rest: number, heavy: number }[]} */
  const letters = [];
  const split = (node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        split(child);
        continue;
      }
      if (child.nodeType !== Node.TEXT_NODE) continue;
      const frag = document.createDocumentFragment();
      // Palavras inteiras em nowrap: a quebra de linha nunca acontece no meio de uma palavra.
      for (const part of (child.textContent ?? '').split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) {
          frag.append(part);
          continue;
        }
        const word = document.createElement('span');
        word.setAttribute('aria-hidden', 'true');
        word.style.cssText = 'display:inline-block;white-space:nowrap';
        for (const ch of part) {
          const span = document.createElement('span');
          span.textContent = ch;
          span.style.cssText = `display:inline-block;text-align:center;transform-origin:50% 60%;font-variation-settings:${settings(from)}`;
          word.append(span);
          letters.push({ span, cx: 0, cy: 0, current: from, rest: 0, heavy: 0 });
        }
        frag.append(word);
      }
      child.replaceWith(frag);
    }
  };
  split(el);

  const measureCenters = () => {
    for (const l of letters) {
      const r = l.span.getBoundingClientRect();
      l.cx = r.left + r.width / 2 + window.scrollX;
      l.cy = r.top + r.height / 2 + window.scrollY;
    }
  };

  /** Mede larguras no peso de repouso e no máximo (em lote, sem layout thrashing). */
  const calibrate = () => {
    const fontSize = parseFloat(getComputedStyle(el).fontSize) || 16;
    for (const l of letters) {
      l.span.style.width = '';
      l.span.style.transform = '';
      l.span.style.fontVariationSettings = settings(from);
    }
    const rest = letters.map((l) => l.span.getBoundingClientRect().width);
    for (const l of letters) l.span.style.fontVariationSettings = settings(to);
    const heavy = letters.map((l) => l.span.getBoundingClientRect().width);
    letters.forEach((l, i) => {
      l.rest = rest[i];
      l.heavy = heavy[i];
      l.span.style.width = `${(rest[i] / fontSize).toFixed(4)}em`;
      l.span.style.fontVariationSettings = settings(l.current);
    });
    measureCenters();
  };
  calibrate();
  document.fonts?.ready.then(calibrate);

  const pointer = { x: -9999, y: -9999, active: false };
  const onMove = (e) => {
    pointer.x = e.clientX + window.scrollX;
    pointer.y = e.clientY + window.scrollY;
    pointer.active = true;
  };
  const onLeave = () => (pointer.active = false);
  let resizeTimer = 0;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(calibrate, 120);
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);
  window.addEventListener('resize', onResize);
  window.addEventListener('scroll', measureCenters, { passive: true });

  let visible = true;
  const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
  io.observe(el);

  const ease = FALLOFF[falloff] ?? FALLOFF.gaussian;
  let raf = 0;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!visible) return;
    for (const l of letters) {
      const d = pointer.active ? Math.hypot(pointer.x - l.cx, pointer.y - l.cy) / radius : 9;
      const goal = from + (to - from) * ease(Math.min(1, d));
      if (Math.abs(goal - l.current) < 0.4) continue;
      l.current += (goal - l.current) * lerp;
      const p = (l.current - from) / (to - from);
      const width = l.rest + (l.heavy - l.rest) * p;
      l.span.style.fontVariationSettings = settings(l.current);
      l.span.style.transform = width > 0 ? `scaleX(${(l.rest / width).toFixed(4)})` : '';
    }
  };
  tick();

  return () => {
    cancelAnimationFrame(raf);
    clearTimeout(resizeTimer);
    io.disconnect();
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('scroll', measureCenters);
    el.innerHTML = original;
    el.removeAttribute('aria-label');
  };
}
