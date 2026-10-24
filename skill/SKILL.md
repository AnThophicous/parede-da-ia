---
name: parede-da-ia
description: Direção de arte e engenharia front-end nível Awwwards com olhos e mãos reais (Playwright + FFmpeg). Use ao criar, redesenhar ou auditar landing pages, sites, portfólios, componentes e UI; ao pedir briefing de um site corporativo; ao dissecar referências (Awwwards, monopo, Lusion) e suas animações; ao revisar código, arquitetura, commits ou prompts com base em 23 livros clássicos e 7 estéticas; e sempre que precisar abrir uma página, rolar, clicar, gravar frames, medir contraste, movimento e microinterações, ou extrair fontes, paleta e stack de um site.
---

# parede-da-ia

Leia o router e siga-o: ele classifica a tarefa e o arquétipo do projeto (corporativo, pessoal ou
ambicioso) e diz quais módulos, estética e workflow carregar sob demanda.

- Router: `{{PAREDE_REPO}}/prompts/router.md`
- Fallback remoto: https://raw.githubusercontent.com/AnThophicous/parede-da-ia/main/prompts/router.md
- Receitas de efeitos (Hover Font, text morph, magnético, rastro de pixels…): `{{PAREDE_REPO}}/library/`

## Ferramentas

No PATH (após `npm link`) ou via `node "{{PAREDE_REPO}}/toolkit/bin/parede.js" <comando>`:

| Comando | Para quê |
|---------|----------|
| `web-url-fetch <url>` | abre num Chromium persistente e injeta hooks |
| `web-wait-page-load` | espera load + networkidle + fontes (padrão) |
| `web-wait <s>` | fallback para pre-loaders em canvas/WebGL |
| `web-control <ação>` | scroll, click, hover, mousemove, drag, keypress, inventory, sequence |
| `web-eval "<js>"` | lê estado da página (inspeção, não para alterar a UI) |
| `web-screenshot` | alta definição, viewport/página/elemento, `--viewports desktop,tablet,mobile` |
| `web-record-frames` | frames a cada 0.5s → spritesheet + MP4; `--selector` recorta um elemento |
| `web-scrap` | stack, fontes, ícones, paleta, contraste, mídia, shaders, rede, estética |
| `web-motion` | o que anima, curvas, durações, fps e jank (inclui GSAP empacotado) |
| `web-interactions` | hover, foco e :active de cada interativo, com folha antes/depois |
| `web-audit` | nota 0–100 por viewport: acessibilidade, responsivo, performance, SEO |
| `web-tokens` | exporta cores, tipos, espaços e movimento como CSS + JSON |
| `web-diff` · `media-frames` | compara capturas (SSIM) · extrai frames de vídeos de referência |
| `web-serve <pasta> --detach` | servidor estático local |
| `web-close` | encerra a sessão |

Regra inegociável: **nunca declare uma interface pronta sem abri-la com `web-url-fetch`, ler os
screenshots e passar no `web-audit`.**
