# Workflow · reference-teardown (v0.2)

<module_meta>
  <role>Disseca uma referência (URL, vídeo ou print) e a converte em DNA visual acionável. Entender por que funciona — nunca copiar.</role>
  <enforcement_level>STRICT quanto a direitos: extraia princípios, sistemas e medidas; nunca assets de terceiros sem licença.</enforcement_level>
  <pairs_with>knowledge-base/05 · 12 · 16 · 17 · aesthetics/*.md · workflows/motion-teardown.md</pairs_with>
</module_meta>

---

<capture>
## 1. Capturar

### URL
```bash
web-url-fetch <url>
web-wait-page-load                     # pre-loader? → web-wait 8 --until-hidden "<seletor>"
web-scrap                              # estética provável, stack, paleta, tipo, gradientes, vitals
web-motion --observe 4 --while "scroll-down 3000 --steps 60"
web-screenshot --hide-banners          # primeira dobra (o que se vê em 5 s)
web-screenshot --viewports desktop,mobile --full-page --scroll-through --hide-banners
web-record-frames --while "scroll-down 8000 --steps 160 --interval 50ms" --interval 0.25
web-interactions --limit 8
web-record-frames --while "mousemove 100,450 1340,450 720,120 720,800 --steps 40" --interval 0.15
web-close
```
`scrolledBy: 0` com `virtualScroll: true` no `web-control` = scroll virtual (WebGL/transform): confie nas spritesheets.

### Vídeo (gravação de tela enviada pelo usuário)
```bash
media-frames <arquivo.mp4>                 # ~24 frames + folha de contato numerada
media-frames <arquivo.mp4> --scenes 0.25   # um frame por corte/transição
media-frames <arquivo.mp4> --from 12 --to 18 --every 0.2   # microinteração de perto
```

### Print
Leia a imagem; descreva composição, tipo, cor, textura e o que parece interativo.
</capture>

---

<dna_sheet>
## 2. Ficha de DNA (preencha a partir do JSON e das imagens)

```yaml
referencia: <url | arquivo>
estetica: <aesthetic.primary> (+ <aesthetic.secondary>) — confirmada? sim/não, por quê
stack: [framework, movimento, scroll, 3D/shaders]
tipografia:
  display: <família, peso, tamanho máximo, tracking, eixos variáveis>
  texto: <família, tamanho, line-height>
  assinatura: <ex.: letras em itálico no meio da palavra, peso que reage ao cursor>
  escala: <fonts.scale>  # razão maior/menor
cor:
  fundo: <colors.background>
  texto: <colors.text>
  acentos: <colors.accent>
  campo: <gradientes CSS ou shader: tipo da biblioteca de blurs mais próximo>
movimento:
  duracoes: <web-motion transitions.durations>
  curvas: <web-motion transitions.easings>
  coreografia: [reveal em máscara, parallax, pin, scrub, card stack, morph…]
  microinteracoes: <web-interactions: hover/foco/magnético>
  scroll: <Lenis/Locomotive/nativo · opções>
apice: <momento mais memorável, seção, como entra e sai>
convencoes: [o que é seguro e convencional]
ousadias: [o que surpreende]
custos: [peso, LCP, jank (pageFrames), contraste, acessibilidade]
```
</dna_sheet>

---

<synthesis>
## 3. Sintetizar para o usuário

1. **Três princípios transferíveis**, com o porquê e onde aplicar no projeto dele.
2. **O que evitar**, com números da toolkit (peso, LCP, falhas de contraste, ausência de reduced-motion).
3. **Tokens sugeridos** (`web-tokens` como ponto de partida, depois adaptados à marca dele).
4. **Evidências**: caminhos das imagens, spritesheets, folhas de contato e JSONs.
</synthesis>
