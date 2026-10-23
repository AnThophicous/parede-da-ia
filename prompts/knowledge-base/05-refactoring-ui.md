# 05 · Refactoring UI — design tático para devs

> Fonte: *Refactoring UI*, Adam Wathan & Steve Schoger. Destilação autoral para agentes.
> **Carregue quando:** montar ou corrigir qualquer interface — hierarquia, espaçamento,
> tipografia, cor, sombras, estados vazios. É o módulo mais usado do router.

## 1. Comece pela função, não pela moldura

- Desenhe a **funcionalidade** (um formulário, um card) antes do layout da página.
- Comece em **escala de cinza**: obrigue a hierarquia a funcionar só com tamanho, peso e espaço.
- Não desenhe tudo de uma vez: entregue uma versão simples e itere.
- Defina **sistemas** antes de pixels: escala de espaçamento, escala tipográfica, paleta, sombras, raios.

## 2. Hierarquia é tudo

- Nem todo elemento é igual. Classifique: **primário, secundário, terciário**.
- Ênfase também se faz **tirando ênfase** do resto (cinza mais claro, peso menor), não só aumentando o principal.
- Use **peso e cor** para hierarquia antes de recorrer a tamanho; texto secundário em cinza, não menor.
- Rótulos são último recurso: `12 vagas` comunica mais que `Vagas: 12`.
- Separe hierarquia visual de semântica: um `h1` pode ser pequeno se não for o foco visual.
- Botões: primário sólido de alto contraste; secundário contorno/tom suave; terciário como link.

## 3. Espaçamento e layout

- **Comece com espaço demais** e vá removendo. Interfaces apertadas parecem amadoras.
- Use uma **escala de espaçamento** não linear, ex.: `4 8 12 16 24 32 48 64 96 128 192 256`.
- Espaço **entre** grupos deve ser claramente maior que o espaço **dentro** dos grupos.
- Não estique conteúdo para preencher a tela: texto corrido entre **45–75 caracteres** por linha.
- Nem tudo precisa ser fluido: sidebars e cards podem ter largura fixa; o que sobra flexiona.
- Grids de 12 colunas são uma ferramenta, não uma lei.

## 4. Tipografia

- Escala tipográfica definida (ex.: `12 14 16 18 20 24 30 36 48 60 72 96 128`), sem valores avulsos.
- Altura de linha **inversamente proporcional** ao tamanho: corpo ~1.5–1.7; títulos grandes ~1.0–1.15.
- **Letter-spacing:** apertar levemente títulos grandes (−0.02em a −0.04em); abrir caixa-alta pequena (+0.05em a +0.12em).
- Alinhe à esquerda texto de mais de duas linhas; centralize só blocos curtos.
- Números em tabelas: alinhados à direita e com `font-variant-numeric: tabular-nums`.
- Prefira fontes com 5+ pesos e boa altura-x para interface; reserve as expressivas para display.

## 5. Cor

- Paleta real precisa de **muitos tons**: 8–10 tons de cinza e 5–10 de cada cor de marca/estado.
- Defina tons por **luminosidade e saturação** (HSL/OKLCH), não por "clarear com opacidade".
- Cinzas ficam mais ricos com uma leve temperatura (azulado = frio, amarelado = quente).
- Texto sobre fundo colorido: use um tom da mesma matiz, não cinza ou branco com opacidade.
- **Contraste mínimo WCAG:** 4.5:1 texto normal, 3:1 texto grande (≥24px ou ≥18.66px bold).
- Nunca use só cor para comunicar estado — combine com ícone, texto ou forma.

## 6. Profundidade

- Luz vem de cima: elementos elevados têm borda superior mais clara e sombra embaixo.
- Sistema de **5 elevações** de sombra (botão → card → dropdown → modal → toast).
- Sombras realistas combinam duas camadas: uma grande e difusa + uma curta e escura.
- Sobreponha elementos (cards que invadem a seção seguinte) para criar camadas.
- Bordas são a ferramenta mais fraca de separação: prefira espaço, fundo ou sombra.

## 7. Acabamento

- **Estados vazios** são a primeira impressão de muitas telas: ilustração + explicação + ação.
- Substitua bullets por ícones, aspas por elementos gráficos, bordas por acentos coloridos curtos.
- Fundos não precisam ser chapados: gradiente sutil, padrão repetido, ruído/grain.
- Imagens: controle o contraste do texto sobreposto (overlay, escurecer, desfocar ou caixa de texto).
- Ícones têm tamanho nativo: não amplie ícones de 16px para 48px; use um contêiner.

## Checklist de revisão

- [ ] A tela funciona em escala de cinza?
- [ ] Todos os espaçamentos pertencem à escala (verifique `web-scrap` → `layout.spacingOn4pxGrid`)?
- [ ] Todos os tamanhos de fonte pertencem à escala (`fonts.scale`)?
- [ ] Cada seção tem um único elemento primário?
- [ ] Texto corrido entre 45–75 caracteres por linha?
- [ ] Contraste AA em todos os textos (`web-scrap` → `contrast.issues`)?
- [ ] Estados hover/focus/active/disabled/loading/empty definidos e testados?
- [ ] Sombras e raios vêm de um conjunto pequeno e consistente?

## Exemplo — card sem hierarquia → com hierarquia

```css
/* antes: tudo grita igual */
.card h3   { font-size: 20px; font-weight: 700; color: #000; }
.card p    { font-size: 20px; font-weight: 700; color: #000; }
.card span { font-size: 20px; font-weight: 700; color: #000; }

/* depois: primário, secundário, terciário */
.card h3   { font-size: 20px; font-weight: 600; color: var(--gray-900); letter-spacing: -0.01em; }
.card p    { font-size: 16px; font-weight: 400; color: var(--gray-600); line-height: 1.6; }
.card span { font-size: 12px; font-weight: 500; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.08em; }
```
