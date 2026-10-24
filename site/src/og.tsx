import { createRoot } from 'react-dom/client';
import { BOOKS } from '@/content';
import { seeded } from '@/lib/word';
import './index.css';

/**
 * Social preview (1200×630): black ink on white paper, the black hole drawn like the one in the
 * journey, a few book-stars on the sides. Captured by scripts/og.mjs.
 */
function Og() {
  const stars = Array.from({ length: 16 }, (_, i) => ({
    x: 1040 + seeded(i, 1) * 140, // only on the right edge: never over the type
    y: 40 + seeded(i, 2) * 560,
    r: 2 + seeded(i, 3) * 2.6,
  }));
  return (
    <div className="relative h-[630px] w-[1200px] overflow-hidden bg-paper text-ink">
      {/* the well, the luminous ring, the shadow and the disk crossing it */}
      <div className="absolute left-[835px] top-[315px] size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(0_0_0/0.95)_0%,rgb(0_0_0/0.92)_22%,rgb(0_0_0/0.5)_36%,rgb(0_0_0/0.12)_52%,transparent_68%)]" />
      <div className="absolute left-[835px] top-[315px] size-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[14px] border-white/85 blur-[3px]" />
      <div className="absolute left-[835px] top-[315px] size-[176px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black" />
      <div className="absolute left-[835px] top-[315px] h-[10px] w-[560px] -translate-x-1/2 -translate-y-1/2 -rotate-[3.4deg] rounded-full bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.9)_30%,rgb(255_255_255/0.95)_50%,rgb(255_255_255/0.9)_70%,transparent)] blur-[1.5px]" />
      {stars.map((s, i) => (
        <span key={i} className="absolute rounded-full bg-black" style={{ left: s.x, top: s.y, width: s.r * 2, height: s.r * 2 }} />
      ))}

      <div className="relative z-10 flex h-full flex-col justify-between px-16 py-14">
        <p className="eyebrow text-[13px] text-black/55">Open-source skill for AI agents · {BOOKS.length} books</p>
        <h1 className="text-[150px] font-semibold leading-[0.88] tracking-[-0.05em]">
          Parede
          <br />
          da IA
        </h1>
        <div className="flex items-end justify-between">
          <p className="text-[30px] font-light tracking-[-0.02em]">Eyes, hands and taste for your AI agent.</p>
          <p className="font-mono text-[15px] text-black/55">install with one prompt</p>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('og')!).render(<Og />);
