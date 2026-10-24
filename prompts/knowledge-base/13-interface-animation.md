# 13 · Designing Interface Animation — Movimento com Propósito, Timing e Acessibilidade

<module_meta>
  <source>Designing Interface Animation — Val Head (destilação autoral)</source>
  <router_trigger>Carregar ao decidir SE e COMO animar: transições de estado, navegação, scroll, carregamento, onboarding — e sempre que houver movimento grande na tela.</router_trigger>
  <enforcement_level>STRICT — todo movimento tem propósito declarado e fallback de movimento reduzido.</enforcement_level>
  <pairs_with>11 · 12 · 20 · 22 · workflows/motion-teardown.md</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axiomas

1. **Animação é comunicação.** Todo movimento responde a um destes propósitos: **orientar** (de onde veio, para onde foi), **dar feedback**, **mostrar relação/continuidade**, **dar personalidade** (com moderação).
2. **Estilo de movimento é parte da marca.** Defina adjetivos de movimento ("preciso e calmo", "elástico e brincalhão") e derive deles durações e curvas.
3. **Continuidade espacial:** elementos que mudam de estado devem parecer o mesmo objeto (expandir o card em vez de trocar de tela).
4. **Coreografia:** ordem e ritmo guiam o olhar; o mais importante chega primeiro ou por último, nunca no meio da confusão.
5. **Movimento reduzido não é "sem design":** é uma versão alternativa com fades curtos e estados finais diretos.
6. **Gatilhos de vestibular:** parallax intenso, zoom, rotação grande e scroll-jacking podem causar náusea — são os primeiros a desligar em `prefers-reduced-motion`.
7. **Performance é parte do design:** anime `transform` e `opacity`; meça jank.
</core_axioms>

---

<motion_language>
## 2. Linguagem de movimento (escolha uma por projeto)

| Adjetivos | Curvas | Durações | Famílias |
|-----------|--------|----------|----------|
| preciso, calmo, confiável | ease-out-quart, ease-in-out-quart | 150 / 300 / 600ms | corporativo-modernista, produto-saas |
| fluido, luxuoso, cinematográfico | expo-out `cubic-bezier(.16,1,.3,1)` / `(.19,1,.22,1)` | 200 / 450 / 900–1250ms | gradiente-atmosferico, imersivo-webgl |
| elástico, brincalhão | spring (overshoot leve), back.out | 180 / 350 / 700ms | canvas-ludico, corporativo-marca |
| seco, editorial, gráfico | steps(), power4.inOut, cortes | 120 / 300 / 800ms | editorial-brutalista |
</motion_language>

---

<agent_traps>
## 3. Trava (proibido)
- Animar porque "dá para animar".
- Pre-loader decorativo bloqueando o conteúdo > 2,5s.
- Parallax em texto corrido.
- Duas animações grandes simultâneas disputando atenção.
- Ignorar `prefers-reduced-motion` (o `web-motion` e o `web-audit` reportam).
</agent_traps>

---

<design_engineering>
## 4. Implementação acessível

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; }
}
```
```js
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
if (!reduced.matches) { initLenis(); initParallax(); initParticles(); } else { renderStaticFallback(); }
reduced.addEventListener('change', () => location.reload()); // simples e previsível
```
</design_engineering>

---

<review_checklist>
## 5. Rubrica
- [ ] Cada animação tem propósito escrito na motion spec.
- [ ] Linguagem de movimento única e coerente (curvas/durações de um só "dialeto" no `web-motion`).
- [ ] Reduced-motion testado: `web-url-fetch --reduced-motion` + `web-record-frames`.
- [ ] Sem jank: `pageFrames.longFrames` ≤ 5% na gravação de scroll.
</review_checklist>
