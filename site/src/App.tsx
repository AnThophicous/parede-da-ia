import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Cursor } from '@/components/Cursor';
import { Preloader } from '@/components/Preloader';
import { Toaster } from '@/components/ui/sonner';
import { BOOTSTRAP_PROMPT } from '@/content';
import { copyText } from '@/lib/clipboard';
import { scrollToTarget, useReducedMotion, useSmoothScroll } from '@/lib/motion';
import { Footer } from '@/sections/Footer';
import { Header } from '@/sections/Header';
import { Hero } from '@/sections/Hero';
import { Install } from '@/sections/Install';
import { Morph } from '@/sections/Morph';
import { Problem } from '@/sections/Problem';

export function App() {
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  useSmoothScroll(!reduced);

  const onPreloaderDone = useCallback(() => setReady(true), []);

  // Âncoras internas passam pelo Lenis (rolagem suave e consistente com a coreografia).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      const hash = link?.getAttribute('href');
      if (!link || !hash || hash.length < 2) return;
      e.preventDefault();
      scrollToTarget(hash === '#topo' ? 0 : hash);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // "Copiado" vive aqui: o CTA do topo também confirma no botão do card, onde a pessoa chega.
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef(0);
  const copyPrompt = useCallback(async () => {
    const ok = await copyText(BOOTSTRAP_PROMPT);
    if (ok) {
      toast.success('Prompt copiado', { description: 'Cole no Claude Code, Codex, OpenCode ou Cursor.' });
      setCopied(true);
      window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), 4000);
    } else {
      toast('Selecione o prompt abaixo e copie manualmente.');
    }
    return ok;
  }, []);

  // CTA do topo: copia e centraliza o card do prompt (a pessoa vê o que copiou e o próximo passo).
  const install = useCallback(async () => {
    await copyPrompt();
    scrollToTarget('#prompt', { center: true });
  }, [copyPrompt]);

  return (
    <>
      <a href="#conteudo" className="sr-only z-[90] rounded-full bg-cream px-5 py-3 text-night-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Pular para o conteúdo
      </a>
      <Preloader onDone={onPreloaderDone} />
      <Cursor />
      <div className="grain" aria-hidden="true" />
      <Header onInstall={install} />
      <main id="conteudo">
        <Hero ready={ready} onInstall={install} />
        <Problem />
        <Morph />
        <Install copied={copied} onCopy={copyPrompt} />
      </main>
      <Footer />
      <Toaster position="bottom-center" />
    </>
  );
}
