# Workflow · reference-teardown

> Disseca uma referência (ex.: um Site of the Day do Awwwards) e a transforma num
> **briefing de direção de arte** acionável. Não é para copiar: é para entender *por que funciona*.
> Módulos de apoio: `05-refactoring-ui` · `04-100-things-designers`.

## Ética e direitos

- Extraia **princípios, sistemas e medidas** (escala, ritmo, easing, paleta), não assets.
- Imagens, vídeos, fontes pagas, modelos 3D e textos da referência pertencem aos autores.
  Só reutilize com licença explícita ou autorização do usuário para material dele.

## 1. Capturar

```bash
web-url-fetch <url>
web-wait-page-load                       # avisou de pre-loader? → web-wait 8 --until-hidden "<seletor>"
web-scrap                                # stack, fontes, paleta, efeitos, shaders, rede
web-screenshot                           # primeira dobra (o que se vê em 5s)
web-screenshot --full-page --scroll-through
web-record-frames --while "scroll-down 8000 --steps 160 --interval 50ms" --interval 0.25
web-control inventory --limit 40
web-control hover "<CTA principal>" --hold 700ms --screenshot
web-record-frames --while "mousemove 100,450 1340,450 720,120 720,800 --steps 40" --interval 0.15
web-screenshot --viewport 390x844 --full-page
web-close
```

Se `web-control scroll-down` responder `virtualScroll: true`, o site usa scroll virtual
(WebGL/transform): a página inteira vive na viewport — confie nas spritesheets, não no full-page.

## 2. Analisar (leia o JSON do scrap + todas as imagens)

Preencha esta ficha:

```yaml
referencia: <url>
stack: [framework, animação, scroll, 3D]          # de stack[]
hospedagem: <hosting[]>
tipografia:
  display: <família, pesos, tamanho máximo, tracking>
  texto: <família, tamanho, line-height>
  escala: <lista de tamanhos de fonts.scale>
  contraste_de_escala: <maior / menor tamanho>    # ex.: 144/12 = 12×
paleta:
  fundo: <colors.background>
  texto: <colors.text>
  acento: <colors.accent>
  monocromatica: <colors.isMonochrome>
grid_e_ritmo:
  espacamentos_dominantes: <layout.spacingScale>
  aderencia_4px: <layout.spacingOn4pxGrid>%
  raios: <layout.radii>
movimento:
  bibliotecas: <GSAP/Lenis/...>
  padroes_vistos_nos_frames: [reveal por linha, parallax, pin, scrub, troca de cor por seção, ...]
  cursor: <effects.customCursor>
  webgl: <media.canvases + número de shaders>
apice: <o momento mais memorável e em que seção>
convencoes_mantidas: [navegação, CTA, ...]      # o que é seguro e convencional
ousadias: [...]                                 # o que é surpreendente
riscos: [peso de rede, contraste, acessibilidade, mobile]
```

## 3. Sintetizar

Entregue ao usuário (ou à Fase 1 do `frontend-master`):

1. **Três ideias transferíveis** — princípios que funcionariam no projeto dele, com o porquê.
2. **O que evitar** — problemas medidos (ex.: 21 MB de rede, falhas de contraste, scroll-jacking).
3. **Tokens sugeridos** — escala tipográfica, espaçamentos, easing e durações inferidos dos frames.
4. **Evidência** — caminhos das imagens, spritesheets e JSON.
