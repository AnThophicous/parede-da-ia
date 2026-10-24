# Estética · imersivo-webgl — Cena Viva, Partículas e Física

<aesthetic_meta>
  <archetypes>ambicioso (principal)</archetypes>
  <use_when>Estúdios 3D/criativos, lançamentos de produto físico ou tecnológico, campanhas e experiências que disputam prêmios.</use_when>
  <avoid_when>Corporativo tradicional, sites de conteúdo, públicos com dispositivos fracos sem fallback, prazos curtos.</avoid_when>
  <books>17 (shaders) · 12 (animação) · 13 · 20 (Doherty) · 22</books>
  <reference_studied>lusion.co, medido com a toolkit (out/2026): Astro + Three.js 158; WebGL2 em tela cheia com ~80 shaders; objetos 3D (formas azuis, cinza e pretas) que reagem ao cursor e ao scroll; scroll virtual (documento do tamanho da viewport); fontes Aeonik + IBM Plex Mono + LusionMono; azul #0016ec e lima #c1ff00 como acentos sobre branco; 21MB de transferência.</reference_studied>
</aesthetic_meta>

---

<visual_dna>
## 1. DNA visual
| Eixo | Regra |
|------|-------|
| Cena | um objeto/sistema 3D protagonista (formas, partículas, fluido) com iluminação coerente |
| Tipografia | grotesca limpa + mono técnica; texto como camada HTML acima do canvas (acessível) |
| Cor | fundo neutro (branco ou meia-noite) + 1–2 acentos saturados presentes na cena |
| Interação | cursor e scroll são **controles da cena** (física, rotação, morph) |
</visual_dna>

---

<signature_moves>
## 2. Movimentos assinatura
1. **Text morph:** partículas que se reorganizam em palavras conforme o scroll (`library/particles/text-morph.js`).
2. **Objeto com física** reagindo ao cursor (molas, colisões simples).
3. **Transições de seção dentro da cena** (a câmera viaja em vez de a página rolar).
4. **Pós-processamento leve** (bloom, grão, aberração cromática sutil) — só se o orçamento permitir.
</signature_moves>

---

<tech_stack>
## 3. Stack e orçamento (STRICT)
Three.js (ou R3F) · GSAP para timelines da câmera · carregamento progressivo (Draco/KTX2) · `devicePixelRatio` limitado a 1.5 · cena pausa fora da viewport · **fallback completo** (imagem/vídeo + texto) para sem-WebGL, reduced-motion e dispositivos fracos · alvo: LCP ≤ 2,5s com o texto HTML, cena carrega depois.
</tech_stack>

---

<anti_patterns>
## 4. Anti-padrões
Conteúdo só dentro do canvas (inacessível e invisível ao SEO) · 20MB antes do primeiro frame · scroll virtual sem indicação · cena a 2× DPR em notebook.
</anti_patterns>

---

<qa_rubric>
## 5. QA
`web-record-frames` → fps e jank · `web-audit` (texto HTML acessível, LCP) · `web-url-fetch --reduced-motion` → fallback aparece · `web-scrap` → shaders e `aesthetic.primary` imersivo-webgl.
</qa_rubric>
