# parede-da-ia · library

Ready-made effect recipes for agents to copy and adapt — no mandatory dependencies
(Three.js and GSAP, when used, are **injected** as a parameter). Each file starts with:
usage, requirements, accessibility rules and performance rules.

| Recipe | File | Aesthetics | Notes |
|--------|------|------------|-------|
| Hover Font (weight by cursor proximity) | `motion/hover-font.js` | editorial, gradient, canvas | no layout shift (fixed boxes + scaleX) |
| Magnetic button | `motion/magnetic.js` | all except strict modernist | only on large targets |
| Pixel trail on a grid | `motion/pixel-trail.js` | playful-canvas | decorative, aria-hidden |
| Draggable canvas | `motion/draggable-canvas.js` | playful-canvas | keyboard (arrows/Esc) and saved position |
| Card stack (a section becomes a card) | `motion/card-stack.css` | canvas, editorial | CSS scroll-driven |
| Rotating circular badge | `motion/scroll-badge.css` | gradient, editorial | SVG textPath |
| "Hello" preloader | `loaders/hello-preloader.css` | gradient, immersive | ≤ 1.8s, disappears without JS |
| Text morph (particles → text) | `particles/text-morph.js` | immersive, gradient | THREE injected, DPR ≤ 1.5, nebula or scattered start |
| Blur library (12 types) | `gradients/blur-library.css` · preview `gradients/index.html` | gradient, brand | OKLab/OKLCH + grain |
| Liquid color field (GLSL) | `gradients/mesh-field.glsl` | atmospheric-gradient | fBm + domain warping |

Preview with the toolkit:
```bash
web-url-fetch library/gradients/index.html && web-wait-page-load && web-screenshot --full-page
```

General rules (from `prompts/knowledge-base/11`, `13`, `17` and `22`):
- every decorative effect is `aria-hidden` and has a `prefers-reduced-motion` fallback;
- cursor effects stay off on touch screens;
- animate `transform` and `opacity`; pause loops outside the viewport.
