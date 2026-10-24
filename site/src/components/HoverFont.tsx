import { hoverFont } from '@library/motion/hover-font.js';
import { useEffect, useRef } from 'react';

type Tag = 'h1' | 'h2' | 'p' | 'span';

interface HoverFontProps {
  as?: Tag;
  /** HTML estático e confiável (permite <em> e spans de linha). */
  html: string;
  id?: string;
  className?: string;
  from?: number;
  to?: number;
  radius?: number;
  hidden?: boolean;
}

/**
 * Peso da fonte variável cresce perto do cursor (receita library/motion/hover-font.js).
 * O HTML é entregue via dangerouslySetInnerHTML para o React não disputar os nós que a receita divide.
 */
export function HoverFont({ as = 'h1', html, id, className, from = 280, to = 820, radius = 200, hidden }: HoverFontProps) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => (ref.current ? hoverFont(ref.current, { from, to, radius }) : undefined), [from, to, radius]);
  const Component = as as 'h1';
  return (
    <Component
      ref={ref as React.RefObject<HTMLHeadingElement>}
      id={id}
      className={className}
      aria-hidden={hidden || undefined}
      style={{ fontVariationSettings: `'wght' ${from}` }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
