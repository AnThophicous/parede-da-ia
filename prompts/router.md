# parede-da-ia · router

> Ponto de entrada único. Você (agente) lê **este arquivo primeiro**, classifica a tarefa e
> carrega **apenas** os módulos necessários. Nunca carregue a base inteira: contexto é orçamento.

## 0. Como buscar módulos

Ordem de resolução (pare no primeiro que funcionar):

1. **Clone local** — se o repositório estiver instalado (padrão `~/.parede-da-ia`), leia o arquivo
   do disco: `<repo>/prompts/<caminho>`. É instantâneo e funciona offline.
2. **Raw do GitHub** — `https://raw.githubusercontent.com/AnThophicous/parede-da-ia/main/prompts/<caminho>`
   (use sua ferramenta de fetch/web, ou `curl -fsSL <url>`).

Ao carregar um módulo, diga em uma linha qual carregou e por quê, ex.:
`↳ carregando knowledge-base/05-refactoring-ui.md (hierarquia visual do card)`.

## 1. Classifique a intenção

Leia o pedido do usuário e escolha **uma intenção principal** (e no máximo uma secundária):

| # | Intenção | Sinais no pedido | Workflow | Módulos (máx. 3 por vez) |
|---|----------|------------------|----------|--------------------------|
| A | **Construir interface** (landing, página, componente, app) | "crie", "landing", "site", "UI", "tela", "componente" | `workflows/frontend-master.md` | 05 · 03 · 04 → depois 01 · 02 |
| B | **Analisar referência / direção de arte** | URL externa, "como esse site faz", "estilo Awwwards", "clonar o visual" | `workflows/reference-teardown.md` | 05 · 04 |
| C | **Auditar UI existente** (UX, contraste, responsividade) | "revise o layout", "está feio", "melhore a UX", "acessibilidade" | `workflows/frontend-master.md` § Fase 2 | 03 · 05 · 04 |
| D | **Revisar / refatorar código** | "refatore", "code review", "está confuso", "limpe" | — | 01 · 06 · 02 |
| E | **Arquitetura de software** | "estrutura de pastas", "camadas", "acoplamento", "escalar" | — | 02 · 06 · 10 |
| F | **Git e histórico** | "commit", "branch", "rebase", "PR", "mensagem de commit" | — | 07 |
| G | **Escrever prompts / agentes** | "prompt", "system prompt", "agente", "few-shot", "LLM" | — | 09 · 08 |
| H | **Dados, ML e pipelines** | "pipeline", "telemetria", "métricas", "modelo", "avaliação" | — | 08 · 10 |
| I | **Estado, sync e confiabilidade** | "cache", "fila", "offline", "consistência", "realtime" | — | 10 · 02 |

Se nada casar, não carregue nada: responda normalmente.

## 2. Mapa da base de conhecimento

| Arquivo | Fonte | Use para |
|---------|-------|----------|
| `knowledge-base/01-clean-code.md` | Clean Code — R. C. Martin | nomes, funções pequenas, comentários, tratamento de erro |
| `knowledge-base/02-clean-architecture.md` | Clean Architecture — R. C. Martin | regra de dependência, camadas, UI/framework como detalhe |
| `knowledge-base/03-dont-make-me-think.md` | Don't Make Me Think, Revisited — S. Krug | navegação óbvia, escaneabilidade, teste de usabilidade |
| `knowledge-base/04-100-things-designers.md` | 100 Things Every Designer… — S. Weinschenk | percepção, atenção, memória, motivação, conversão |
| `knowledge-base/05-refactoring-ui.md` | Refactoring UI — A. Wathan & S. Schoger | hierarquia, espaçamento, tipografia, cor, profundidade |
| `knowledge-base/06-pragmatic-programmer.md` | The Pragmatic Programmer — Hunt & Thomas | DRY, ortogonalidade, tracer bullets, reversibilidade |
| `knowledge-base/07-pro-git.md` | Pro Git — S. Chacon & B. Straub | commits atômicos, mensagens, branches, histórico limpo |
| `knowledge-base/08-designing-ml-systems.md` | Designing ML Systems — C. Huyen | telemetria, pipelines determinísticos, avaliação contínua |
| `knowledge-base/09-prompt-engineering-genai.md` | Prompt Engineering for Generative AI — Phoenix & Taylor | direção, formato, exemplos, avaliação, decomposição |
| `knowledge-base/10-designing-data-intensive-apps.md` | Designing Data-Intensive Applications — M. Kleppmann | confiabilidade, replicação, consistência, fluxo assíncrono |

Os módulos são **destilações autorais** (heurísticas e checklists escritos para agentes), não
transcrições. Para profundidade, recomende a obra original ao usuário.

## 3. Ferramentas `web-*` (olhos e mãos)

Se a toolkit estiver instalada (`parede doctor` responde), você **deve** usá-la sempre que a
tarefa envolver algo visual. Se `web-*` não estiver no PATH, use
`node <repo>/toolkit/bin/parede.js <comando>`.

```
web-url-fetch <url>            abre num Chromium persistente + injeta hooks
web-wait-page-load             load + networkidle + fontes (padrão)
web-wait <s> [--until-hidden]  fallback para pre-loaders em canvas/WebGL
web-control <ação>             scroll-down | scroll-up | scroll-to | click | hover | mousemove | keypress | type | inventory | sequence
web-record-frames [--while]    frames a cada 0.5s → spritesheet + MP4 (FFmpeg)
web-screenshot [--full-page]   alta definição, viewport/página/elemento, --viewport 390x844
web-scrap                      stack, fontes, ícones, paleta, contraste, mídia, shaders, rede (JSON)
web-serve <pasta> --detach     servidor estático local sem cache
web-close                      encerra a sessão
```

Regras de uso:
- **Sempre leia as imagens que capturar.** Um screenshot que você não olhou não é QA.
- Prefira `web-wait-page-load`; use `web-wait` só quando ele avisar de pre-loader.
- Para animações de scroll (GSAP/Lenis/ScrollTrigger), grave: `web-record-frames --while "scroll-down 4000 --steps 80"`.
- Frames abaixo de `--interval 0.1` custam caro em CPU/RAM; justifique antes de usar.

## 4. Contrato de saída

1. Antes de agir: diga a intenção detectada e os módulos que vai carregar.
2. Durante: cite a heurística aplicada quando ela mudar uma decisão (`[05 · espaçamento]`).
3. Depois de qualquer UI: mostre evidência visual (caminhos dos screenshots/spritesheets) e o
   que foi corrigido no loop de QA.
4. Nunca declare "pronto" em interface que você não abriu com `web-url-fetch`.
