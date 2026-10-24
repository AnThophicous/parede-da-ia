import { useEffect, useState } from 'react';
import { CAPTIONS, REPO_URL } from '@/content';
import { journey } from '@/lib/journey';
import { music } from '@/lib/music';
import { cn } from '@/lib/utils';

/** Top bar: wordmark, sound and a way out. Inverts itself over white and black. */
export function Hud({ onSkip, showSound = true }: { onSkip?: () => void; showSound?: boolean }) {
  const [muted, setMuted] = useState(music.muted);
  return (
    <header className="hud pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between px-gutter py-6">
      <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="group pointer-events-auto -my-3.5 flex items-center gap-2 py-3.5 font-mono text-[13px]" aria-label="parede-da-ia on GitHub">
        <span className="size-1.5 rounded-full bg-white transition-transform duration-500 ease-spring group-hover:scale-[2]" aria-hidden="true" />
        parede<span className="opacity-50 transition-opacity group-hover:opacity-100">—</span>da<span className="opacity-50 transition-opacity group-hover:opacity-100">—</span>ia
      </a>
      <div className="flex items-center gap-6 font-mono text-[12px]">
        {showSound && (
          <button
            type="button"
            className="pointer-events-auto -m-3.5 flex items-center gap-2 p-3.5"
            aria-pressed={!muted}
            onClick={() => {
              music.setMuted(!muted);
              setMuted(!muted);
            }}
          >
            <SoundBars on={!muted} />
            <span className="max-sm:sr-only">{muted ? 'Sound off' : 'Sound on'}</span>
          </button>
        )}
        {onSkip && (
          <button type="button" className="pointer-events-auto -my-3 py-3 underline-offset-4 hover:underline" onClick={onSkip}>
            Skip to install
          </button>
        )}
      </div>
    </header>
  );
}

/** Four bars that breathe with the music (flat when muted). */
function SoundBars({ on }: { on: boolean }) {
  const [, force] = useState(0);
  useEffect(() => {
    if (!on) return;
    let raf = 0;
    const loop = () => {
      force((n) => n + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [on]);
  const ph = music.phase();
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
      {[0.6, 1, 0.45, 0.8].map((k, i) => (
        <i key={i} className="w-[2px] bg-white" style={{ height: on ? `${(3 + 9 * k * Math.exp(-ph * (2 + i))).toFixed(1)}px` : '2px' }} />
      ))}
    </span>
  );
}

/** Captions of the journey, bottom-left, fading in and out with the progress. */
export function Captions() {
  const [index, setIndex] = useState(-1);
  useEffect(
    () =>
      journey.subscribe((p) => {
        const i = CAPTIONS.findIndex((c) => p >= c.from && p <= c.to);
        setIndex((prev) => (prev === i ? prev : i));
      }),
    [],
  );
  return (
    <div className="hud pointer-events-none fixed inset-x-0 bottom-0 z-50 h-48 px-gutter" aria-live="polite">
      {CAPTIONS.map((c, i) => (
        <div key={c.kicker} className={cn('absolute bottom-10 left-[var(--spacing-gutter)] right-[var(--spacing-gutter)] max-w-[44ch] transition-all duration-1000 ease-expo md:bottom-12', i === index ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0')} aria-hidden={i !== index}>
          <p className="eyebrow">{c.kicker}</p>
          {c.line && <p className="mt-3 text-[clamp(17px,1.6vw,22px)] font-light leading-snug tracking-[-0.01em]">{c.line}</p>}
        </div>
      ))}
    </div>
  );
}

/** "Scroll down to interact": shown once, gently, for about five seconds. */
export function ScrollPill() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setShow(false), 6600);
    const off = journey.onStart(() => window.setTimeout(() => setShow(false), 1200));
    return () => {
      clearTimeout(t);
      off();
    };
  }, []);
  if (!show) return null;
  return (
    <p className="pointer-events-none fixed left-1/2 top-20 z-50 rounded-full md:bottom-10 md:top-auto border border-black/10 bg-white/80 px-4 py-2 font-mono text-[12px] text-black/70 shadow-[0_10px_30px_-12px_rgb(0_0_0/0.25)] backdrop-blur-md" style={{ animation: 'pill-in-out 5.4s ease-in-out 1.2s both' }}>
      Scroll down to interact with the page
    </p>
  );
}
