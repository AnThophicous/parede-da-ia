# Biblioteca de blurs — 12 Tipos de Gradiente para Campos de Cor

<module_meta>
  <role>Vocabulário e receitas de gradientes para direção de arte. Recurso de referência para agentes — não é conteúdo de landing.</role>
  <enforcement_level>GUIDED — escolha o tipo pelo efeito emocional; interpole em OKLab/OKLCH; sempre com grão.</enforcement_level>
  <code>library/gradients/blur-library.css (classes .blur--*) · library/gradients/mesh-field.glsl · prévia: library/gradients/index.html</code>
  <pairs_with>knowledge-base/16 (cor) · 17 (shaders) · aesthetics/gradiente-atmosferico.md</pairs_with>
</module_meta>

---

<catalog>
## 1. Os 12 tipos (taxonomia popularizada pelo Awwwards)

| Tipo | Classe | Sensação | Melhor uso |
|------|--------|----------|------------|
| Irregular | `.blur--irregular` | orgânico, vivo | fundos de hero, campos atmosféricos (animável com `.blur--drift`) |
| Radial Ramp | `.blur--radial-ramp` | foco, pôr do sol, energia | atrás de um título central ou CTA final |
| Blurred | `.blur--blurred` | suave, premium | cards de produto, SaaS (atrás da UI) |
| Edgy | `.blur--edgy` | gráfico, ousado | marcas jovens, campanhas |
| Landscape | `.blur--landscape` | horizonte, calma | seções de transição, imagens de capa |
| Multicolor | `.blur--multicolor` | festivo, diverso | eventos, comunidades |
| Retro | `.blur--retro` | nostalgia, espectro | música, games (use com moderação) |
| Duotone | `.blur--duotone` | limpo, corporativo | faixas de destaque no corporativo-modernista |
| Tricolor | `.blur--tricolor` | equilíbrio, sofisticação | identidades com três cores |
| Volume Mesh | `.blur--volume-mesh` | objeto, profundidade | esferas/orbes decorativos, ícones grandes |
| Banding Gradient | `.blur--banding` | gráfico, 8-bit, editorial | editorial-brutalista, pôsteres |
| Gradient / Image | `.blur--image` | foto tingida pela marca | coesão de fotografias diversas |
</catalog>

---

<rules>
## 2. Regras

1. **Paleta por variáveis** (`--c1` fundo · `--c2` frio/meio · `--c3` acento · `--c4` luz): o mesmo tipo serve qualquer marca.
2. **Interpolação perceptual:** `in oklab`/`in oklch` evita o cinza lamacento entre complementares (azul × laranja).
3. **Grão sempre** (8–12%): esconde banding e dá materialidade.
4. **Campo é atmosfera, não figura:** ocupa o fundo, sangra para fora do enquadramento e nunca disputa com o texto.
5. **Texto sobre campo:** confira contraste no pior ponto (o `web-audit` marca como "incerto").
6. **Animado = lento:** deriva de 15–25s, ou shader com velocidade 0.1–0.25; reduced-motion congela.
7. **WebGL só quando o CSS não basta** (campo líquido reativo ao cursor → `mesh-field.glsl` ou Paper Shaders `MeshGradient`).
</rules>

---

<qa>
## 3. QA
`web-screenshot --dpr 2` para checar banding · `web-record-frames` para checar fluidez do campo animado · `web-audit` para contraste do texto sobre o campo.
</qa>
