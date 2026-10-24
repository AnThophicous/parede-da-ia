# parede-da-ia · library

Receitas de efeitos prontas para agentes copiarem e adaptarem — sem dependências obrigatórias
(Three.js e GSAP, quando usados, são **injetados** como parâmetro). Cada arquivo traz no topo:
uso, requisitos, regras de acessibilidade e de performance.

| Receita | Arquivo | Estéticas | Notas |
|---------|---------|-----------|-------|
| Hover Font (peso por proximidade do cursor) | `motion/hover-font.js` | editorial, gradiente, canvas | sem layout shift (caixas fixas + scaleX) |
| Botão magnético | `motion/magnetic.js` | todas exceto modernista estrito | só em alvos grandes |
| Rastro de pixels no grid | `motion/pixel-trail.js` | canvas-ludico | decorativo, aria-hidden |
| Canvas arrastável | `motion/draggable-canvas.js` | canvas-ludico | teclado (setas/Esc) e posição salva |
| Card stack (seção vira card) | `motion/card-stack.css` | canvas, editorial | CSS scroll-driven |
| Selo circular girando | `motion/scroll-badge.css` | gradiente, editorial | SVG textPath |
| Pre-loader "olá" | `loaders/hello-preloader.css` | gradiente, imersivo | ≤ 1,8s, some sem JS |
| Text morph (partículas → texto) | `particles/text-morph.js` | imersivo, gradiente | THREE injetado, DPR ≤ 1.5 |
| Biblioteca de blurs (12 tipos) | `gradients/blur-library.css` · prévia `gradients/index.html` | gradiente, marca | OKLab/OKLCH + grão |
| Campo de cor líquido (GLSL) | `gradients/mesh-field.glsl` | gradiente-atmosferico | fBm + domain warping |

Prévia com a toolkit:
```bash
web-url-fetch library/gradients/index.html && web-wait-page-load && web-screenshot --full-page
```

Regras gerais (de `prompts/knowledge-base/11`, `13`, `17` e `22`):
- todo efeito decorativo é `aria-hidden` e tem fallback em `prefers-reduced-motion`;
- efeitos de cursor ficam desligados em telas de toque;
- anime `transform` e `opacity`; pause loops fora da viewport.
