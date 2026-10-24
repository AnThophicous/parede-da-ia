/**
 * parede-da-ia · rastro de pixels no grid (estética canvas-ludico)
 * Células do grid de fundo acendem sob o cursor e esmaecem — como uma prancheta viva.
 *
 *   import { pixelTrail } from './pixel-trail.js';
 *   const stop = pixelTrail(document.querySelector('.canvas'), { cell: 56, color: 'rgba(30,20,10,.08)', fadeMs: 600 });
 *
 * Decorativo: canvas aria-hidden, pointer-events none. Desligado em toque e reduced-motion.
 */
export function pixelTrail(host, options = {}) {
  const { cell = 56, color = 'rgba(0,0,0,.07)', fadeMs = 600, radius = 0 } = options;
  if (!host || matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(pointer: coarse)').matches) return () => {};

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0';
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  host.prepend(canvas);
  const ctx = canvas.getContext('2d');
  const lit = new Map(); // "col,row" → instante em que acendeu
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  const resize = () => {
    canvas.width = host.clientWidth * dpr;
    canvas.height = host.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  const onMove = (e) => {
    const r = host.getBoundingClientRect();
    const col = Math.floor((e.clientX - r.left) / cell);
    const row = Math.floor((e.clientY - r.top) / cell);
    for (let dx = -radius; dx <= radius; dx++) for (let dy = -radius; dy <= radius; dy++) lit.set(`${col + dx},${row + dy}`, performance.now());
  };
  host.addEventListener('pointermove', onMove, { passive: true });

  let raf = 0;
  const draw = (now) => {
    raf = requestAnimationFrame(draw);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const [key, t] of lit) {
      const age = (now - t) / fadeMs;
      if (age >= 1) {
        lit.delete(key);
        continue;
      }
      const [c, r] = key.split(',').map(Number);
      ctx.globalAlpha = 1 - age * age;
      ctx.fillStyle = color;
      ctx.fillRect(c * cell + 1, r * cell + 1, cell - 1, cell - 1);
    }
    ctx.globalAlpha = 1;
  };
  raf = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    host.removeEventListener('pointermove', onMove);
    canvas.remove();
  };
}
