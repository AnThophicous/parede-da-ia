import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { useEffect, useSyncExternalStore } from 'react';

gsap.registerPlugin(ScrollTrigger);

const REDUCED = '(prefers-reduced-motion: reduce)';
const FINE = '(hover: hover) and (pointer: fine)';

function useMedia(query: string, fallback = false): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', notify);
      return () => mq.removeEventListener('change', notify);
    },
    () => window.matchMedia(query).matches,
    () => fallback,
  );
}

export const useReducedMotion = () => useMedia(REDUCED);
export const useFinePointer = () => useMedia(FINE);

let lenis: Lenis | null = null;

/** Scroll suave (Lenis) sincronizado com o ticker do GSAP; desligado em movimento reduzido. */
export function useSmoothScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
    };
  }, [enabled]);
}

/** Rola até o alvo pelo Lenis (ou nativo). `center` deixa o elemento no meio da viewport. */
export function scrollToTarget(target: string | number, { center = false } = {}) {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : null;
  const offset = center && el ? -Math.max(0, (window.innerHeight - el.offsetHeight) / 2) : 0;
  if (lenis) {
    lenis.scrollTo(el ?? target, { offset, duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
    return;
  }
  const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  if (typeof target === 'number') window.scrollTo({ top: target, behavior });
  else el?.scrollIntoView({ behavior, block: center ? 'center' : 'start' });
}

export function setScrollLocked(locked: boolean) {
  if (locked) lenis?.stop();
  else lenis?.start();
}

export { gsap, ScrollTrigger };
