import { MeshGradient } from '@paper-design/shaders-react';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * Campo de cor líquido (estética gradiente-atmosferico): escuro dominante com bandas
 * de laranja e âmbar. Muitas cores escuras na lista = luz aparece como faixas, não como mancha.
 */
const PALETTES = {
  hero: ['#03050c', '#ff6a1a', '#0b1638', '#03050c', '#ffb36b', '#1b2a63', '#03050c', '#ff8a3d', '#050816'],
  // Mais pretos que no hero: sobra menos área de mistura direta laranja–azul (que puxa para o marrom).
  finale: ['#03050c', '#ff6a1a', '#03050c', '#13215a', '#ffb36b', '#03050c', '#ff8a3d', '#0b1638'],
} as const;

const SPEED = 0.2;
const MAX_PIXELS = 1_600_000; // ~1.6 MP: o olho não percebe resolução menor num campo desfocado
const PARALLAX = 0.06;
const LERP = 0.05;

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * `eager` monta o WebGL já na primeira renderização (campo acima da dobra: a compilação do shader
 * acontece cedo, durante o preloader, e não atrasa a entrada do título).
 * `frame` (ms) congela o campo num quadro fixo: capturas determinísticas como o og.jpg.
 */
export function Field({ variant, className, eager = false, frame }: { variant: keyof typeof PALETTES; className?: string; eager?: boolean; frame?: number }) {
  const reduced = useReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const [webgl] = useState(supportsWebGL);
  const [visible, setVisible] = useState(true);
  // Fora da dobra, o contexto WebGL só nasce quando o campo chega perto (uma tela de distância):
  // o campo do final não compila shader na carga, junto com o hero.
  const [near, setNear] = useState(eager);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '100px' });
    const nearIo = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setNear(true);
      nearIo.disconnect();
    }, { rootMargin: '100% 0px' });
    io.observe(el);
    nearIo.observe(el);
    return () => {
      io.disconnect();
      nearIo.disconnect();
    };
  }, []);

  // Paralaxe sutil: o campo "olha" para o cursor.
  useEffect(() => {
    if (reduced || !webgl || !visible || frame !== undefined) return;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * PARALLAX;
      target.y = (e.clientY / window.innerHeight - 0.5) * PARALLAX;
    };
    const loop = () => {
      current.x += (target.x - current.x) * LERP;
      current.y += (target.y - current.y) * LERP;
      setOffset((prev) => (Math.abs(prev.x - current.x) + Math.abs(prev.y - current.y) > 0.0008 ? { ...current } : prev));
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, [reduced, webgl, visible, frame]);

  return (
    <div ref={host} aria-hidden="true" className={cn('pointer-events-none', className)}>
      {!webgl ? (
        <div className="field-fallback absolute -inset-[10%]" />
      ) : near ? (
        <MeshGradient
          className="absolute inset-0"
          colors={[...PALETTES[variant]]}
          distortion={1}
          swirl={0.9}
          grainMixer={0.18}
          grainOverlay={0.12}
          speed={reduced || !visible || frame !== undefined ? 0 : SPEED}
          frame={frame}
          scale={1.12}
          offsetX={offset.x}
          offsetY={offset.y}
          maxPixelCount={MAX_PIXELS}
          minPixelRatio={1}
        />
      ) : null}
    </div>
  );
}
