import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Field } from '@/components/Field';
import { HoverFont } from '@/components/HoverFont';
import { Lens } from '@/components/Lens';
import { Magnetic } from '@/components/Magnetic';
import { Button } from '@/components/ui/button';
import { HERO, REPO_URL, VERSION } from '@/content';
import { gsap, useReducedMotion } from '@/lib/motion';

// Linhas em máscara para o reveal; letras em itálico pontuais (assinatura tipográfica).
const TITLE_HTML =
  '<span class="block overflow-hidden pb-[0.06em] -mb-[0.06em]"><span class="hero-line inline-block">Par<em>e</em>de</span></span>' +
  '<span class="block overflow-hidden pb-[0.06em] -mb-[0.06em] pl-[0.9em] md:pl-[1.6em]"><span class="hero-line inline-block">d<em>a</em> IA</span></span>';

export function Hero({ ready, onInstall }: { ready: boolean; onInstall: () => void }) {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    gsap.set(el.querySelectorAll('.hero-line'), { yPercent: 108 });
    gsap.set(el.querySelectorAll('[data-hero-fade]'), { opacity: 0, y: 18 });
  }, [reduced]);

  useEffect(() => {
    const el = root.current;
    if (!el || !ready || reduced) return;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to(el.querySelectorAll('.hero-line'), { yPercent: 0, duration: 1.5, stagger: 0.1 })
      .to(el.querySelectorAll('[data-hero-fade]'), { opacity: 1, y: 0, duration: 1.1, stagger: 0.07, clearProps: 'transform' }, '-=1.05');
    return () => {
      tl.kill();
    };
  }, [ready, reduced]);

  return (
    <section id="topo" ref={root} aria-labelledby="hero-title" className="relative isolate min-h-svh overflow-hidden bg-night-900">
      <Field variant="hero" eager className="absolute inset-0 -z-10" />
      {/* vinheta: mantém bordas e base escuras para o texto */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_60%_35%,transparent_35%,rgb(3_5_12/0.55)_75%),linear-gradient(to_top,rgb(3_5_12/0.92),transparent_45%)]" />
      <div className="relative z-10 grid min-h-svh grid-rows-[auto_1fr_auto] px-gutter pb-10 pt-28 md:pb-14">
        <div className="flex items-start justify-between gap-6" data-hero-fade>
          <p className="eyebrow text-cream/70">{HERO.eyebrow}</p>
          <p className="eyebrow hidden text-cream/60 sm:block">v{VERSION} · MIT</p>
        </div>

        {/* A lente divide a célula do título e é medida pela altura livre dela (anel incluído):
            nunca alcança o texto de baixo. Em retrato ela sobe e encolhe para ficar acima do título;
            em paisagem fica ao lado dele, centrada. */}
        <div aria-hidden="true" className="pointer-events-none relative col-start-1 row-start-2 my-6">
          <Lens className="right-[-6vw] top-0 h-[46%] landscape:right-[3vw] landscape:top-1/2 landscape:h-[min(80%,600px)] landscape:-translate-y-1/2" />
        </div>

        {/* Título fluido na largura e na altura: o hero inteiro (título, lede, CTA) cabe em uma tela. */}
        <HoverFont
          as="h1"
          id="hero-title"
          html={TITLE_HTML}
          from={260}
          to={860}
          radius={230}
          className="display relative col-start-1 row-start-2 self-end pb-8 text-[length:clamp(88px,min(18vw,calc((100svh_-_470px)/1.8)),300px)] text-cream md:pb-12"
        />

        <div className="grid items-end gap-8 md:grid-cols-12">
          <a
            href="#problema"
            data-hero-fade
            className="eyebrow hidden items-center gap-3 text-cream/60 transition-colors hover:text-cream md:col-span-3 md:flex"
          >
            <span className="relative h-10 w-px overflow-hidden bg-cream/20">
              <span className="absolute inset-x-0 top-0 h-1/2 animate-[scroll-cue_2.2s_cubic-bezier(0.76,0,0.24,1)_infinite] bg-cream motion-reduce:animate-none" />
            </span>
            role para ver
          </a>
          <div className="md:col-span-7 md:col-start-6 lg:col-span-5 lg:col-start-8" data-hero-fade>
            <p className="max-w-[38ch] text-[17px] leading-[1.55] text-cream/80 md:text-[19px]">{HERO.lede}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Magnetic>
                <Button variant="ember" size="xl" onClick={onInstall}>
                  <span data-magnetic-inner className="inline-flex items-center gap-3">
                    {HERO.cta}
                    <ArrowDownRight aria-hidden="true" />
                  </span>
                </Button>
              </Magnetic>
              {/* área de toque de 44px; o sublinhado fica no span e não se move */}
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="group -my-2.5 inline-flex py-2.5 text-[15px] text-cream/85 transition-colors hover:text-cream">
                <span className="inline-flex items-center gap-1.5 border-b border-cream/30 pb-0.5 transition-colors group-hover:border-cream">
                  Ver no GitHub
                  <ArrowUpRight className="size-4 transition-transform duration-300 ease-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </a>
            </div>
            <p className="eyebrow mt-6 text-cream/50">{HERO.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
