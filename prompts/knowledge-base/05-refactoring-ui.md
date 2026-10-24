# 05 · Refactoring UI — Hierarquia, Espaço, Tipo, Cor e Profundidade como Sistema

<module_meta>
  <source>Refactoring UI — Adam Wathan & Steve Schoger (destilação autoral)</source>
  <router_trigger>Carregar em QUALQUER construção ou correção de interface. É o módulo mais usado do router.</router_trigger>
  <enforcement_level>STRICT — valores fora das escalas definidas são bugs, não estilo.</enforcement_level>
  <pairs_with>14 (tipografia) · 15 (grid) · 16 (cor) · 21 (tokens)</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axiomas

1. **Função antes da moldura.** Desenhe a funcionalidade (o formulário, o card) antes do layout da página.
2. **Comece em escala de cinza.** A hierarquia precisa funcionar só com tamanho, peso e espaço; cor vem depois.
3. **Sistemas antes de pixels:** escala de espaçamento, escala tipográfica, paleta com tons, sombras e raios definidos **antes** de compor telas.
4. **Ênfase também se faz tirando ênfase.** Rebaixe o secundário (cinza mais claro, peso menor) em vez de só aumentar o principal.
5. **Hierarquia visual ≠ semântica.** Um `h1` pode ser pequeno se não for o foco visual — a tag serve à acessibilidade, o estilo serve ao olho.
6. **Comece com espaço demais** e vá retirando. Espaço **entre** grupos > espaço **dentro** dos grupos.
7. **Texto corrido entre 45 e 75 caracteres por linha.** Não estique conteúdo para preencher a tela.
8. **Paleta real tem muitos tons:** 8–10 cinzas e 5–10 tons por cor de marca/estado, definidos por luminosidade e saturação (OKLCH/HSL), nunca por opacidade.
9. **Luz vem de cima.** Elevação = borda superior mais clara + sombra embaixo; sombras realistas têm duas camadas.
10. **Bordas são a ferramenta mais fraca de separação.** Prefira espaço, mudança de fundo ou sombra.
</core_axioms>

---

<scales>
## 2. Escalas canônicas (ponto de partida)

```css
:root {
  /* espaço (múltiplos de 4, progressão não linear) */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-5: 24px;
  --space-6: 32px; --space-7: 48px; --space-8: 64px; --space-9: 96px; --space-10: 128px; --space-11: 192px;
  /* tipo (razão ~1.25 no texto, saltos maiores no display) */
  --text-xs: 12px; --text-sm: 14px; --text-base: 16px; --text-lg: 18px; --text-xl: 20px; --text-2xl: 24px;
  --text-3xl: 30px; --text-4xl: 36px; --text-5xl: 48px; --text-6xl: 60px; --text-7xl: 72px; --text-display: clamp(64px, 12vw, 220px);
  /* raio e sombra */
  --radius-sm: 4px; --radius-md: 8px; --radius-lg: 16px; --radius-pill: 999px;
  --shadow-1: 0 1px 2px rgb(0 0 0 / .06), 0 1px 1px rgb(0 0 0 / .04);
  --shadow-3: 0 10px 24px -6px rgb(0 0 0 / .18), 0 2px 6px rgb(0 0 0 / .08);
  --shadow-5: 0 40px 80px -20px rgb(0 0 0 / .35), 0 8px 24px rgb(0 0 0 / .12);
}
```
Line-height inversamente proporcional ao tamanho (corpo 1.5–1.7; display 0.85–1.1). Tracking negativo em títulos grandes (−0.02 a −0.06em); positivo em caixa-alta pequena (+0.06 a +0.14em). Números em tabela com `tabular-nums`.
</scales>

---

<agent_traps>
## 3. Trava anti-"tudo grita igual"

- **Proibido** três níveis de texto com o mesmo peso, tamanho e cor.
- **Proibido** cinza sobre fundo colorido (use um tom da mesma matiz).
- **Proibido** comunicar estado só por cor (combine com ícone, texto ou forma).
- **Proibido** ampliar ícone de 16px para 48px; use contêiner com fundo.
- **Proibido** botões de mesmo peso disputando atenção: primário sólido, secundário contorno/tonal, terciário link.
- **Estados vazios** são a primeira impressão de muitas telas: ilustração/ícone + explicação + ação.
</agent_traps>

---

<review_checklist>
## 4. Rubrica (verificável)

| Critério | Comando |
|----------|---------|
| Espaçamentos na escala (≥ 85% no grid de 4px) | `web-scrap` → `layout.spacingOn4pxGrid` |
| Tamanhos de fonte da escala (≤ 8 tamanhos distintos) | `web-scrap` → `fonts.scale` |
| Contraste AA em 100% dos textos | `web-audit` / `web-scrap` → `contrast` |
| Estados hover/foco/active/disabled definidos | `web-interactions` |
| A tela funciona em escala de cinza | aplique `filter: grayscale(1)` via `web-eval "document.documentElement.style.filter='grayscale(1)'"` e capture |
| Raios e sombras de um conjunto pequeno | `web-tokens` → grupos `radius` e `shadow` |
</review_checklist>

---

<few_shot>
## 5. Exemplo — card sem e com hierarquia
```css
/* ruim: tudo grita igual */
.card h3, .card p, .card span { font: 700 20px/1.2 var(--font-sans); color: #000; }

/* bom: primário, secundário, terciário */
.card h3   { font: 600 20px/1.25 var(--font-sans); letter-spacing: -0.01em; color: var(--gray-900); }
.card p    { font: 400 16px/1.6 var(--font-sans); color: var(--gray-600); }
.card span { font: 500 12px/1 var(--font-sans); letter-spacing: .08em; text-transform: uppercase; color: var(--gray-500); }
```
</few_shot>
