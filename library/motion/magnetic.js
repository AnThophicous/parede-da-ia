/**
 * parede-da-ia · botão magnético
 * O alvo se desloca em direção ao cursor; o conteúdo interno se desloca mais (paralaxe).
 *
 *   import { magnetic } from './magnetic.js';
 *   const stop = magnetic(button, { strength: 0.35, inner: button.querySelector('span') });
 *
 * Use só em alvos grandes e isolados (CTAs circulares, ícones de navegação).
 * Desligado em toque e em prefers-reduced-motion.
 */

/**
 * @param {HTMLElement} el
 * @param {{ strength?: number, innerStrength?: number, inner?: HTMLElement | null, lerp?: number }} [options]
 * @returns {() => void}
 */
export function magnetic(el, options = {}) {
  const { strength = 0.35, innerStrength = 0.5, inner = null, lerp = 0.16 } = options;
  if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(pointer: coarse)').matches) return () => {};

  const pos = { x: 0, y: 0, tx: 0, ty: 0 };
  let raf = 0;
  let running = false;

  const loop = () => {
    pos.x += (pos.tx - pos.x) * lerp;
    pos.y += (pos.ty - pos.y) * lerp;
    el.style.transform = `translate3d(${pos.x.toFixed(2)}px, ${pos.y.toFixed(2)}px, 0)`;
    if (inner) inner.style.transform = `translate3d(${(pos.x * innerStrength).toFixed(2)}px, ${(pos.y * innerStrength).toFixed(2)}px, 0)`;
    if (Math.abs(pos.tx - pos.x) + Math.abs(pos.ty - pos.y) > 0.05) raf = requestAnimationFrame(loop);
    else running = false;
  };
  const kick = () => {
    if (!running) {
      running = true;
      raf = requestAnimationFrame(loop);
    }
  };
  const onMove = (e) => {
    const r = el.getBoundingClientRect();
    pos.tx = (e.clientX - (r.left + r.width / 2)) * strength;
    pos.ty = (e.clientY - (r.top + r.height / 2)) * strength;
    kick();
  };
  const onLeave = () => {
    pos.tx = 0;
    pos.ty = 0;
    kick();
  };
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerleave', onLeave);
  return () => {
    cancelAnimationFrame(raf);
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerleave', onLeave);
    el.style.transform = '';
    if (inner) inner.style.transform = '';
  };
}
