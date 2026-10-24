import { useEffect, useRef } from 'react';
import { useFinePointer, useReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

const FOLLOW = 0.045;
const MAX_SHIFT = 28;

/**
 * A lente: vidro fosco sobre o campo de cor — a metáfora literal de "dar olhos ao agente".
 * backdrop-filter sobre o canvas WebGL; o anel de texto gira devagar; segue o cursor de leve.
 */
export function Lens({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !fine || reduced) return;
    const target = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy) || 1;
      const pull = Math.min(1, 520 / dist);
      target.x = (dx / dist) * MAX_SHIFT * pull;
      target.y = (dy / dist) * MAX_SHIFT * pull;
    };
    const loop = () => {
      pos.x += (target.x - pos.x) * FOLLOW;
      pos.y += (target.y - pos.y) * FOLLOW;
      el.style.transform = `translate3d(${pos.x.toFixed(2)}px, ${pos.y.toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, [fine, reduced]);

  return (
    <div ref={ref} aria-hidden="true" className={cn('pointer-events-none absolute aspect-square will-change-transform', className)}>
      <div
        className="absolute inset-0 rounded-full border border-cream/15"
        style={{
          backdropFilter: 'blur(12px) saturate(1.7) brightness(1.15)',
          WebkitBackdropFilter: 'blur(12px) saturate(1.7) brightness(1.15)',
          background:
            'radial-gradient(circle at 30% 24%, rgb(255 255 255 / .22), transparent 34%), radial-gradient(circle at 72% 82%, rgb(255 138 61 / .2), transparent 46%), radial-gradient(circle at 50% 50%, transparent 62%, rgb(3 5 12 / .35) 100%)',
          boxShadow: 'inset 0 0 70px rgb(255 179 107 / .1), inset -14px -22px 48px rgb(3 5 12 / .45), 0 60px 140px -50px rgb(0 0 0 / .7)',
        }}
      />
      <svg viewBox="0 0 200 200" className="absolute -inset-[13%] h-[126%] w-[126%] animate-[spin_48s_linear_infinite] motion-reduce:animate-none">
        <defs>
          <path id="lens-ring" d="M100,100 m-88,0 a88,88 0 1,1 176,0 a88,88 0 1,1 -176,0" />
        </defs>
        {/* no celular a lente é menor: o anel ganha corpo (≥ 12px na tela) e aperta o espaçamento para caber */}
        <text className="fill-cream/50 font-mono text-[6.6px] uppercase tracking-[0.34em] max-sm:text-[10.5px] max-sm:tracking-[0.2em]">
          <textPath href="#lens-ring">olhos · mãos · repertório · olhos · mãos · repertório ·</textPath>
        </text>
      </svg>
    </div>
  );
}
