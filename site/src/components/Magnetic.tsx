import { magnetic } from '@library/motion/magnetic.js';
import { useEffect, useRef, type ReactNode } from 'react';

/** Envolve um alvo grande (CTA) com o efeito magnético da library; o filho [data-magnetic-inner] se move mais. */
export function Magnetic({ children, strength = 0.3 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return magnetic(el, { strength, inner: el.querySelector<HTMLElement>('[data-magnetic-inner]') });
  }, [strength]);
  return (
    <div ref={ref} className="inline-flex will-change-transform">
      {children}
    </div>
  );
}
