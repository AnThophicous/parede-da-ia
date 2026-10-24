# Estética · editorial-brutalista — Contraste Tipográfico Extremo

<aesthetic_meta>
  <archetypes>pessoal / portfólio · ambicioso · estúdios</archetypes>
  <use_when>Estúdios, agências, designers e projetos culturais que querem autoridade e atitude com custo visual baixo; ótimo quando o conteúdo é texto e trabalho.</use_when>
  <avoid_when>Públicos que precisam de calor e acolhimento (saúde, infantil); produtos com muita UI funcional.</avoid_when>
  <books>14 (tipo) · 15 (grid) · 05 · 12</books>
  <reference_studied>parede-da-ia v0.1 (landing monocromática) e a família Cuberto/estúdios suíços: preto e branco puros, display gigante com serifa itálica como contraponto, mono como voz técnica, linhas finas, botões circulares magnéticos, cursor com mix-blend difference, esfera em dithering 1-bit.</reference_studied>
</aesthetic_meta>

---

<visual_dna>
## 1. DNA visual

| Eixo | Regra |
|------|-------|
| Tipografia | display sans pesada 12–20vw, tracking −0.05 a −0.07em; serifa itálica para palavras-chave; mono para metadados |
| Cor | monocromático (preto, branco e 6–8 cinzas) ou monocromático + **um** acento de alto impacto |
| Grid | assimetria intencional sobre grid rigoroso; numeração de seções "(01)", linhas de 1px |
| Forma | cantos retos; círculos só para botões e cursor |
| Textura | grão sutil; dithering como imagem |
</visual_dna>

---

<motion_signature>
## 2. Movimento
"Seco e gráfico": reveals em máscara por linha (expo-out, 1–1.2s), marquee com inércia do scroll, botões magnéticos, cursor que vira rótulo. Nada de "fofura".
</motion_signature>

---

<signature_moves>
## 3. Movimentos assinatura
1. **Título gigante com Hover Font** (peso cresce perto do cursor). (`library/motion/hover-font.js`)
2. **Lista editorial** (01–10) com linhas que invertem cor no hover.
3. **Botão circular magnético** com preenchimento que sobe. (`library/motion/magnetic.js`)
4. **Imagem em dithering 1-bit** ou campo de cor *Banding Gradient* da biblioteca.
5. **Rodapé com wordmark** de largura total.
</signature_moves>

---

<anti_patterns>
## 4. Anti-padrões
Brutalismo como desculpa para ilegibilidade · contraste baixo "estiloso" · texto corrido em caixa-alta · cursor customizado escondendo o cursor real em formulários.
</anti_patterns>

---

<qa_rubric>
## 5. QA
`web-scrap`: `isMonochrome` (se a direção for P&B) e contraste AA · `web-audit` ≥ 88 · CLS ≤ 0,1 com a Hover Font ativa.
</qa_rubric>
