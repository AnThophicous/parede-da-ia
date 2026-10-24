# Workflow · frontend-master (v0.2)

<module_meta>
  <role>Protocolo obrigatório para construir, redesenhar ou auditar qualquer interface.</role>
  <enforcement_level>STRICT — fases em ordem; nenhuma linha de código de UI antes do fim da Fase 1.</enforcement_level>
  <chain>Fase 0 Classificar → Fase 1 Elicitar → Fase 2 Construir → Fase 3 Verificar com os próprios olhos → Fase 4 Entregar</chain>
  <pairs_with>router.md §3 · aesthetics/README.md · templates/*</pairs_with>
</module_meta>

---

<phase_0_classify>
## Fase 0 — Classificar (1 mensagem, sem perguntas ainda)

1. Leia o terreno sem perguntar o que dá para descobrir: `package.json`, framework, sistema de estilos, tokens existentes, conteúdo real, marca (logo, fontes, cores).
2. Determine o **arquétipo** (router §3): corporativo · pessoal/portfólio · ambicioso.
3. Se houver referência:
   - URL → `web-url-fetch` + `web-wait-page-load` + `web-scrap` (+ `web-motion --observe 3`).
   - Vídeo → `media-frames <arquivo>` e leia as folhas de contato.
   - Print → leia a imagem e descreva o DNA visual em 5 linhas.
4. Anuncie o bloco de contrato (router §8) e siga para o ramo da Fase 1.
</phase_0_classify>

---

<phase_1_elicit>
## Fase 1 — Elicitação (ramificada por arquétipo)

### 1.A Corporativo → `workflows/corporate-briefing.md`
Briefing completo, escolha de estética entre as famílias corporativas e perguntas extras de negócio, conteúdo, conversão, compliance e operação. **Mais perguntas, menos suposições.**

### 1.B Pessoal / portfólio → `workflows/creative-direction.md` (modo curto)
Foco em personalidade: quem é a pessoa, 3 adjetivos, o projeto que mais a orgulha, nível de ousadia, o que o visitante deve sentir.

### 1.C Ambicioso → `workflows/creative-direction.md` (modo completo)
Perguntas-núcleo, sempre feitas em UMA mensagem numerada e com opções sugeridas:

1. **Objetivo central e ápice visual.** O que o visitante precisa fazer? Qual é o momento "uau" e onde ele acontece?
2. **Assets.** (a) gerados por código (SVG, canvas, shaders, Three.js, Paper Shaders); (b) fornecidos pelo usuário; (c) extraídos de uma referência (só com autorização e respeitando direitos); (d) gerados por IA de imagem (use `knowledge-base/09` §prompts de imagem); (e) placeholders marcados.
3. **Referências.** O usuário tem URLs/vídeos ou prefere que você pesquise no Awwwards e proponha **2 a 3 direções**?
4. **Restrições.** Stack obrigatória, marca, prazo, orçamento de performance (dispositivo-alvo!), acessibilidade, idiomas, SEO, hospedagem.

### Regra de saída da Fase 1
Feche com um **plano aprovado**: seções, tokens iniciais, stack, estratégia de assets, ápice visual, critérios de aceite. Peça um "ok" explícito.
</phase_1_elicit>

---

<phase_2_build>
## Fase 2 — Construir em fatias (tracer bullet)

1. **Tokens primeiro** (CSS custom properties ou `@theme` do Tailwind): cor, tipo, espaço, raio, sombra, **movimento** (durações e curvas nomeadas).
2. **Layout bruto em escala de cinza** com conteúdo real → hierarquia `[05]`, grid `[15]`, tipografia `[14]`.
3. **Cor e textura** `[16]` → depois **movimento** `[12][13]` → depois **microinterações** `[11][18]`.
4. **WebGL/shaders por último** `[17]`, sempre com fallback estático e `prefers-reduced-motion`.
5. Reaproveite receitas de `library/` (gradientes, hover font, magnético, text morph, pixel trail, card stack) em vez de reinventar.

Proibido:
- animar antes de a página funcionar estaticamente;
- efeito sem propósito (cada movimento responde: orienta, confirma, dá continuidade ou encanta no ápice?);
- bloquear o conteúdo atrás de pre-loader por mais de 2,5s.
</phase_2_build>

---

<phase_3_verify>
## Fase 3 — Loop autônomo de QA visual (repita até passar nos portões do router §7)

```bash
# 0. servir e abrir o próprio trabalho
web-serve ./dist --detach --port 4173        # ou o dev server do projeto
web-url-fetch http://localhost:4173 && web-wait-page-load   # pre-loader? web-wait 6 --until-hidden "#loader"

# 1. evidência estática em 3 viewports
web-screenshot --viewports desktop,tablet,mobile --full-page --scroll-through

# 2. auditoria computada (nota 0–100 e veredito)
web-audit --viewports desktop,tablet,mobile

# 3. microinterações de TODOS os interativos relevantes
web-interactions --limit 15

# 4. movimento: coreografia de scroll + vocabulário de curvas + jank
web-record-frames --while "scroll-down 6000 --steps 120 --interval 50ms" --interval 0.25
web-motion --observe 3 --while "scroll-down 2000 --steps 40"

# 5. regressão visual entre iterações
web-diff antes.png depois.png
```

Para cada imagem/spritesheet lida, procure:

| Categoria | Sinais |
|-----------|--------|
| Alinhamento | bordas fora do grid, ícone desalinhado da linha de base |
| Espaçamento | valores fora da escala, grupos com espaço interno ≥ externo |
| Tipografia | > 75 caracteres por linha, viúvas, fonte fallback aparecendo, hover font "pulando" layout |
| Cor | contraste do `web-audit`, acento usado em excesso (> 10% da tela no corporativo) |
| Responsivo | overflow horizontal, CTA abaixo da dobra no mobile, alvos < 24px |
| Movimento | saltos entre frames, layout shift, jank (`pageFrames.longFrames`), reveal antes do scroll |
| Estados | hover/foco/active ausentes ou sem transição |

Limite: 5 iterações. Persistiu? Reporte com evidência e hipótese.
</phase_3_verify>

---

<phase_4_deliver>
## Fase 4 — Entrega

Use `templates/relatorio-entrega.md`: o que foi feito, decisões de direção de arte com os módulos que as embasaram, evidências (caminhos das capturas finais e da spritesheet), nota do `web-audit`, o que o loop corrigiu (antes → depois) e limitações conhecidas. Encerre com `web-close` e `web-serve --stop --port <porta>`.
</phase_4_deliver>
