/**
 * parede-da-ia · canvas arrastável (estética canvas-ludico)
 * Elementos com [data-drag] podem ser arrastados com mouse, toque ou teclado (setas),
 * com inércia curta, leve rotação na direção do movimento e posição salva.
 *
 *   import { draggableCanvas } from './draggable-canvas.js';
 *   const stop = draggableCanvas(document.querySelector('.board'), { storageKey: 'board-v1' });
 *
 * Acessibilidade: itens focáveis (tabindex=0), setas movem 16px (Shift = 64px),
 * Esc devolve à posição original; o conteúdo continua acessível na ordem do DOM.
 */
export function draggableCanvas(board, options = {}) {
  const { selector = '[data-drag]', storageKey = null, friction = 0.9, tilt = 0.06 } = options;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saved = storageKey ? JSON.parse(localStorage.getItem(storageKey) ?? '{}') : {};
  const items = Array.from(board.querySelectorAll(selector));
  const state = new Map();

  const apply = (el, s) => {
    el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) rotate(${s.base + s.rot}deg)`;
  };
  const persist = () => {
    if (!storageKey) return;
    const out = {};
    items.forEach((el, i) => {
      const s = state.get(el);
      out[el.dataset.drag || i] = { x: Math.round(s.x), y: Math.round(s.y) };
    });
    try {
      localStorage.setItem(storageKey, JSON.stringify(out));
    } catch {
      /* armazenamento indisponível */
    }
  };

  const cleanups = [];
  items.forEach((el, i) => {
    const key = el.dataset.drag || i;
    const base = parseFloat(el.dataset.rotate ?? '0');
    const s = { x: saved[key]?.x ?? 0, y: saved[key]?.y ?? 0, vx: 0, vy: 0, rot: 0, base, dragging: false, px: 0, py: 0 };
    state.set(el, s);
    el.tabIndex = el.tabIndex >= 0 ? el.tabIndex : 0;
    el.style.touchAction = 'none';
    el.style.cursor = 'grab';
    apply(el, s);

    const down = (e) => {
      s.dragging = true;
      s.px = e.clientX;
      s.py = e.clientY;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = 'grabbing';
      el.style.zIndex = String(10 + items.length);
      el.dataset.dragging = 'true';
    };
    const move = (e) => {
      if (!s.dragging) return;
      s.vx = e.clientX - s.px;
      s.vy = e.clientY - s.py;
      s.x += s.vx;
      s.y += s.vy;
      s.px = e.clientX;
      s.py = e.clientY;
      s.rot = reduced ? 0 : Math.max(-8, Math.min(8, s.vx * tilt * 10));
      apply(el, s);
    };
    const up = () => {
      if (!s.dragging) return;
      s.dragging = false;
      el.style.cursor = 'grab';
      delete el.dataset.dragging;
      if (reduced) {
        s.rot = 0;
        apply(el, s);
        persist();
        return;
      }
      const glide = () => {
        s.vx *= friction;
        s.vy *= friction;
        s.rot *= 0.85;
        s.x += s.vx;
        s.y += s.vy;
        apply(el, s);
        if (Math.abs(s.vx) + Math.abs(s.vy) + Math.abs(s.rot) > 0.2) requestAnimationFrame(glide);
        else persist();
      };
      requestAnimationFrame(glide);
    };
    const key_ = (e) => {
      const step = e.shiftKey ? 64 : 16;
      const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (e.key === 'Escape') {
        s.x = 0;
        s.y = 0;
      } else if (moves[e.key]) {
        s.x += moves[e.key][0];
        s.y += moves[e.key][1];
      } else return;
      e.preventDefault();
      apply(el, s);
      persist();
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('keydown', key_);
    cleanups.push(() => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('keydown', key_);
    });
  });

  return {
    reset() {
      items.forEach((el) => {
        const s = state.get(el);
        Object.assign(s, { x: 0, y: 0, rot: 0 });
        apply(el, s);
      });
      persist();
    },
    destroy() {
      cleanups.forEach((fn) => fn());
    },
  };
}
