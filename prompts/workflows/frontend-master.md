# Workflow · frontend-master

> Protocolo obrigatório para construir ou redesenhar qualquer interface.
> Duas fases, sem atalhos: **elicitar → construir → verificar com os próprios olhos**.
> Módulos de apoio: `05-refactoring-ui` · `03-dont-make-me-think` · `04-100-things-designers`
> (implementação: `01-clean-code` · `02-clean-architecture`).

---

## Fase 1 — Planejamento e elicitação obrigatória

### Regra de ouro

**É proibido escrever código de interface antes de concluir esta fase.** Nem "um esqueleto rápido".
Decisões de direção de arte tomadas por suposição custam mais caro que três perguntas.

### 1.1 Leia o terreno (sem perguntar o que dá para descobrir)

- Existe projeto? Leia `package.json`, framework, sistema de estilos, tokens/tema existentes.
- Existe marca? Procure logo, fontes, cores em uso (`web-scrap` no site atual, se houver URL).
- Existe conteúdo? Textos reais, imagens, dados. Conteúdo real muda o design.

### 1.2 Pergunte — em uma única mensagem, numerada, com opções

Faça **todas** estas perguntas de uma vez (ofereça respostas sugeridas para acelerar):

1. **Objetivo central e público.** O que esta página precisa fazer o visitante *fazer*? Quem é ele?
   _ex.: "baixar o app", "agendar demo", "entender o produto em 10s"._
2. **Ápice visual.** Qual é o momento "uau" esperado? Onde ele acontece (hero, transição, seção de produto)?
   _ex.: tipografia cinética gigante · cena WebGL interativa · scroll horizontal pinado · cursor magnético · vídeo full-bleed._
3. **Assets e imagens.** Como serão gerenciados?
   - (a) **Gerados por código** — SVG, canvas, shaders/WebGL, gradientes, tipografia como imagem;
   - (b) **Fornecidos pelo usuário** — peça os arquivos ou a pasta;
   - (c) **Extraídos de uma URL de referência** — só com autorização e respeitando direitos de uso;
   - (d) **Placeholders** marcados para troca posterior.
4. **Referências.** O usuário já tem referências de mercado (URLs, prints)?
   Ou prefere que você **pesquise ativamente no Awwwards** (SOTD/Honorable Mentions) e proponha
   **2 a 3 direções criativas** compatíveis?
5. **Restrições.** Stack obrigatória, paleta/marca fixa, prazo, performance-alvo, acessibilidade,
   idiomas, SEO, onde será hospedado.

### 1.3 Se pediram pesquisa de referências

1. Busque no Awwwards (categoria/estilo compatível) e selecione 4–6 candidatos.
2. Para cada candidato forte: `workflows/reference-teardown.md` (scrap + screenshots + spritesheet de scroll).
3. Proponha **2–3 direções**, cada uma com:
   - nome e conceito em uma frase;
   - referências que a sustentam (URLs + o que extrair de cada uma);
   - tokens iniciais: famílias tipográficas, escala, paleta, raio, sombra, easing/duração;
   - estrutura de seções e onde mora o ápice;
   - risco/custo (ex.: "WebGL pesado em mobile → fallback em vídeo").
4. **Espere a escolha do usuário.** Não implemente as três.

### 1.4 Plano aprovado

Feche a fase com um plano curto: seções, tokens, stack, assets, critérios de aceite (o que será
verificado na Fase 2). Peça confirmação explícita.

---

## Fase 2 — Construção + loop autônomo de QA visual

### 2.1 Construa em fatias (tracer bullet)

1. Tokens (CSS custom properties) → layout bruto em escala de cinza → conteúdo real.
2. Hierarquia e espaçamento (`05`) antes de qualquer efeito.
3. Movimento e WebGL por último, sempre com `prefers-reduced-motion` e fallback.

### 2.2 Suba o servidor e abra o próprio trabalho

```bash
# projeto com dev server (vite/next/astro): rode-o em background e use a porta dele
# site estático:
web-serve ./dist --detach --port 4173
web-url-fetch http://localhost:4173
web-wait-page-load        # se avisar de pre-loader: web-wait 3  ou  web-wait 8 --until-hidden "#loader"
```

### 2.3 O loop (repita até zerar a lista de problemas)

```bash
# 1. Evidência estática em 3 viewports
web-screenshot --full-page --scroll-through
web-screenshot --viewport 1024x768 --full-page
web-screenshot --viewport 390x844 --full-page

# 2. Auditoria computada
web-scrap                  # contraste WCAG, escala tipográfica, grid de 4px, erros de console, paleta

# 3. Interações reais — TODOS os botões e links
web-control inventory      # lista cada interativo com seletor
web-control hover "<seletor>" --hold 500ms --screenshot     # estado hover de cada CTA
web-control click "<seletor>" --screenshot                  # modais, menus, accordions, cópia
web-control keypress Tab --repeat 8 --screenshot             # foco visível e ordem de tabulação
web-control keypress Escape                                   # fecha modais?

# 4. Movimento
web-record-frames --while "scroll-down 6000 --steps 120 --interval 50ms" --interval 0.25
web-record-frames --while "mousemove 200,300 1200,300 700,600 --steps 30" --interval 0.2  # efeitos magnéticos/cursor
```

**Leia cada imagem e spritesheet gerada.** Para cada uma, procure:

| Categoria | O que procurar |
|-----------|----------------|
| Alinhamento | bordas que não alinham ao grid, ícones desalinhados do texto, baseline torta |
| Espaçamento | valores fora da escala, grupos com espaço interno ≥ externo, seções coladas |
| Tipografia | linhas > 75 caracteres, viúvas em títulos, hifenização ruim, fonte fallback aparecendo |
| Responsivo | overflow horizontal, texto cortado, CTA abaixo da dobra no mobile, alvos < 44px |
| Contraste | falhas do `web-scrap` (ignore só as marcadas `incerto` após checar a imagem) |
| Estados | hover/focus/active ausentes ou sem feedback; foco invisível |
| Movimento | saltos entre frames, elementos aparecendo antes do reveal, layout shift, jank |
| Console | qualquer erro → corrigir, não ignorar |

### 2.4 Corrija e prove

- Corrija em lote os problemas encontrados, reabra (`web-url-fetch` recarrega) e **repita o loop**.
- Limite: 5 iterações. Se algo persistir, reporte ao usuário com evidência e hipótese.
- Critério de saída: **zero** erros de console, **zero** falhas de contraste confirmadas,
  nenhum overflow em 390px, todos os interativos com hover/focus verificados.

### 2.5 Entrega

Mostre ao usuário:
1. O que foi construído (seções, decisões de direção de arte e os módulos que as embasaram).
2. **Evidência visual:** caminhos dos screenshots finais (desktop/tablet/mobile) e da spritesheet de scroll.
3. O que o loop de QA encontrou e corrigiu (antes → depois).
4. Limitações conhecidas e próximos passos.

Feche a sessão do navegador com `web-close` (e `web-serve --stop --port <porta>`).
