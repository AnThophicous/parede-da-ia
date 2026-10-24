import { Check, ChevronDown, Copy } from 'lucide-react';
import { useState } from 'react';
import { Field } from '@/components/Field';
import { Magnetic } from '@/components/Magnetic';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AGENTS, BOOTSTRAP_PROMPT, MANUAL_INSTALL, STEPS } from '@/content';
import { cn } from '@/lib/utils';

/**
 * Conversão: o prompt é o objeto da seção e a ação primária fica colada nele.
 * Passos em lista editorial (fios, sem cartões); o campo de cor volta só como brilho atrás do prompt.
 */
export function Install({ copied, onCopy }: { copied: boolean; onCopy: () => Promise<boolean> }) {
  const [open, setOpen] = useState(false);

  return (
    <section id="instalar" aria-labelledby="instalar-title" className="relative isolate overflow-hidden bg-night-950 px-gutter pb-[12vh] pt-[16vh]">
      <Field variant="finale" className="absolute inset-0 -z-10 [mask-image:radial-gradient(52%_58%_at_68%_74%,#000_28%,transparent_76%)]" />
      {/* o brilho se apaga antes da borda: o rodapé continua no mesmo preto, sem linha de corte */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,transparent_70%,#03050c)]" />

      <p className="eyebrow text-cream/70">(03) Instalar</p>
      <h2 id="instalar-title" className="display mt-6 max-w-[12ch] text-[clamp(52px,8.6vw,150px)] text-cream">
        Um prompt. <em>Seu agente</em> faz o resto.
      </h2>

      <div className="mt-16 grid gap-x-6 gap-y-14 md:mt-24 md:grid-cols-12">
        <ol className="min-w-0 border-t border-cream/12 md:col-span-4">
          {STEPS.map((s) => (
            <li key={s.n} className="grid grid-cols-[3rem_1fr] border-b border-cream/12 py-6 md:py-7">
              <span className="pt-2 font-mono text-[12px] text-ember-300">{s.n}</span>
              <div>
                <h3 className="text-[22px] font-normal leading-tight tracking-[-0.02em] text-cream md:text-[24px]">{s.title}</h3>
                <p className="mt-1.5 max-w-[36ch] text-[15px] leading-relaxed text-cream/65">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="min-w-0 md:col-span-7 md:col-start-6">
          <figure id="prompt" className="overflow-hidden rounded-2xl border border-cream/12 bg-night-950/90 shadow-[0_48px_140px_-48px_rgb(255_106_26/0.5)]">
            <figcaption className="flex items-center justify-between border-b border-cream/10 px-5 py-3.5 md:px-7">
              <span className="font-mono text-[12px] text-cream/60">prompt de instalação</span>
              <span className="flex gap-1.5" aria-hidden="true">
                <i className="size-2.5 rounded-full bg-cream/15" />
                <i className="size-2.5 rounded-full bg-cream/15" />
                <i className="size-2.5 rounded-full bg-ember-500/80" />
              </span>
            </figcaption>
            <pre className="whitespace-pre-wrap wrap-anywhere px-5 py-6 font-mono text-[13px] leading-[1.8] text-cream/90 md:px-7 md:py-8 md:text-[14px]">
              <code>{BOOTSTRAP_PROMPT}</code>
            </pre>
            <div className="flex flex-col gap-4 border-t border-cream/10 p-3 sm:flex-row sm:items-center sm:justify-between sm:pl-7">
              <p className="px-2 text-[14px] text-cream/60 sm:px-0">Requer Node 18+. O agente confere o resto.</p>
              <Magnetic strength={0.2}>
                <Button variant="ember" size="xl" className="w-full sm:w-auto" onClick={onCopy}>
                  <span data-magnetic-inner className="inline-flex items-center gap-3">
                    {copied ? 'Copiado' : 'Copiar prompt'}
                    {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                  </span>
                </Button>
              </Magnetic>
            </div>
          </figure>

          <Collapsible open={open} onOpenChange={setOpen} className="mt-6">
            <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 px-1">
              <p className="text-[14px] leading-relaxed text-cream/70">
                <span className="eyebrow mr-3 text-cream/55">Funciona com</span>
                {AGENTS.join(' · ')}
              </p>
              <CollapsibleTrigger className="-my-3 inline-flex items-center gap-2 py-3 text-[14px] text-cream/75 transition-colors hover:text-cream">
                Prefere instalar à mão?
                <ChevronDown className={cn('size-4 transition-transform duration-500 ease-expo', open && 'rotate-180')} aria-hidden="true" />
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
              <pre className="mt-4 whitespace-pre-wrap wrap-anywhere rounded-xl border border-cream/10 bg-night-950/80 p-5 font-mono text-[12.5px] leading-relaxed text-cream/80">
                <code>{MANUAL_INSTALL}</code>
              </pre>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </section>
  );
}
