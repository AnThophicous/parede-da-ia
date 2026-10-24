# Estética · canvas-ludico — A Prancheta Viva do Portfólio

<aesthetic_meta>
  <archetypes>pessoal / portfólio (principal) · estúdios pequenos</archetypes>
  <use_when>Portfólios de designers, devs criativos, product designers e estúdios que querem mostrar processo, ferramentas e personalidade — "o site é o meu espaço de trabalho".</use_when>
  <avoid_when>Corporativo tradicional; públicos que precisam de leitura linear e rápida (o canvas exige curiosidade).</avoid_when>
  <books>18 (significantes) · 11 (microinterações) · 12 (animação) · 14 (tipo) · 22 (acessibilidade)</books>
  <reference_studied>Portfólio "sarah." enviado em vídeo e lido com media-frames (out/2026): canvas creme com grid de prancheta; wordmark gigante em sans geométrica pesada dentro de uma caixa de seleção estilo Figma (8 alças); cursores multiplayer coloridos com rótulos de papéis ("ui designer", "creative developer", "frontend developer"); ícones de ferramentas em tiles; balão de comentário; cards inclinados (laptop com imagem, cartão "portfolio", cartão de código); tudo arrastável; rastro de células do grid seguindo o cursor; ao rolar, o canvas vira um card arredondado que se afasta e revela uma seção escura com "NOT JUST ANOTHER DEVELOPER." em caixa-alta fina cinza com ponto final laranja-avermelhado e projetos flutuando inclinados.</reference_studied>
</aesthetic_meta>

---

<visual_dna>
## 1. DNA visual

| Eixo | Regra |
|------|-------|
| Fundo | papel/creme (`#efebe5`–`#f4f1ec`) com **grid de prancheta** (linhas 1px a 4–6% de opacidade, células 48–64px) |
| Tipografia | wordmark em sans geométrica pesada (800–900), 12–18vw, tracking apertado; UI em sans neutra pequena; código em mono |
| Cor | neutros quentes + **5–6 cores de sticker saturadas** (verde, roxo, magenta, ciano, laranja) usadas em pequenas áreas: cursores, tags, ícones |
| Objetos | cards brancos com sombra suave e rotação de −6° a +6°; mockups de dispositivo; tiles de ícones com raio 12px |
| Metáforas | ferramenta de design: caixa de seleção com alças, comentário com avatar, toggle ("AI mode"), cursores multiplayer |
| Transição | seção escura com tipografia enorme fina (300) em cinza e um único acento colorido |
</visual_dna>

---

<motion_signature>
## 2. Movimento
"Elástico e brincalhão": spring leve (overshoot 1.2–1.5), 180 / 350 / 700ms. Cursores multiplayer derivam em trajetórias suaves (ruído) e "clicam" de vez em quando. Arrastar com inércia curta e leve rotação na direção do movimento.
</motion_signature>

---

<signature_moves>
## 3. Movimentos assinatura (com receitas em `library/`)
1. **Wordmark selecionável:** caixa de seleção com alças ao redor do nome; arrastável. (`library/motion/draggable-canvas.js`)
2. **Rastro de pixels:** células do grid acendem sob o cursor e esmaecem em 400–700ms. (`library/motion/pixel-trail.js`)
3. **Cursores multiplayer** com rótulos de papéis/skills, cada um numa cor de sticker.
4. **Stickers e cards arrastáveis** com física leve; posição salva no `localStorage`.
5. **Card stack:** o canvas inteiro vira card (scale 1 → 0.9, raio 0 → 32px) e revela a seção seguinte. (`library/motion/card-stack.css`)
6. **Seção manifesto escura** com título fino gigante e projetos flutuando em perspectiva.
</signature_moves>

---

<accessibility_guard>
## 4. Guarda de acessibilidade
- Todo conteúdo arrastável também é **acessível em lista linear** (ordem do DOM lógica; projetos como links normais).
- `cursor: grab/grabbing`, dica "arraste" na primeira visita, botão "organizar" que reseta posições.
- Rastro de pixels e cursores fictícios: `aria-hidden`, desligados em touch e `prefers-reduced-motion`.
- Cursores fictícios nunca imitam o cursor real a ponto de confundir.
</accessibility_guard>

---

<anti_patterns>
## 5. Anti-padrões
Canvas sem saída (visitante não acha os projetos) · elementos que caem fora da tela ao arrastar · 15 stickers (vira bagunça) · cores de sticker em textos longos.
</anti_patterns>

---

<qa_rubric>
## 6. QA
`web-control drag "<card>" +240,+120` e captura · `web-interactions` nos cards (cursor grab, sombra) · `web-record-frames --while "mousemove ..."` para o rastro · `web-audit` mobile: canvas vira layout empilhado sem overflow · `web-scrap`: `aesthetic.primary` = canvas-ludico.
</qa_rubric>
