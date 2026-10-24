import { useEffect, useRef, useState } from 'react';

const TEXT = 'Parede da IA';
const FONT = '"Inter Tight Variable", sans-serif';
const LETTER_MS = 230;
const DRAW_MS = 1100;
const HOLD_MS = 700;
const FADE_MS = 900;

type Glyph = { ch: string; x: number };

/**
 * Loading: "Parede da IA" written letter by letter with one thread — a single hairline that
 * runs along the baseline and pulls the pen from one letter into the next. Then it fades.
 */
export function Writing({ onDone }: { onDone: () => void }) {
  const [layout, setLayout] = useState<{ glyphs: Glyph[]; size: number; x0: number; y: number; w: number; h: number } | null>(null);
  const [fading, setFading] = useState(false);
  const thread = useRef<SVGLineElement>(null);
  const pen = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let cancelled = false;
    const measure = async () => {
      await document.fonts?.load(`300 100px ${FONT}`).catch(() => undefined);
      if (cancelled) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const size = Math.min(w * 0.13, h * 0.22, 168);
      const ctx = document.createElement('canvas').getContext('2d')!;
      ctx.font = `300 ${size}px ${FONT}`;
      const total = ctx.measureText(TEXT).width;
      const x0 = (w - total) / 2;
      const glyphs: Glyph[] = [];
      let x = x0;
      for (const ch of TEXT) {
        glyphs.push({ ch, x });
        x += ctx.measureText(ch).width;
      }
      setLayout({ glyphs, size, x0, y: h / 2 + size * 0.34, w, h });
    };
    void measure();
    return () => {
      cancelled = true;
    };
  }, []);

  // The thread and the pen follow the letter being drawn.
  useEffect(() => {
    if (!layout) return;
    const letters = layout.glyphs.filter((g) => g.ch !== ' ');
    const start = performance.now();
    const writeMs = letters.length * LETTER_MS + DRAW_MS;
    let raf = 0;
    const tick = (now: number) => {
      const t = now - start;
      // the first frame can be timestamped slightly before the start: never index -1
      const i = Math.max(0, Math.min(letters.length - 1, Math.floor(t / LETTER_MS)));
      const local = Math.max(0, Math.min(1, (t - i * LETTER_MS) / LETTER_MS));
      const next = letters[i + 1]?.x ?? letters[i].x + layout.size * 0.55;
      const x = letters[i].x + (next - letters[i].x) * local;
      thread.current?.setAttribute('x2', String(x));
      pen.current?.setAttribute('cx', String(x));
      if (t < writeMs) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const fade = window.setTimeout(() => setFading(true), writeMs + HOLD_MS);
    const done = window.setTimeout(onDone, writeMs + HOLD_MS + FADE_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, [layout, onDone]);

  let drawn = 0;
  return (
    <div className="fixed inset-0 z-40 bg-ink transition-opacity ease-out" style={{ opacity: fading ? 0 : 1, transitionDuration: `${FADE_MS}ms` }} role="img" aria-label="Parede da IA">
      {layout && (
        <svg width={layout.w} height={layout.h} className="absolute inset-0" aria-hidden="true">
          <line ref={thread} x1={0} y1={layout.y + 1} x2={layout.x0} y2={layout.y + 1} stroke="white" strokeOpacity={0.55} strokeWidth={1} />
          <circle ref={pen} cx={layout.x0} cy={layout.y + 1} r={2.2} fill="white" />
          {layout.glyphs.map((g, i) => {
            if (g.ch === ' ') return null;
            const delay = drawn++ * LETTER_MS;
            return (
              <text
                key={i}
                x={g.x}
                y={layout.y}
                fill="none"
                stroke="white"
                strokeWidth={1}
                strokeDasharray={1600}
                strokeDashoffset={1600}
                style={{ font: `300 ${layout.size}px ${FONT}`, letterSpacing: 0, animation: `draw-stroke ${DRAW_MS}ms cubic-bezier(0.65,0,0.35,1) ${delay}ms forwards` }}
              >
                {g.ch}
              </text>
            );
          })}
        </svg>
      )}
    </div>
  );
}
