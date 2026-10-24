# Estética · corporativo-modernista — Suíço, Econômico, Confiável

<aesthetic_meta>
  <archetypes>corporativo (principal) · pessoal sóbrio</archetypes>
  <use_when>Serviços profissionais, setor público, saúde, finanças, jurídico, indústria, consultorias — quando confiança e clareza valem mais que espetáculo.</use_when>
  <avoid_when>Lançamentos criativos, portfólios que precisam de personalidade forte, campanhas que dependem de emoção.</avoid_when>
  <books>15 (grid) · 05 (hierarquia) · 14 (tipo) · 03 (usabilidade) · 23 (mensagem)</books>
</aesthetic_meta>

---

<visual_dna>
## 1. DNA visual

| Eixo | Regra |
|------|-------|
| Tipografia | uma grotesca neutra com 4–6 pesos (Inter, Instrument Sans, Geist, Suisse-like); display 48–96px peso 500–600; corpo 16–18px; tracking negativo leve nos títulos |
| Cor | fundo claro (branco ou off-white frio), texto quase-preto, **um** acento da marca em ≤ 10% da área; cinzas em 8–10 tons |
| Grid | 12 colunas, contêiner 1200–1440px, texto em 6–7 colunas (640–720px), ritmo vertical em múltiplos de 8 |
| Forma | raios pequenos (0–8px), bordas finas 1px, sombras quase inexistentes |
| Imagem | fotografia documental real, recortes retos, legendas; ícones de linha consistentes |
| Textura | nenhuma, ou papel muito sutil |
</visual_dna>

---

<motion_signature>
## 2. Assinatura de movimento

Linguagem "preciso e calmo": `ease-out-quart` / `ease-in-out-quart`, durações **150 / 300 / 600ms**. Reveals discretos (fade + 12px), sem parallax, sem cursor customizado. Microinteração assinatura: sublinhado que cresce da esquerda em links e setas que deslizam 3px no hover.
</motion_signature>

---

<signature_moves>
## 3. Movimentos assinatura

1. **Hero tipográfico:** título grande alinhado ao grid, subtítulo literal, CTA sólido — e muito espaço em branco.
2. **Números como imagem:** métricas reais em display (tabular-nums) com legenda curta.
3. **Índice editorial:** lista numerada de serviços com linhas finas e hover que revela uma frase.
4. **Momento de destaque permitido (um):** uma faixa de cor da marca em largura total, ou um campo de cor estático (biblioteca de blurs: *Duotone* ou *Radial Ramp*) atrás do hero.
5. **Rodapé como sitemap:** colunas organizadas, contato visível, endereço real.
</signature_moves>

---

<tech_stack>
## 4. Stack recomendada
HTML/CSS (ou React + Tailwind + shadcn) · fontes self-hosted · sem bibliotecas de scroll · animações em CSS transitions ou WAAPI · imagens AVIF/WebP com width/height.
</tech_stack>

---

<anti_patterns>
## 5. Anti-padrões
Gradiente roxo genérico · 3 cards de "benefícios" com ícones aleatórios · carrossel no hero · stock photo de aperto de mão · animação em tudo · CTA fantasma de baixo contraste.
</anti_patterns>

---

<qa_rubric>
## 6. QA
`web-audit` ≥ 90 · `web-scrap`: `spacingOn4pxGrid` ≥ 85%, ≤ 2 cores vívidas, `aesthetic.primary` = corporativo-modernista · `web-motion`: nenhuma duração > 700ms · LCP ≤ 2,5s.
</qa_rubric>
