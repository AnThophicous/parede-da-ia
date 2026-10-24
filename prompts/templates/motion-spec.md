# Template · motion spec

```css
:root {
  /* Durações */
  --motion-instant: 100ms;   /* toggles, pressed */
  --motion-fast: 180ms;      /* hover, foco */
  --motion-base: 380ms;      /* estados, menus, modais */
  --motion-slow: 900ms;      /* reveals e coreografia */
  /* Curvas */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1);
  --ease-spring-soft: cubic-bezier(0.34, 1.56, 0.64, 1); /* overshoot leve, use pouco */
}
@media (prefers-reduced-motion: reduce) {
  :root { --motion-fast: 0ms; --motion-base: 0ms; --motion-slow: 0ms; }
}
```

## Coreografia

| # | Gatilho | Elementos | Propriedades | Duração | Stagger / atraso | Curva | Reduced-motion |
|---|---------|-----------|--------------|---------|------------------|-------|----------------|
| 1 | entra na viewport (top 80%) | linhas do título | translateY 105% → 0 (máscara) | slow | 80ms por linha | ease-out-expo | aparece sem deslocamento |
| 2 | hover no CTA | fundo do botão | scaleY 0 → 1 (origem inferior) | fast | — | ease-out-quart | troca de cor direta |
| 3 | scroll 0–100% da seção | card da seção | scale 1 → 0.92, radius 0 → 24px | scrub | — | linear (scrub) | sem efeito |

## Microinterações (Saffer)

| Nome | Gatilho | Regras | Feedback | Loops / modos |
|------|---------|--------|----------|---------------|
| Copiar prompt | clique no botão | copia para a área de transferência; fallback de seleção | rótulo vira "Copiado ✓" por 2,4s + toast | volta ao rótulo original |

## Orçamento
- Máx. elementos animando ao mesmo tempo: <n>
- Propriedades permitidas: transform, opacity (+ filter pontual)
- Alvo: 60 fps em notebook com GPU integrada · `web-record-frames` → `pageFrames.longFrames` ≤ 5%
