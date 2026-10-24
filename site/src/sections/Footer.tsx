import { HoverFont } from '@/components/HoverFont';
import { FOOTER_LINKS } from '@/content';

export function Footer() {
  return (
    <footer className="overflow-hidden bg-night-950 px-gutter pb-8 pt-20">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 text-[14px] text-cream/70">
        <ul className="flex flex-wrap gap-x-8 gap-y-3">
          {FOOTER_LINKS.map((l) => (
            <li key={l.label}>
              <a href={l.href} target="_blank" rel="noopener noreferrer" className="-my-3.5 inline-block py-3.5 transition-colors hover:text-cream">
                {l.label} <span aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>
        <a href="#topo" className="-my-3.5 inline-block py-3.5 transition-colors hover:text-cream">
          Voltar ao topo <span aria-hidden="true">↑</span>
        </a>
      </div>

      {/* Wordmark de ponta a ponta, alinhado pela tinta: no peso 200 o desenho mede 6,12em e começa
          0,084em depois da caixa. 16,3cqw + recuo põem a tinta exatamente nas margens. */}
      <div className="@container mt-20">
        <HoverFont
          as="p"
          hidden
          html="parede<span class='text-ember-500'>—</span>da<span class='text-ember-500'>—</span>ia"
          from={200}
          to={900}
          radius={260}
          className="-ml-[0.084em] whitespace-nowrap text-[length:16.3cqw] leading-[0.82] tracking-[-0.06em] text-cream"
        />
      </div>

      <div className="mt-10 flex flex-wrap justify-between gap-4 text-[13px] text-cream/55">
        <p>© 2026 Brenno Leon · open source sob licença MIT.</p>
        <p>Os livros citados pertencem aos seus autores; os módulos são destilações autorais.</p>
      </div>
    </footer>
  );
}
