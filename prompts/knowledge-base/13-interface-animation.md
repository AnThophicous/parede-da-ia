# 13 · Designing Interface Animation — Purposeful Motion, Timing and Accessibility

<module_meta>
  <source>Designing Interface Animation — Val Head (an original distillation)</source>
  <router_trigger>Load when deciding WHETHER and HOW to animate: state transitions, navigation, scroll, loading, onboarding — and whenever there is large motion on screen.</router_trigger>
  <enforcement_level>STRICT — every motion has a declared purpose and a reduced-motion fallback.</enforcement_level>
  <pairs_with>11 · 12 · 20 · 22 · workflows/motion-teardown.md</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axioms

1. **Animation is communication.** Every motion serves one of these purposes: **orient** (where it came from, where it went), **give feedback**, **show relationship/continuity**, **add personality** (sparingly).
2. **Motion style is part of the brand.** Define motion adjectives ("precise and calm", "elastic and playful") and derive durations and easings from them.
3. **Spatial continuity:** elements that change state should feel like the same object (expand the card instead of swapping screens).
4. **Choreography:** order and rhythm guide the eye; the most important thing arrives first or last, never in the middle of the confusion.
5. **Reduced motion is not "no design":** it is an alternative version with short fades and direct final states.
6. **Vestibular triggers:** intense parallax, zoom, large rotation and scroll-jacking can cause nausea — they are the first to go under `prefers-reduced-motion`.
7. **Performance is part of the design:** animate `transform` and `opacity`; measure jank.
</core_axioms>

---

<motion_language>
## 2. Motion language (pick one per project)

| Adjectives | Easings | Durations | Families |
|------------|---------|-----------|----------|
| precise, calm, trustworthy | ease-out-quart, ease-in-out-quart | 150 / 300 / 600ms | corporate-modernist, product-saas |
| fluid, luxurious, cinematic | expo-out `cubic-bezier(.16,1,.3,1)` / `(.19,1,.22,1)` | 200 / 450 / 900–1250ms | atmospheric-gradient, immersive-webgl |
| elastic, playful | spring (light overshoot), back.out | 180 / 350 / 700ms | playful-canvas, corporate-brand |
| dry, editorial, graphic | steps(), power4.inOut, cuts | 120 / 300 / 800ms | editorial-brutalist |
</motion_language>

---

<agent_traps>
## 3. Guard (forbidden)
- Animating because "it can be animated".
- A decorative preloader blocking content > 2.5s.
- Parallax on running text.
- Two large animations at the same time fighting for attention.
- Ignoring `prefers-reduced-motion` (`web-motion` and `web-audit` report it).
</agent_traps>

---

<design_engineering>
## 4. Accessible implementation

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; }
}
```
```js
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
if (!reduced.matches) { initLenis(); initParallax(); initParticles(); } else { renderStaticFallback(); }
reduced.addEventListener('change', () => location.reload()); // simple and predictable
```
</design_engineering>

---

<review_checklist>
## 5. Rubric
- [ ] Each animation has its purpose written in the motion spec.
- [ ] A single, coherent motion language (easings/durations of one "dialect" in `web-motion`).
- [ ] Reduced-motion tested: `web-url-fetch --reduced-motion` + `web-record-frames`.
- [ ] No jank: `pageFrames.longFrames` ≤ 5% on the scroll recording.
</review_checklist>
