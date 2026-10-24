# 12 · The Illusion of Life — The 12 Principles of Animation Applied to Interfaces

<module_meta>
  <source>The Illusion of Life: Disney Animation — Frank Thomas & Ollie Johnston (an original distillation of the classic principles)</source>
  <router_trigger>Load when creating entrance choreography, section transitions, characters/mascots, particles, morphs, cursor effects or any motion that should feel "alive".</router_trigger>
  <enforcement_level>GUIDED — craft principles; the performance budget and accessibility stay STRICT.</enforcement_level>
  <pairs_with>11 · 13 · 17 · 20</pairs_with>
</module_meta>

---

<core_axioms>
## 1. The 12 principles, translated to UI

| # | Principle | In the interface |
|---|-----------|------------------|
| 1 | **Squash and stretch** | buttons that sink slightly on click (scale 0.97); particles that stretch in the direction of motion |
| 2 | **Anticipation** | a micro pull-back before the jump (a card dips 2px before rising); a cursor that contracts before the click |
| 3 | **Staging** | one focal point at a time; the rest dims or waits |
| 4 | **Straight ahead vs. pose to pose** | keyframed timelines (pose to pose) for choreography; physics/simulation (straight ahead) for particles and the cursor |
| 5 | **Follow-through and overlapping action** | stagger: children finish after the parent; the text settles after the card |
| 6 | **Slow in and slow out** | ease-out/expo-out on entrances; never linear for objects (linear only for scrub/scroll) |
| 7 | **Arcs** | curved paths (particle morph, magnetic cursor) feel natural; straight lines feel mechanical |
| 8 | **Secondary action** | the grain moves subtly while the title comes in; it never competes |
| 9 | **Timing** | duration communicates weight: light 150–250ms, medium 300–500ms, heavy/cinematic 700–1200ms |
| 10 | **Exaggeration** | at the climax, exaggerate (scale, color, speed); everywhere else, hold back |
| 11 | **Solid drawing** | coherent volume and light (shaders with consistent lighting; shadows from the same source) |
| 12 | **Appeal** | intentional personality: a recognizable motion signature |
</core_axioms>

---

<agent_traps>
## 2. Guard against generic motion

- **Forbidden:** everything entering with the same 0.6s fade-up: vary timing and order by hierarchy (staging).
- **Forbidden:** linear easing on moving objects.
- **Forbidden:** a stagger that runs too long: a section's whole choreography ≤ 1.2s.
- **Forbidden:** exaggeration outside the climax (it loses value when it is constant).
</agent_traps>

---

<design_engineering>
## 3. Recipes

```js
// Masked reveal with overlap (pose to pose + follow-through)
gsap.from(lines, { yPercent: 105, duration: 1.1, ease: 'expo.out', stagger: 0.08 });
gsap.from(meta, { opacity: 0, y: 12, duration: 0.6, ease: 'power3.out', delay: 0.35 });

// Anticipation + squash on click
button.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.96)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'cubic-bezier(.34,1.56,.64,1)' });
```
Particles (text morph): each particle travels an **arc** (a bezier with a control point offset in z or by noise), with a delay proportional to distance (follow-through), and settles with ease-out (slow in/out).
</design_engineering>

---

<review_checklist>
## 4. Rubric (read the `web-record-frames` spritesheet)
- [ ] There is one focal point per frame (staging).
- [ ] Related elements arrive in a cascade, not all at once.
- [ ] No object moves at a constant speed.
- [ ] The climax is visibly more exaggerated than the rest.
- [ ] Reduced-motion: the same final states without displacement.
</review_checklist>
