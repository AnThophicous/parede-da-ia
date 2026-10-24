import { useEffect, useRef, useState } from 'react';
import { useFinePointer, useReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

const RING_LERP = 0.2;
const INTERACTIVE = 'a, button, [role="button"], summary, label';

/**
 * Cursor de ponto + anel. Sobre qualquer alvo interativo o anel se recolhe e o ponto vira laranja:
 * o hover do próprio elemento dá o retorno, e nada cobre o texto dele.
 * Sem mix-blend-mode: uma camada fixa de tela cheia em blend obriga o compositor a mesclar a
 * página inteira a cada frame (no A/B de rolagem, removê-la subiu de ~17 para ~29 fps).
 */
export function Cursor() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [over, setOver] = useState(false);
  const [ready, setReady] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    if (!fine) return;
    document.documentElement.classList.add('has-cursor');
    const pos = { x: innerWidth / 2, y: innerHeight / 2 };
    const lag = { ...pos };
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      setReady(true);
    };
    const onOver = (e: PointerEvent) => setOver(Boolean((e.target as Element | null)?.closest(INTERACTIVE)));
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);
    const onLeave = () => setReady(false);
    const loop = () => {
      const k = reduced ? 1 : RING_LERP;
      lag.x += (pos.x - lag.x) * k;
      lag.y += (pos.y - lag.y) * k;
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${lag.x}px, ${lag.y}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.documentElement.addEventListener('pointerleave', onLeave);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [fine, reduced]);

  if (!fine) return null;
  return (
    <div aria-hidden="true" className={cn('pointer-events-none fixed left-0 top-0 z-[80] transition-opacity duration-300', ready ? 'opacity-100' : 'opacity-0')}>
      <div ref={dot} className="absolute left-0 top-0 -ml-[3px] -mt-[3px]">
        <div className={cn('size-1.5 rounded-full shadow-[0_0_0_1px_rgb(3_5_12/0.35)] transition-[background-color,scale] duration-300', over ? 'scale-150 bg-ember-500' : 'bg-cream')} />
      </div>
      <div ref={ring} className="absolute left-0 top-0">
        <div
          className={cn(
            '-translate-x-1/2 -translate-y-1/2 rounded-full border border-cream/70 transition-[width,height,opacity] duration-500 ease-expo',
            over ? 'size-2 opacity-0' : pressed ? 'size-7' : 'size-10',
          )}
        />
      </div>
    </div>
  );
}
