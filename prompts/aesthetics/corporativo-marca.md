# Estética · corporativo-marca — A Marca Protagoniza

<aesthetic_meta>
  <archetypes>corporativo (principal) · pessoal com marca forte</archetypes>
  <use_when>Empresas com identidade colorida e voz própria (mobilidade, varejo, food, fintechs B2C, startups maduras) que querem ser lembradas sem abrir mão de conversão.</use_when>
  <avoid_when>Setores conservadores sem manual de marca expressivo; quando a cor de marca não passa em contraste e não há tom acessível.</avoid_when>
  <books>19 (marca) · 16 (cor) · 23 (mensagem) · 11 (microinterações) · 12 (animação)</books>
  <reference_studied>beetogreen.com — medido com a toolkit (out/2026): Nuxt + GSAP 3.15 + ScrollTrigger + Lenis + Lottie; Instrument Sans (texto) + Parkinsans (display arredondado); verde profundo #0c1e18, lima #e6ff55 e pastéis (creme, lilás, pêssego, menta); fita orgânica escura atravessando o hero sobre vídeo; botões pill; 600ms com cubic-bezier(0.32, 0.72, 0, 1) em 58% das transições; coluna de texto ~770px.</reference_studied>
</aesthetic_meta>

---

<visual_dna>
## 1. DNA visual

| Eixo | Regra |
|------|-------|
| Tipografia | display com personalidade (arredondada, geométrica ou condensada) para títulos + sans neutra para texto; títulos 56–120px peso 600–800 |
| Cor | cor de marca protagonista **em superfícies grandes** (seções, formas), tons pastel derivados para fundos de cards, um escuro profundo da marca para texto |
| Forma | uma **forma de marca** (fita, onda, blob, asterisco) reaparece como fio condutor; raios generosos e pills |
| Imagem | fotografia de pessoas reais usando o produto/serviço, com tratamento de cor coerente |
| Ícones | sistema próprio ou biblioteca consistente (ex.: Iconify/Lucide) na cor da marca |
</visual_dna>

---

<motion_signature>
## 2. Movimento
Linguagem "fluida e confiante": `cubic-bezier(0.32, 0.72, 0, 1)` (saída suave), durações 200 / 400 / 600–1000ms. A forma de marca **desenha ou desliza** com o scroll (scrub). Pre-loader curto (≤ 1,5s) com a forma/logo em Lottie ou SVG.
</motion_signature>

---

<signature_moves>
## 3. Movimentos assinatura
1. **Forma de marca atravessando o hero** (SVG path com `stroke-dashoffset` ou mask) sobre foto/vídeo.
2. **Título em cor de marca com asterisco/glifo** que leva a uma nota (prova).
3. **Cards pastel** com ilustração/ícone e hover que eleva + inclina 1–2°.
4. **Faixa de logos de clientes** (autorizados) em marquee lento.
5. **Simulador/calculadora** interativa (gera valor e lead).
</signature_moves>

---

<accessibility_guard>
## 4. Guarda de acessibilidade
Cores de marca vibrantes (lima, amarelo) **não servem para texto sobre branco**: use-as como fundo com texto escuro, ou crie um tom escurecido para texto. Texto sobre vídeo precisa de overlay e verificação manual (o `web-audit` marca como "incerto").
</accessibility_guard>

---

<anti_patterns>
## 5. Anti-padrões
Cor de marca em tudo (vira ruído) · forma de marca em todas as seções · vídeo de fundo pesado sem poster · Lottie de 1MB no pre-loader.
</anti_patterns>

---

<qa_rubric>
## 6. QA
`web-audit` ≥ 88 · contraste AA com as cores de marca verificado · `web-motion`: uma curva dominante · peso total ≤ 3MB na primeira visita.
</qa_rubric>
