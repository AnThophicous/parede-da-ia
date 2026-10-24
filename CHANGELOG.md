# Changelog

Formato inspirado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versões seguem
[SemVer](https://semver.org/lang/pt-BR/).

## [0.2.0] — 2026-10-24

### Toolkit
- **Quebra:** reorganizada em Clean Architecture (domínio, aplicação com portas, infraestrutura,
  apresentação). Os binários agora passam por `bin/_launch.js` e o daemon sai de `dist/daemon.js`.
  Ao atualizar: `web-close` (encerra um daemon antigo), `npm install && npm link` e `parede setup`.
- Novos comandos: `web-motion` (o que anima, curvas, fps, jank — inclusive GSAP empacotado),
  `web-interactions` (hover, foco e `:active` com folha antes/depois), `web-audit` (nota 0–100 por
  viewport), `web-tokens` (CSS + JSON), `web-diff` (SSIM/PSNR), `media-frames` (frames de vídeos de
  referência) e `web-eval`.
- `web-control drag`, `web-screenshot --viewports` e `--hide-banners`, `web-record-frames --selector`
  com fps e jank no manifesto; `web-scrap` classifica a família estética provável.
- Correções: `web-screenshot --dpr` diferente do contexto saía com metade da resolução e mudava a
  rolagem de páginas com smooth-scroll; `web-audit` media o CLS depois de trocar de viewport (o
  próprio resize inflava o número), acusava falta de foco no meio de transições `transition-all` e
  media texto de SVG em unidades do viewBox; `web-interactions` deixava texto selecionado entre os
  recortes. Teste de regressão no smoke (24 verificações).

### Prompts
- Router v0.2: detecção de arquétipo (corporativo, pessoal, ambicioso) com exemplos; projeto
  corporativo pede briefing, estética e perguntas extras.
- Base de **23 livros** (13 novos: microinterações, animação, tipografia, grid, cor, shaders,
  design de objetos, marca, leis de UX, atomic design, componentes inclusivos, StoryBrand) e
  módulos reescritos no formato XML com axiomas, guardas e checklists.
- **7 estéticas** com playbooks medidos em referências reais + biblioteca de blurs.
- Workflows `corporate-briefing`, `creative-direction`, `motion-teardown`; templates de briefing,
  direção criativa, motion spec e relatório de entrega.

### Library
- Receitas: Hover Font (sem layout shift), text morph de partículas (three.js injetado; criação
  em fatias e shader compilado em paralelo), magnético, rastro de pixels, canvas arrastável,
  pilha de cartões, selo de scroll, preloader "olá" e campo de gradiente em GLSL.

### Site
- Landing 2.0 em React + Vite + Tailwind + shadcn + Paper Shaders + three.js, só para converter:
  hero com campo de cor e lente, problema, morph "olhos → mãos → repertório" e instalação com o
  prompt visível e copiável. `web-audit` 99/100 em desktop, tablet e mobile.
- Publicação via GitHub Actions (`site/` → Pages); a landing v0.1 em `docs/` foi removida.
- Prévia social (`og.jpg`) gerada pela própria toolkit a partir de `site/og.html`.

## [0.1.0] — 2026-10-23

- Toolkit Playwright + FFmpeg: `web-url-fetch`, `web-wait-page-load`, `web-wait`, `web-control`,
  `web-record-frames`, `web-screenshot`, `web-scrap`, `web-serve`, `parede doctor/setup` e MCP.
- Router de prompts com base de 10 livros, workflows `frontend-master` e `reference-teardown`.
- Instalador universal (`doc.md`) e landing monocromática no GitHub Pages.
