import { useCallback, useEffect, useRef, useState } from 'react';
import { music } from '@/lib/music';
import { cn } from '@/lib/utils';

const TRAVEL = 132;
/** Past this fraction of the travel the breaker trips by itself. */
const TRIP = 0.78;
/** Nothing moves for the first pixels: the handle is stuck, like a real breaker. */
const STICTION = 10;

/** Heavy feel: the handle lags further and further behind the pointer. */
const heavy = (raw: number) => TRAVEL * (1 - Math.exp(-Math.max(0, raw - STICTION) / (TRAVEL * 1.45)));

/**
 * The breaker. Dragging it down is deliberately heavy; past the detent it trips with a clunk,
 * the lights come on and the music starts. Works with mouse, touch and keyboard.
 */
export function Lever({ onOn }: { onOn: (muted: boolean) => void }) {
  const [y, setY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [on, setOn] = useState(false);
  const [visible, setVisible] = useState(false);
  const start = useRef(0);
  const tripped = useRef(false);

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const trip = useCallback(
    (muted: boolean) => {
      if (tripped.current) return;
      tripped.current = true;
      setDragging(false);
      setY(TRAVEL);
      setOn(true);
      if (!muted) music.clunk();
      navigator.vibrate?.(28);
      window.setTimeout(() => onOn(muted), 420);
    },
    [onOn],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (tripped.current) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    music.prime();
    start.current = e.clientY;
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || tripped.current) return;
    const next = heavy(e.clientY - start.current);
    if (next >= TRAVEL * TRIP) trip(false);
    else setY(next);
  };
  const onPointerUp = () => {
    if (tripped.current) return;
    setDragging(false);
    setY(0);
  };

  // Keyboard: a slow, heavy pull that trips at the end.
  const keyPull = () => {
    if (tripped.current) return;
    let v = 0;
    const id = window.setInterval(() => {
      v += 9;
      if (v >= TRAVEL * TRIP) {
        clearInterval(id);
        trip(false);
      } else setY(v);
    }, 40);
  };

  return (
    <div className={cn('fixed inset-0 z-30 grid place-items-center bg-ink transition-opacity duration-1000 ease-out', visible ? 'opacity-100' : 'opacity-0')}>
      <div className="flex flex-col items-center gap-10 text-center">
        <div>
          <p className="eyebrow text-white/50">Parede da IA</p>
          <p className="mt-4 text-[clamp(26px,3vw,38px)] font-light tracking-[-0.03em] text-white">Turn it on.</p>
        </div>

        {/* breaker */}
        <div className="relative h-[268px] w-[132px] rounded-[28px] border border-white/20 bg-white/[0.03] shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]">
          <span className={cn('absolute left-1/2 top-4 size-1.5 -translate-x-1/2 rounded-full transition-all duration-500', on ? 'bg-white shadow-[0_0_14px_3px_rgb(255_255_255/0.8)]' : 'bg-white/20')} aria-hidden="true" />
          <span className="absolute left-1/2 top-[38px] h-[196px] w-[14px] -translate-x-1/2 rounded-full bg-black shadow-[inset_0_2px_6px_rgb(0_0_0/0.9)] ring-1 ring-white/10" aria-hidden="true" />
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.2em] text-white/40" aria-hidden="true">
            {on ? 'ON' : 'OFF'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label="Turn on the experience — pull the lever down (sound on)"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                music.prime();
                keyPull();
              }
            }}
            className={cn(
              'group absolute left-1/2 top-[34px] h-[54px] w-[88px] touch-none select-none rounded-[14px] bg-white shadow-[0_10px_30px_-8px_rgb(255_255_255/0.35),inset_0_-3px_0_rgb(0_0_0/0.18)] outline-offset-8',
              dragging ? 'cursor-grabbing' : 'cursor-grab',
              !dragging && (on ? 'transition-transform duration-150 ease-out' : 'transition-transform duration-700 ease-spring'),
            )}
            style={{ transform: `translate(-50%, ${y}px)` }}
          >
            <span className="absolute inset-x-5 top-1/2 flex -translate-y-1/2 flex-col gap-[5px]" aria-hidden="true">
              <i className="h-px bg-black/25" />
              <i className="h-px bg-black/25" />
              <i className="h-px bg-black/25" />
            </span>
          </button>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="font-mono text-[12px] text-white/55">Pull it down · sound on · headphones help</p>
          <button type="button" onClick={() => trip(true)} className="-my-3 py-3 font-mono text-[12px] text-white/40 underline-offset-4 transition-colors hover:text-white hover:underline">
            or enter without sound
          </button>
        </div>
      </div>
    </div>
  );
}
