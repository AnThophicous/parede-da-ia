# Workflow · motion-teardown

<module_meta>
  <role>Disseca e especifica movimento: animações de scroll, transições de seção e microinterações. Produz uma motion spec implementável.</role>
  <enforcement_level>GUIDED — medir antes de opinar; especificar antes de implementar.</enforcement_level>
  <pairs_with>knowledge-base/11 (microinterações) · 12 (12 princípios) · 13 (animação de interface) · 20 (Doherty, pico-fim) · templates/motion-spec.md</pairs_with>
</module_meta>

---

<measure>
## 1. Medir

```bash
web-motion                                   # vocabulário declarado: durações, curvas, props, @keyframes, GSAP/ScrollTrigger
web-motion --observe 4 --while "scroll-down 3000 --steps 60"   # o que anima de verdade (funciona com GSAP empacotado)
web-interactions --limit 12                  # hover / :active / foco / magnético, com folha antes-depois
web-record-frames --while "scroll-down 5000 --steps 100" --interval 0.2      # coreografia
web-record-frames --selector "<botão>" --interval 0.05 --duration 1.5 --while "hover <botão> --hold 1s"   # micro, de perto
```
Leia `pageFrames` no manifesto: `longFrames` altos = jank; o efeito precisa de outra técnica (transform/opacity, menos elementos, `will-change` pontual).
</measure>

---

<interpret>
## 2. Interpretar com vocabulário de animação

| Observação | Leitura | Módulo |
|------------|---------|--------|
| `cubic-bezier(0.16, 1, 0.3, 1)` / `(0.19, 1, 0.22, 1)` dominantes | expo-out: entrada rápida, assentamento longo — sensação "premium" | 12 · slow in/out |
| durações 600–1250ms em reveals | coreografia editorial; ok para entradas, longa demais para feedback | 13 · timing |
| feedback de hover > 300ms | lento: hover deve responder em 150–250ms | 11 · feedback · 20 · Doherty |
| spans `part--first/second` com `translate3d(0, ±150%)` | reveal de linha em máscara (overflow hidden) | 12 · staging |
| `matrix3d` no `main` | smooth scroll por transform (Locomotive/virtual) — custo de acessibilidade | 13 · a11y |
| transform no hover acompanhando o cursor | efeito magnético | 11 · loops e modos |
| sem regra `prefers-reduced-motion` | dívida de acessibilidade, sempre reportar | 22 |
</interpret>

---

<specify>
## 3. Especificar (use `templates/motion-spec.md`)

- **Tokens:** `--motion-fast` (150–200ms) feedback · `--motion-base` (300–450ms) estados · `--motion-slow` (700–1200ms) coreografia · curvas nomeadas (`--ease-out-expo`, `--ease-in-out-quart`).
- **Tabela de coreografia:** gatilho → elementos → propriedades → duração → atraso/stagger → curva → reduced-motion.
- **Microinterações:** gatilho, regras, feedback, loops/modos `[11]` para cada uma.
- **Orçamento:** máximo de elementos animando ao mesmo tempo, propriedades permitidas (transform, opacity, filter com moderação), alvo de 60 fps em notebook com GPU integrada.
</specify>

---

<rules>
## 4. Regras inegociáveis

1. Anime **transform e opacity**. Evite animar `width/height/top/left/box-shadow` em loops.
2. Feedback de interação começa em **≤ 100ms** e termina em **≤ 300ms**.
3. Movimento grande precisa de **fallback reduced-motion**: troque deslocamento por fade curto ou estado final direto.
4. Nada de scroll-jacking que muda velocidade ou direção do wheel nativo sem motivo narrativo forte.
5. O ápice tem **uma** coreografia memorável. Todo o resto é discreto (pico-fim `[20]`).
</rules>
