# 16 · Interaction of Color — Cor é Relativa: Contexto, Vibração e Gradientes

<module_meta>
  <source>Interaction of Color — Josef Albers (destilação autoral)</source>
  <router_trigger>Carregar ao construir paletas, gradientes e campos de cor (biblioteca de blurs), temas escuros, acentos de marca e ao julgar se uma cor "funciona".</router_trigger>
  <enforcement_level>GUIDED para estética; STRICT para contraste de texto (WCAG).</enforcement_level>
  <pairs_with>05 · 17 · aesthetics/gradiente-atmosferico.md · aesthetics/biblioteca-de-blurs.md</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axiomas

1. **Cor nunca é vista sozinha.** A mesma cor muda de aparência conforme o vizinho: um laranja parece mais quente sobre azul-meia-noite e mais apagado sobre bege.
2. **Uma cor pode parecer duas; duas podem parecer uma.** Teste acentos sobre todos os fundos onde aparecerão.
3. **Complementares vibram** nas bordas (azul × laranja): ótimo para campos de cor e ápices; perigoso para texto fino.
4. **Quantidade muda a cor:** 5% de laranja é acento; 50% é tema. Defina proporções (ex.: 70 fundo · 25 neutros · 5 acento).
5. **Transparência e mistura são ilusões úteis:** sobreposições e blends criam profundidade sem novas cores.
6. **Gradientes são relações, não pares de cores:** o caminho entre as cores (espaço de interpolação) importa tanto quanto as pontas.
7. **Temperatura cria profundidade:** quentes avançam, frias recuam — laranja na frente, azul no fundo.
</core_axioms>

---

<gradients>
## 2. Gradientes que não ficam "lamacentos"

```css
/* Interpole em OKLCH/OKLab: evita o cinza no meio entre azul e laranja */
.field { background: linear-gradient(135deg in oklch, #0b1638, #ff6a1a); }
/* Mais pontos de parada = curva perceptual suave */
.field-soft { background: radial-gradient(120% 90% at 70% 40% in oklab, #ff8a3d 0%, #b3471d 22%, #1b2a63 55%, #050816 100%); }
/* Banding: ruído leve por cima (grão) quebra degraus em telas 8-bit */
.grain::after { content: ''; position: absolute; inset: 0; background: url(noise.png); opacity: .08; mix-blend-mode: overlay; }
```

Paleta de exemplo — **meia-noite + laranja** (landing do parede-da-ia):

| Papel | Cor | Uso |
|-------|-----|-----|
| fundo profundo | `#050816` | 60–70% |
| azul meia-noite | `#0b1638` / `#1b2a63` | campos, cards |
| azul elétrico | `#3a5bff` | brilho frio no gradiente (pouco) |
| laranja | `#ff6a1a` | acento, ápice, CTA |
| âmbar | `#ffb36b` | luz do gradiente |
| creme | `#f4efe6` | texto principal |
| névoa | `#8e97bd` | texto secundário (verifique 4.5:1) |
</gradients>

---

<agent_traps>
## 3. Trava (proibido)
- Texto sobre gradiente sem verificar contraste no **pior ponto** do gradiente.
- Gradiente RGB direto entre complementares (meio acinzentado).
- Acento usado em mais de ~10% da tela no corporativo.
- Escolher cor isolada num color picker sem vê-la no contexto final.
</agent_traps>

---

<review_checklist>
## 4. Rubrica
- [ ] `web-scrap` → `colors.accent`: acento dominante ≤ 10–15% (corporativo) ou intencionalmente protagonista (marca).
- [ ] Contraste de todos os textos em AA, inclusive sobre campos de cor (`web-audit` + conferência visual dos "incertos").
- [ ] Gradientes interpolados em OKLCH/OKLab ou com paradas suficientes; sem banding visível (captura em @2x).
- [ ] Proporção fundo/neutro/acento declarada nos tokens.
</review_checklist>
