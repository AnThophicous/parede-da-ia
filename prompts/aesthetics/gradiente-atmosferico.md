# Estética · gradiente-atmosferico — Campos de Cor, Grão e Vidro

<aesthetic_meta>
  <archetypes>ambicioso (principal) · pessoal · hero de corporativo (como acento)</archetypes>
  <use_when>Estúdios criativos, lançamentos, marcas de tecnologia/IA, música, moda — quando a primeira impressão deve ser emoção e atmosfera.</use_when>
  <avoid_when>Conteúdo denso de leitura sobre o campo; dispositivos-alvo muito fracos sem fallback.</avoid_when>
  <books>16 (cor) · 17 (shaders) · 12 · 13 · 14</books>
  <reference_studied>monopo.vn (monopo saigon), medido com a toolkit (out/2026): Nuxt + Vue + GSAP 3.7 (empacotado) + Locomotive Scroll + Three.js r131; canvas WebGL2 em tela cheia com 7 shaders formando um campo líquido de cor (verde-oliva, âmbar, preto) com grão, e uma esfera de vidro refratando o campo; pre-loader "hello saigon" sobre blob desfocado; fonte Roobert self-hosted, display de 225px peso 400 com letras isoladas em itálico ("Creat*i*ve stud*io*"); reveals de linha em máscara (translate3d 0 → ±150%); 800ms e 1250ms com cubic-bezier(0.19, 1, 0.22, 1) em 67% das transições; selo circular "scroll down" girando; navegação vertical à direita; 34MB de transferência e nenhuma regra de reduced-motion (o que não copiar).</reference_studied>
  <palette_parede>A landing do parede-da-ia aplica esta família em azul meia-noite + laranja.</palette_parede>
</aesthetic_meta>

---

<visual_dna>
## 1. DNA visual

| Eixo | Regra |
|------|-------|
| Campo de cor | gradiente procedural animado (mesh/fBm com domain warping) ou gradientes CSS desfocados em camadas; 3–5 cores; bandas luminosas sobre escuro |
| Textura | grão obrigatório (8–15% de opacidade) — esconde banding e dá materialidade |
| Objeto | opcional: esfera/forma de vidro que refrata o campo, ou metal líquido |
| Tipografia | display leve-médio (300–500) muito grande, branco quente; letras em itálico pontuais; corpo pequeno e espaçado |
| Layout | poucos elementos, muito ar; navegação discreta nas bordas |
| Cor (parede-da-ia) | `#050816` fundo · `#0b1638` / `#1b2a63` meia-noite · `#3a5bff` brilho frio · `#ff6a1a` laranja · `#ffb36b` âmbar · `#f4efe6` texto |
</visual_dna>

---

<motion_signature>
## 2. Movimento
"Fluido e cinematográfico": expo-out `cubic-bezier(0.19, 1, 0.22, 1)`, 800–1250ms nos reveals, 200–400ms no feedback. Campo de cor lento (velocidade 0.1–0.25) que reage ao cursor com lerp; transições de seção por máscara ou por mudança do campo.
</motion_signature>

---

<signature_moves>
## 3. Movimentos assinatura
1. **Pre-loader "olá"** com blob desfocado pulsando (≤ 1,8s). (`library/loaders/hello-preloader.css`)
2. **Hero com campo líquido** (Paper Shaders `MeshGradient` ou `library/gradients/mesh-field.glsl`) + grão.
3. **Título com letras em itálico** e reveal por linha em máscara.
4. **Esfera de vidro** (Three.js `MeshPhysicalMaterial` com `transmission`) ou metal líquido sobre o campo — apenas no desktop.
5. **Selo circular** "role · role ·" girando com o scroll. (`library/motion/scroll-badge.css`)
6. **Seções escuras** com campos menores (biblioteca de blurs) como "luzes" atrás de cards.
</signature_moves>

---

<tech_stack>
## 4. Stack e orçamento
Paper Shaders (React ou vanilla) para campos · Three.js só se houver objeto 3D · GSAP + ScrollTrigger · Lenis (com `prefers-reduced-motion` desligando) · campo renderizado a 0.5–0.75× DPR · pausa fora da viewport · fallback CSS (*Blurred* / *Irregular* da biblioteca) · orçamento ≤ 2,5MB de JS+shaders.
</tech_stack>

---

<accessibility_guard>
## 5. Guarda
Texto sempre com sombra/scrim ou em áreas escuras do campo; verificar contraste no pior frame; reduced-motion congela o campo (frame estático) e remove o vidro animado.
</accessibility_guard>

---

<anti_patterns>
## 6. Anti-padrões
34MB de assets · campo a 2× DPR · gradiente RGB "lamacento" entre complementares (interpole em OKLCH) · texto fino sobre bandas claras · sem fallback.
</anti_patterns>

---

<qa_rubric>
## 7. QA
`web-record-frames` → `pageFrames.fps` ≥ 50 em GPU integrada · `web-audit` ≥ 85 · `web-scrap` → `aesthetic.primary` gradiente-atmosferico/imersivo · contraste dos "incertos" conferido nas capturas.
</qa_rubric>
