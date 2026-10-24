# Workflow · creative-direction

<module_meta>
  <role>Ramo pessoal/portfólio e ambicioso da Fase 1. Transforma referências e intenção em 2–3 direções criativas defensáveis.</role>
  <enforcement_level>GUIDED — a ordem das etapas é obrigatória; o conteúdo das direções é autoral.</enforcement_level>
  <modes>curto (pessoal/portfólio, 3–5 perguntas) · completo (ambicioso, 6–8 perguntas + pesquisa de referências)</modes>
  <pairs_with>aesthetics/*.md · knowledge-base/04 · 12 · 16 · 17 · workflows/reference-teardown.md · templates/direcao-criativa.md</pairs_with>
</module_meta>

---

<step_1_questions>
## 1. Perguntas (uma mensagem)

### Modo curto — pessoal / portfólio
1. Quem é você em 3 adjetivos? (ex.: curiosa, precisa, brincalhona)
2. Qual trabalho mais te orgulha e por quê?
3. O que o visitante deve **fazer** (contratar, conversar, ver projetos) e **sentir**?
4. Nível de ousadia: 1 (sóbrio) · 2 (personalidade) · 3 (experimental).
5. Você tem referências? (URL, vídeo, print) — se sim, envie.

### Modo completo — ambicioso
As perguntas-núcleo do frontend-master §1.C **mais**:
6. Público que precisa se impressionar (júri, clientes enterprise, comunidade criativa)?
7. Dispositivo-alvo e orçamento de performance (ex.: "precisa rodar liso em notebook com GPU integrada").
8. Existe áudio, 3D ou vídeo próprio? Quem produz?
</step_1_questions>

---

<step_2_research>
## 2. Pesquisa e dissecação de referências

Para cada referência (do usuário ou 3–5 que você selecionar no Awwwards):

```bash
web-url-fetch <url> && web-wait-page-load
web-scrap                                   # aesthetic.primary/secondary, paleta, tipo, stack
web-motion --observe 3 --while "scroll-down 2500 --steps 50"
web-record-frames --while "scroll-down 6000 --steps 120" --interval 0.25
web-interactions --limit 8
```

Vídeo enviado? `media-frames <arquivo>` (e `--scenes 0.25` para cortes). Registre o DNA de cada referência com `workflows/reference-teardown.md` §2.
</step_2_research>

---

<step_3_directions>
## 3. Direções (use `templates/direcao-criativa.md`)

Proponha **2 ou 3 direções realmente diferentes** (nunca 3 variações da mesma ideia). Cada direção tem:

- **Nome e conceito em uma frase** (ex.: "Prancheta viva — o portfólio é o próprio processo").
- **Família estética** (+ secundária, se houver) e o playbook que a sustenta.
- **Referências** e o que extrair de cada uma (princípio, não asset).
- **Tokens iniciais:** tipografia (com eixo variável, se houver efeito de fonte), paleta, raio, sombra, durações e curvas.
- **Ápice visual:** onde acontece, como entra, como sai.
- **Assinatura de movimento:** 2–3 microinterações e 1 transição de seção.
- **Riscos e custo:** performance, acessibilidade, produção de assets.

Recomende **uma** e explique por quê. Espere a escolha. Não implemente as três.
</step_3_directions>

---

<signature_patterns>
## 4. Padrões de assinatura disponíveis em `library/`

| Padrão | Família típica | Arquivo |
|--------|----------------|---------|
| Hover Font (peso variável por proximidade do cursor) | editorial, gradiente, canvas | `library/motion/hover-font.js` |
| Text morph (partículas → texto) | imersivo, gradiente | `library/particles/text-morph.js` |
| Campo de gradiente líquido (mesh + grão) | gradiente-atmosferico | `library/gradients/mesh-field.glsl` · Paper Shaders |
| Biblioteca de blurs (12 tipos) | gradiente, marca | `library/gradients/blur-library.css` |
| Botão magnético | todas exceto modernista estrito | `library/motion/magnetic.js` |
| Rastro de pixels no grid | canvas-ludico | `library/motion/pixel-trail.js` |
| Canvas arrastável com física leve | canvas-ludico | `library/motion/draggable-canvas.js` |
| Card stack (seção vira card que se afasta) | canvas, editorial | `library/motion/card-stack.css` |
| Selo circular "role ·" girando | gradiente, editorial | `library/motion/scroll-badge.css` |
| Pre-loader "olá" com blob desfocado | gradiente, imersivo | `library/loaders/hello-preloader.css` |
</signature_patterns>

---

<self_evaluation>
## 5. Rubrica das direções (0–2 cada; mínimo 9/12)

| Critério | 2 = excelente |
|----------|---------------|
| Diferença real entre direções | conceitos, famílias e ápices distintos |
| Aderência à pessoa/marca | cada escolha remete às respostas da etapa 1 |
| Ápice visual | específico, com entrada e saída descritas |
| Viabilidade | orçamento de performance e assets resolvidos |
| Acessibilidade | fallback de movimento e contraste previstos |
| Originalidade | princípios extraídos, nada copiado |
</self_evaluation>
