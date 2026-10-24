import { Check, ChevronDown, Copy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AGENTS, BOOTSTRAP_PROMPT, FOOTER_LINKS, INSTALL, MANUAL_INSTALL } from '@/content';
import { copyText } from '@/lib/clipboard';
import { cn } from '@/lib/utils';

const CELL = 44;

/** Background: a grid of small squares; the ones under the cursor turn gray and fade back. */
function Grid() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const cols = Math.ceil(size.w / CELL) + 1;
  const rows = Math.ceil(size.h / CELL) + 1;
  const cells = useMemo(() => Array.from({ length: cols * rows }, (_, i) => i), [cols, rows]);
  return (
    <div aria-hidden="true" className="fixed inset-0 grid gap-px bg-black/[0.07]" style={{ gridTemplateColumns: `repeat(${cols}, ${CELL - 1}px)`, gridAutoRows: `${CELL - 1}px` }}>
      {cells.map((i) => (
        <span key={i} className="bg-paper transition-colors duration-[1400ms] ease-out hover:bg-smoke hover:duration-0" />
      ))}
    </div>
  );
}

/** The end of the journey and the whole point of the page: one prompt to copy. */
export function Install({ onReplay }: { onReplay: () => void }) {
  const [copied, setCopied] = useState(false);
  const [said, setSaid] = useState(false);
  const [open, setOpen] = useState(false);

  const copy = async () => {
    const ok = await copyText(BOOTSTRAP_PROMPT);
    if (!ok) return;
    setCopied(true);
    setSaid(true);
    window.setTimeout(() => setCopied(false), 2600);
  };

  return (
    <section aria-labelledby="install-title" className="fixed inset-0 z-40 overflow-y-auto bg-paper text-ink animate-in fade-in-0 duration-1000">
      <Grid />
      <div className="pointer-events-none relative flex min-h-full flex-col items-center justify-center px-gutter py-24">
        <div className="pointer-events-auto w-full max-w-[600px] rounded-[28px] border border-black/10 bg-white/95 p-2 shadow-[0_40px_120px_-40px_rgb(0_0_0/0.35)] backdrop-blur-sm animate-in fade-in-0 zoom-in-[0.97] slide-in-from-bottom-3 duration-1000 ease-expo">
          <div className="px-6 pb-6 pt-7 md:px-8 md:pt-9">
            <p className="eyebrow text-black/60">{INSTALL.eyebrow}</p>
            <h1 id="install-title" className="mt-4 text-[clamp(34px,5vw,52px)] font-light leading-[0.95] tracking-[-0.045em]">
              {INSTALL.title}
            </h1>
            <p className="mt-4 max-w-[46ch] text-[16px] leading-relaxed text-black/65">{INSTALL.lede}</p>
          </div>

          <div className="rounded-[22px] bg-ink p-1.5 text-paper">
            <pre className="max-h-[200px] overflow-auto whitespace-pre-wrap wrap-anywhere px-5 pb-4 pt-5 font-mono text-[12.5px] leading-[1.75] text-white/85 md:px-6">
              <code>{BOOTSTRAP_PROMPT}</code>
            </pre>
            <button
              type="button"
              onClick={copy}
              className="group relative flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-[16px] bg-paper text-[16px] font-medium text-ink transition-transform duration-300 ease-expo active:scale-[0.985]"
            >
              <span className="absolute inset-0 origin-bottom scale-y-0 bg-smoke transition-transform duration-500 ease-expo group-hover:scale-y-100" aria-hidden="true" />
              <span className="relative inline-flex items-center gap-2.5" aria-live="polite">
                {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4 transition-transform duration-500 ease-spring group-hover:-rotate-6" aria-hidden="true" />}
                {copied ? INSTALL.copied : INSTALL.copy}
              </span>
            </button>
          </div>

          <div className={cn('grid transition-[grid-template-rows,opacity] duration-700 ease-expo', said ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
            <p className="overflow-hidden px-6 text-[15px] leading-relaxed md:px-8">
              <span className="block pt-5 text-black/80">{INSTALL.afterCopy}</span>
            </p>
          </div>

          <Collapsible open={open} onOpenChange={setOpen} className="px-6 pb-6 pt-5 md:px-8">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
              <p className="text-[13px] text-black/60">
                <span className="eyebrow mr-2 text-black/55">Works with</span>
                {AGENTS.join(' · ')}
              </p>
              <CollapsibleTrigger className="-my-3.5 inline-flex items-center gap-1.5 py-3.5 text-[13px] text-black/65 transition-colors hover:text-black">
                Install by hand
                <ChevronDown className={cn('size-4 transition-transform duration-500 ease-expo', open && 'rotate-180')} aria-hidden="true" />
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
              <pre className="mt-4 whitespace-pre-wrap wrap-anywhere rounded-[14px] bg-black/[0.04] p-4 font-mono text-[12px] leading-relaxed text-black/80">
                <code>{MANUAL_INSTALL}</code>
              </pre>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <footer className="pointer-events-auto mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-black/55">
          {FOOTER_LINKS.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="-my-3.5 py-3.5 transition-colors hover:text-black">
              {l.label} <span aria-hidden="true">↗</span>
            </a>
          ))}
          <button type="button" onClick={onReplay} className="-my-3.5 py-3.5 transition-colors hover:text-black">
            Replay the journey
          </button>
        </footer>
      </div>
    </section>
  );
}
