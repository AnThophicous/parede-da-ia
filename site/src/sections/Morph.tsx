import { useEffect, useRef, useState } from 'react';
import { PILLARS } from '@/content';
import { ScrollTrigger, useReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

type MorphApi = { setProgress: (t: number) => void; destroy: () => void };

/** Preloader (~1,6s) + entrada do hero (~1,5s) com folga. */
const AFTER_INTRO_MS = 4000;

/**
 * Converte o progresso do scroll (0–1) em forma do morph (0 = nuvem … 3 = última palavra),
 * com platôs para cada palavra ficar legível antes da próxima transição.
 */
function progressToShape(p: number): number {
  const stages = PILLARS.length - 1; // 3 transições
  const span = 1 / stages;
  const k = Math.min(stages - 1, Math.floor(p / span));
  const local = (p - k * span) / span; // 0–1 dentro do estágio
  const MORPH = 0.55; // 55% do estágio transformando, 45% parado na palavra
  return k + Math.min(1, local / MORPH);
}

/**
 * Ápice da página: partículas (Three.js, library/particles/text-morph.js) viram
 * "olhos" → "mãos" → "repertório" enquanto a seção fica fixa durante o scroll.
 */
export function Morph() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const morph = useRef<MorphApi | null>(null);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  // Cria a cena no ocioso depois da abertura (preloader + entrada do hero, ~4s): importar o three,
  // amostrar as palavras e compilar o shader fica longe da carga e da rolagem.
  // Se a pessoa rolar antes disso, o observer antecipa.
  useEffect(() => {
    const host = stage.current;
    if (!host || reduced) return;
    let cancelled = false;
    let started = false;
    const start = async () => {
      if (started) return;
      started = true;
      io.disconnect();
      cancelIdle();
      const [THREE, { createTextMorph }] = await Promise.all([import('three'), import('@library/particles/text-morph.js')]);
      if (cancelled) return;
      const mobile = window.innerWidth < 768;
      const created = await createTextMorph(THREE, host, {
        words: PILLARS.slice(1).map((p) => p.word),
        count: mobile ? 5200 : 14000,
        font: { family: '"Inter Tight Variable", sans-serif', weight: 800 },
        colors: ['#3a5bff', '#ff6a1a', '#ffb36b'],
        pointSize: mobile ? 2.2 : 2.6,
      });
      if (cancelled) {
        created.destroy();
        return;
      }
      morph.current = created;
      created.setProgress(progressToShape(ScrollTrigger.getAll().find((t) => t.trigger === section.current)?.progress ?? 0));
    };
    const io = new IntersectionObserver(([entry]) => void (entry.isIntersecting && start()), { rootMargin: '50% 0px' });
    io.observe(host);
    let idle = 0;
    const later = window.setTimeout(() => {
      idle = window.requestIdleCallback ? window.requestIdleCallback(() => void start(), { timeout: 3000 }) : window.setTimeout(() => void start(), 0);
    }, AFTER_INTRO_MS);
    function cancelIdle() {
      window.clearTimeout(later);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    }
    return () => {
      cancelled = true;
      io.disconnect();
      cancelIdle();
      morph.current?.destroy();
      morph.current = null;
    };
  }, [reduced]);

  useEffect(() => {
    const el = section.current;
    if (!el || reduced) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const shape = progressToShape(self.progress);
        morph.current?.setProgress(shape);
        setActive(Math.round(shape));
        setProgress(self.progress);
      },
    });
    return () => st.kill();
  }, [reduced]);

  if (reduced) {
    return (
      <section id="como-funciona" aria-labelledby="como-funciona-title" className="bg-night-900 px-gutter py-[18vh]">
        <p className="eyebrow">(02) Como funciona</p>
        <h2 id="como-funciona-title" className="sr-only">Como funciona</h2>
        <ol className="mt-12 grid gap-16">
          {PILLARS.slice(1).map((p) => (
            <li key={p.word}>
              <p className="display text-[clamp(64px,12vw,180px)] text-cream">{p.word}</p>
              <p className="mt-4 max-w-[46ch] text-[18px] text-cream/80">{p.text}</p>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section id="como-funciona" ref={section} aria-labelledby="como-funciona-title" className="relative h-[420vh] bg-night-950">
      <div className="sticky top-0 h-svh overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_15%_85%,rgb(255_106_26/0.16),transparent_70%),radial-gradient(50%_45%_at_85%_10%,rgb(58_91_255/0.14),transparent_70%)]" />
        {/* bordas de cima e de baixo voltam ao fundo das seções vizinhas: sem emenda quando o palco entra e sai */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,#03050c,transparent_22%,transparent_72%,#03050c)]" />
        <div ref={stage} className="absolute inset-0" />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between px-gutter pt-28">
          <div>
            <p className="eyebrow">(02) Como funciona</p>
            <h2 id="como-funciona-title" className="mt-3 max-w-[16ch] text-[clamp(22px,2.2vw,32px)] font-light leading-tight tracking-[-0.02em] text-cream/90">
              Uma skill que transforma ruído em <em>critério</em>.
            </h2>
          </div>
          <p className="eyebrow tabular-nums text-cream/70" aria-hidden="true">
            {String(active).padStart(2, '0')} <span className="text-cream/50">/ 0{PILLARS.length - 1}</span>
          </p>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 grid gap-8 px-gutter pb-12 md:grid-cols-12 md:pb-16">
          {/* Legendas empilhadas na mesma célula do grid: a altura é a da maior, nada vaza para a barra.
              Todas ficam na árvore de acessibilidade, em ordem; só a visível muda com o scroll. */}
          <div className="grid md:col-span-5">
            {PILLARS.map((p, i) => (
              <div key={p.word} className={cn('[grid-area:1/1] transition-[opacity,transform] duration-700 ease-expo', i === active ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0')}>
                <p className="eyebrow text-ember-300">{p.title}</p>
                <p className="mt-3 max-w-[44ch] text-[17px] leading-relaxed text-cream/85 md:text-[19px]">{p.text}</p>
                {p.tools.length > 0 && (
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {p.tools.map((t) => (
                      <li key={t} className="rounded-full border border-cream/15 bg-cream/[0.04] px-3 py-1 font-mono text-[12px] text-cream/75 md:text-[11.5px]">
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          <div className="self-end md:col-span-4 md:col-start-9">
            <div className="h-px w-full bg-cream/15">
              <div className="h-px origin-left bg-ember-400" style={{ transform: `scaleX(${progress})` }} />
            </div>
            <ol className="mt-3 flex justify-between font-mono text-[12px] uppercase tracking-[0.14em] text-cream/55 md:text-[11px]" aria-hidden="true">
              {PILLARS.slice(1).map((p, i) => (
                <li key={p.word} className={cn('transition-colors duration-500', active === i + 1 && 'text-cream')}>
                  {p.word}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
