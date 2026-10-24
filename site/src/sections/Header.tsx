import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { REPO_URL } from '@/content';
import { cn } from '@/lib/utils';

export function Header({ onInstall }: { onInstall: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 40);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500 ease-expo',
        scrolled ? 'border-b border-cream/[0.06] bg-night-950/60 backdrop-blur-md' : 'border-b border-transparent',
      )}
    >
      <div className="flex h-[72px] items-center justify-between gap-6 px-gutter">
        <a href="#topo" className="group -my-3.5 flex items-center gap-2.5 py-3.5 font-mono text-[13px] text-cream" aria-label="parede-da-ia — início">
          <span className="size-2 rounded-full bg-ember-500 shadow-[0_0_14px_2px_rgb(255_106_26/0.6)] transition-transform duration-500 ease-expo group-hover:scale-150" aria-hidden="true" />
          parede<span className="text-mist transition-colors duration-300 group-hover:text-ember-400">—</span>da<span className="text-mist transition-colors duration-300 group-hover:text-ember-400">—</span>ia
        </a>
        <nav aria-label="Seções" className="hidden items-center gap-9 text-[14px] text-cream/75 md:flex">
          <a href="#como-funciona" className="transition-colors hover:text-cream">Como funciona</a>
          <a href="#instalar" className="transition-colors hover:text-cream">Instalar</a>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-cream">
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </nav>
        <Button variant="ember" size="lg" className="h-11 px-5 text-[14px] md:h-10" onClick={onInstall}>
          Instalar
        </Button>
      </div>
    </header>
  );
}
