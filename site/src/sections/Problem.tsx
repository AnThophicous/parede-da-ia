import { useEffect, useRef } from 'react';
import { PROBLEM } from '@/content';
import { ScrollTrigger, useReducedMotion } from '@/lib/motion';

const EMPHASIS = new Set(['sem', 'nunca', 'ver']);

/** O problema em uma frase: as palavras acendem conforme o scroll (leitura no ritmo de quem rola). */
export function Problem() {
  const statement = useRef<HTMLHeadingElement>(null);
  const reduced = useReducedMotion();
  const words = PROBLEM.statement.split(' ');

  useEffect(() => {
    const el = statement.current;
    if (!el) return;
    const spans = Array.from(el.querySelectorAll<HTMLSpanElement>('[data-word]'));
    if (reduced) {
      spans.forEach((s) => s.classList.add('is-lit'));
      return;
    }
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 78%',
      end: 'bottom 42%',
      scrub: true,
      onUpdate: (self) => {
        const lit = Math.round(self.progress * spans.length);
        spans.forEach((s, i) => s.classList.toggle('is-lit', i < lit));
      },
    });
    return () => st.kill();
  }, [reduced]);

  return (
    <section id="problema" aria-labelledby="problema-title" className="relative bg-night-950 px-gutter py-[22vh]">
      <div className="mx-auto grid max-w-[1600px] gap-16 md:grid-cols-12">
        <p className="eyebrow md:col-span-3">{PROBLEM.eyebrow}</p>
        <h2 id="problema-title" ref={statement} aria-label={PROBLEM.statement} className="display text-[clamp(44px,7.4vw,128px)] md:col-span-9">
          {words.map((word, i) => (
            <span key={i} aria-hidden="true">
              <span data-word className={`problem-word ${EMPHASIS.has(word.replace(/\W/g, '')) ? 'italic' : ''}`}>
                {word}
              </span>{' '}
            </span>
          ))}
        </h2>
        <ul className="grid gap-px overflow-hidden rounded-2xl border border-cream/10 bg-cream/10 md:col-span-9 md:col-start-4 md:grid-cols-3">
          {PROBLEM.symptoms.map((s, i) => (
            <li key={s} className="flex flex-col gap-10 bg-night-950 p-6 md:p-8">
              <span className="eyebrow text-ember-300">—0{i + 1}</span>
              <span className="text-[19px] leading-snug text-cream/85 md:text-[21px]">{s}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
