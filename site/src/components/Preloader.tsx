import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/lib/motion';

/**
 * "olá, agente." sobre um blob meia-noite/laranja respirando (library/loaders/hello-preloader.css).
 * Some sozinho em 1,5s via CSS — mesmo se o JS falhar — e avisa a página para começar a intro.
 */
export function Preloader({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (reduced) onDone();
  }, [reduced, onDone]);

  if (reduced || gone) return null;
  return (
    <div
      className="hello"
      aria-hidden="true"
      onAnimationStart={(e) => {
        if (e.animationName === 'hello-out') onDone();
      }}
      onAnimationEnd={(e) => {
        if (e.animationName === 'hello-out') setGone(true);
      }}
    >
      <div className="hello__blob" />
      <p className="hello__word">
        olá, <em>agente</em>.
      </p>
    </div>
  );
}
