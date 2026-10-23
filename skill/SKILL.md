---
name: parede-da-ia
description: Direção de arte e engenharia front-end nível Awwwards com olhos e mãos reais (Playwright + FFmpeg). Use ao criar, redesenhar ou auditar landing pages, sites, componentes e UI; ao analisar sites de referência (Awwwards, Cuberto, Lusion); ao revisar código, arquitetura, commits ou prompts com base em 10 livros clássicos; e sempre que precisar abrir uma página, rolar, clicar, gravar frames, tirar screenshots ou extrair fontes/paleta/stack de um site.
---

# parede-da-ia

Leia o router e siga-o: ele classifica a tarefa e diz quais módulos carregar sob demanda.

- Router: `{{PAREDE_REPO}}/prompts/router.md`
- Fallback remoto: https://raw.githubusercontent.com/AnThophicous/parede-da-ia/main/prompts/router.md

## Ferramentas

No PATH (após `npm link`) ou via `node "{{PAREDE_REPO}}/toolkit/bin/parede.js" <comando>`:

| Comando | Para quê |
|---------|----------|
| `web-url-fetch <url>` | abre num Chromium persistente e injeta hooks |
| `web-wait-page-load` | espera load + networkidle + fontes (padrão) |
| `web-wait <s>` | fallback para pre-loaders em canvas/WebGL |
| `web-control <ação>` | scroll, click, hover, mousemove, keypress, inventory, sequence |
| `web-record-frames` | frames a cada 0.5s → spritesheet + MP4 |
| `web-screenshot` | alta definição, viewport/página/elemento |
| `web-scrap` | stack, fontes, ícones, paleta, contraste, mídia, shaders, rede |
| `web-serve <pasta> --detach` | servidor estático local |
| `web-close` | encerra a sessão |

Regra inegociável: **nunca declare uma interface pronta sem abri-la com `web-url-fetch` e ler os screenshots.**
