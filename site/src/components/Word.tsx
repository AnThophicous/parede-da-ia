import { useEffect, useRef, useState } from 'react';
import { ease, journey, span, STAGE } from '@/lib/journey';
import { seeded, WORD_FONT, wordLayout } from '@/lib/word';

type MorphApi = { canvas: HTMLCanvasElement; setProgress: (t: number) => void; destroy: () => void };

/**
 * In the dark, loose particles drift, read "Parade da IA" for a moment, correct themselves into
 * "Parede da IA" and solidify into real text. Hovering grows only the letter under the cursor.
 * Then the word breaks apart — each letter will become an eye.
 */
export function Word() {
  const stage = useRef<HTMLDivElement>(null);
  const solid = useRef<HTMLDivElement>(null);
  const morph = useRef<MorphApi | null>(null);
  const [layout, setLayout] = useState(() => wordLayout(window.innerWidth, window.innerHeight));

  useEffect(() => {
    const onResize = () => setLayout(wordLayout(window.innerWidth, window.innerHeight));
    window.addEventListener('resize', onResize);
    document.fonts?.ready.then(onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // particles (library/particles/text-morph.js)
  useEffect(() => {
    const host = stage.current!;
    let cancelled = false;
    void (async () => {
      const [THREE, { createTextMorph }] = await Promise.all([import('three'), import('@library/particles/text-morph.js')]);
      if (cancelled) return;
      const mobile = window.innerWidth < 768;
      const created = (await createTextMorph(THREE, host, {
        words: ['Parade da IA', 'Parede da IA'],
        count: mobile ? 4200 : 9000,
        font: WORD_FONT,
        colors: ['#ffffff', '#d6d6d6', '#a8a8a8'],
        pointSize: mobile ? 1.9 : 2.1,
        cloud: 'scatter',
      })) as MorphApi;
      if (cancelled) return created.destroy();
      morph.current = created;
    })();
    return () => {
      cancelled = true;
      morph.current?.destroy();
      morph.current = null;
    };
  }, []);

  useEffect(
    () =>
      journey.subscribe((p) => {
        // 0 = loose · 1 = "Parade" · 2 = "Parede"
        const shape = p < STAGE.darkEnd ? 0 : p < STAGE.parade ? ease(span(p, STAGE.darkEnd, STAGE.parade)) : 1 + span(p, STAGE.parade + 0.01, STAGE.parede);
        morph.current?.setProgress(shape);
        const particles = span(p, STAGE.horizonEnd, STAGE.horizonEnd + 0.03) * (1 - span(p, STAGE.parede + 0.015, STAGE.parede + 0.04));
        if (stage.current) stage.current.style.opacity = String(particles);
        const el = solid.current;
        if (!el) return;
        el.style.opacity = String(span(p, STAGE.parede + 0.005, STAGE.parede + 0.03));
        el.style.pointerEvents = p > STAGE.parede && p < STAGE.solidEnd ? 'auto' : 'none';
        // break apart: each letter flies off in its own direction
        const letters = el.children;
        for (let i = 0; i < letters.length; i++) {
          const t = ease(span(p, STAGE.solidEnd + i * 0.0025, STAGE.solidEnd + 0.04));
          const node = letters[i] as HTMLElement;
          const dx = (seeded(i, 1) - 0.5) * 520;
          const dy = (seeded(i, 2) - 0.5) * 360;
          const rot = (seeded(i, 3) - 0.5) * 140;
          node.style.transform = t ? `translate(${dx * t}px, ${dy * t}px) rotate(${rot * t}deg) scale(${1 - 0.75 * t})` : '';
          node.style.opacity = String(1 - t);
          node.style.filter = t ? `blur(${t * 6}px)` : '';
        }
      }),
    [],
  );

  return (
    <>
      <div ref={stage} className="fixed inset-0 z-10 opacity-0" aria-hidden="true" />
      <div ref={solid} className="fixed inset-0 z-10 opacity-0" aria-hidden="true">
        {layout.letters.map((l, i) =>
          l.ch === ' ' ? null : (
            <span key={i} className="absolute will-change-transform" style={{ left: l.x, top: layout.cy, width: l.w, height: layout.size, marginTop: -layout.size / 2 }}>
              <span
                className="block origin-[50%_72%] text-center text-white transition-transform duration-500 ease-spring hover:scale-[1.32]"
                style={{ font: `${WORD_FONT.weight} ${layout.size}px/${layout.size}px ${WORD_FONT.family}` }}
              >
                {l.ch}
              </span>
            </span>
          ),
        )}
      </div>
    </>
  );
}
