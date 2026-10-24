import { useEffect, useMemo, useRef } from 'react';
import { ease, journey, span, STAGE } from '@/lib/journey';
import { seeded, wordLayout } from '@/lib/word';

/** Almond outline, viewBox -60 -30 120 60. */
const ALMOND = 'M-56 0 Q0 -46 56 0 Q0 46 -56 0 Z';
/** Iris fibres: thin radial strokes. */
const FIBRES = Array.from({ length: 28 }, (_, i) => {
  const a = (i / 28) * Math.PI * 2;
  return `M${(Math.cos(a) * 9).toFixed(2)} ${(Math.sin(a) * 9).toFixed(2)}L${(Math.cos(a) * 20).toFixed(2)} ${(Math.sin(a) * 20).toFixed(2)}`;
}).join('');

type EyeState = { blinkAt: number; blink: number; hover: boolean; clicked: number };

/** Where the eyes settle: a loose constellation around the middle. */
function constellation(n: number, W: number, H: number) {
  const out: { x: number; y: number; size: number }[] = [];
  const base = Math.min(W, H);
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996 + 0.6;
    const rad = Math.sqrt((i + 0.6) / n);
    const size = base * (0.12 + seeded(i, 7) * 0.1) * (W < 600 ? 1.5 : 1);
    // inside the viewport, whole eye visible
    const x = Math.min(W - size / 2 - 12, Math.max(size / 2 + 12, W / 2 + Math.cos(a) * rad * W * 0.38));
    const y = Math.min(H - size * 0.25 - 90, Math.max(size * 0.25 + 80, H / 2 + Math.sin(a) * rad * H * 0.32));
    out.push({ x, y, size });
  }
  return out;
}

const tri = (t: number) => (t < 0.5 ? t * 2 : 2 - t * 2);

/**
 * Each letter of the broken word becomes an eye. They follow the cursor, blink on their own,
 * squint when you hover them and blink when you click. Then they stop following the cursor and
 * look straight at you — and blink. Everything goes white.
 */
export function Eyes() {
  const root = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const W = window.innerWidth;
  const H = window.innerHeight;
  const { letters, start, end } = useMemo(() => {
    const layout = wordLayout(W, H);
    const letters = layout.letters.filter((l) => l.ch !== ' ');
    return { letters, start: letters.map((l) => ({ x: l.cx, y: layout.cy })), end: constellation(letters.length, W, H) };
  }, [W, H]);

  useEffect(() => {
    const el = root.current!;
    const eyes = Array.from(el.querySelectorAll<SVGSVGElement>('[data-eye]'));
    const state: EyeState[] = eyes.map((_, i) => ({ blinkAt: performance.now() + 1500 + seeded(i, 9) * 5000, blink: 0, hover: false, clicked: 0 }));
    eyes.forEach((eye, i) => {
      eye.addEventListener('pointerenter', () => (state[i].hover = true));
      eye.addEventListener('pointerleave', () => (state[i].hover = false));
      eye.addEventListener('click', () => (state[i].clicked = performance.now()));
    });
    const mouse = { x: W / 2, y: H / 2 };
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    let p = journey.p;
    const off = journey.subscribe((v) => (p = v));
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const appear = span(p, STAGE.solidEnd + 0.004, STAGE.solidEnd + 0.045);
      el.style.opacity = String(Math.min(1, appear * 1.6));
      el.style.pointerEvents = appear > 0.9 && p < STAGE.blinkEnd ? 'auto' : 'none';
      if (!appear) return;
      const settle = ease(span(p, STAGE.solidEnd + 0.01, STAGE.solidEnd + 0.06));
      // look at the cursor → look at you
      const atYou = ease(span(p, STAGE.eyesTrackEnd, STAGE.eyesTrackEnd + 0.03));
      const blinkStage = tri(span(p, STAGE.eyesTrackEnd + 0.035, STAGE.eyesTrackEnd + 0.045));
      const finalClose = ease(span(p, STAGE.blinkEnd - 0.016, STAGE.blinkEnd - 0.004));

      eyes.forEach((eye, i) => {
        const s = state[i];
        const x = start[i].x + (end[i].x - start[i].x) * settle;
        const y = start[i].y + (end[i].y - start[i].y) * settle;
        const size = end[i].size * (0.25 + 0.75 * ease(appear));
        eye.style.transform = `translate(${x - size / 2}px, ${y - size * 0.25}px)`;
        eye.style.width = `${size}px`;

        // spontaneous blinks while tracking
        if (now > s.blinkAt) {
          s.blink = now;
          s.blinkAt = now + 2600 + seeded(i, now % 97) * 5200;
        }
        const own = Math.max(tri(Math.min(1, (now - s.blink) / 220)) * (now - s.blink < 220 ? 1 : 0), tri(Math.min(1, (now - s.clicked) / 260)) * (now - s.clicked < 260 ? 1 : 0));
        const squint = s.hover && atYou < 0.5 ? 0.42 : 0;
        const close = Math.max(own * (1 - atYou), squint, blinkStage, finalClose);
        eye.querySelector<SVGGElement>('[data-lid]')!.setAttribute('transform', `scale(1 ${Math.max(0.04, 1 - close).toFixed(3)})`);

        const dx = mouse.x - x;
        const dy = mouse.y - y;
        const d = Math.hypot(dx, dy) || 1;
        const reach = Math.min(1, d / 260) * 15 * (1 - atYou);
        const ix = (dx / d) * reach;
        const iy = (dy / d) * reach * 0.7;
        eye.querySelector<SVGGElement>('[data-iris]')!.setAttribute('transform', `translate(${ix.toFixed(2)} ${iy.toFixed(2)})`);
        eye.querySelector<SVGCircleElement>('[data-pupil]')!.setAttribute('r', (8 + atYou * 4 + squint * 2).toFixed(2));
      });
      if (flash.current) flash.current.style.opacity = String(span(p, STAGE.blinkEnd - 0.004, STAGE.install - 0.004));
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      off();
      window.removeEventListener('pointermove', onMove);
    };
  }, [W, H, start, end]);

  return (
    <>
      <div ref={root} className="fixed inset-0 z-20 opacity-0" aria-hidden="true">
        {letters.map((_, i) => (
          <svg key={i} data-eye viewBox="-60 -30 120 60" className="absolute left-0 top-0 cursor-pointer overflow-visible will-change-transform">
            <defs>
              <clipPath id={`eye-${i}`}>
                <path d={ALMOND} />
              </clipPath>
            </defs>
            <g data-lid>
              <g clipPath={`url(#eye-${i})`}>
                <rect x={-60} y={-30} width={120} height={60} fill="#fff" />
                <g data-iris>
                  <circle r={21} fill="#141414" />
                  <path d={FIBRES} stroke="#5c5c5c" strokeWidth={0.8} />
                  <circle r={21} fill="none" stroke="#000" strokeWidth={2.4} />
                  <circle data-pupil r={8} fill="#000" />
                  <circle cx={-6} cy={-7} r={3.2} fill="#fff" />
                  <circle cx={5} cy={5} r={1.3} fill="#fff" opacity={0.7} />
                </g>
              </g>
              <path d={ALMOND} fill="none" stroke="#fff" strokeWidth={1.4} />
            </g>
          </svg>
        ))}
      </div>
      <div ref={flash} className="pointer-events-none fixed inset-0 z-30 bg-paper opacity-0" aria-hidden="true" />
    </>
  );
}
