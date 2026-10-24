import { createRoot } from 'react-dom/client';
import { Field } from '@/components/Field';
import { Lens } from '@/components/Lens';
import { VERSION } from '@/content';
import './index.css';

/**
 * Prévia social (1200×630) com a mesma direção do hero: campo de cor congelado num quadro,
 * a lente e o título. Capturada por scripts/og.mjs; `?frame=` escolhe o quadro do campo.
 */
const frame = Number(new URLSearchParams(location.search).get('frame') ?? 17000);

function Og() {
  return (
    <div className="relative isolate h-[630px] w-[1200px] overflow-hidden bg-night-900 text-cream">
      <Field variant="hero" eager frame={frame} className="absolute inset-0 -z-10" />
      {/* vinheta + topo escurecido: a faixa clara do campo não apaga o eyebrow */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_60%_35%,transparent_35%,rgb(3_5_12/0.55)_75%),linear-gradient(to_top,rgb(3_5_12/0.9),transparent_50%),linear-gradient(to_bottom,rgb(3_5_12/0.6),transparent_24%)]" />
      <Lens className="right-[72px] top-[118px] h-[340px]" />

      <div className="relative z-10 flex h-full flex-col justify-between px-16 pb-14 pt-14">
        <div className="flex justify-between">
          <p className="eyebrow text-[13px] text-cream/75">Skill open-source para agentes de IA</p>
          <p className="eyebrow text-[13px] text-cream/60">v{VERSION} · MIT</p>
        </div>
        <h1 className="display -ml-2 text-[188px] text-cream">
          <span className="block">
            Par<em>e</em>de
          </span>
          <span className="block pl-[1.2em]">
            d<em>a</em> IA
          </span>
        </h1>
        <div className="flex items-end justify-between">
          <p className="text-[28px] font-light leading-tight tracking-[-0.01em] text-cream/90">Dê olhos, mãos e repertório ao seu agente.</p>
          <p className="font-mono text-[15px] text-cream/60">instale com um prompt</p>
        </div>
      </div>
      <div aria-hidden="true" className="og-grain pointer-events-none absolute inset-0 z-20" />
    </div>
  );
}

createRoot(document.getElementById('og')!).render(<Og />);
