# 16 · Interaction of Color — Color Is Relative: Context, Vibration and Gradients

<module_meta>
  <source>Interaction of Color — Josef Albers (an original distillation)</source>
  <router_trigger>Load when building palettes, gradients and color fields (blur library), dark themes, brand accents and when judging whether a color "works".</router_trigger>
  <enforcement_level>GUIDED for aesthetics; STRICT for text contrast (WCAG).</enforcement_level>
  <pairs_with>05 · 17 · aesthetics/atmospheric-gradient.md · aesthetics/blur-library.md</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axioms

1. **A color is never seen alone.** The same color changes with its neighbor: an orange looks warmer on midnight blue and duller on beige.
2. **One color can look like two; two can look like one.** Test accents on every background where they will appear.
3. **Complementaries vibrate** at the edges (blue × orange): great for color fields and climaxes; dangerous for thin text.
4. **Quantity changes the color:** 5% orange is an accent; 50% is a theme. Define proportions (e.g., 70 background · 25 neutrals · 5 accent).
5. **Transparency and mixing are useful illusions:** overlaps and blends create depth without new colors.
6. **Gradients are relationships, not pairs of colors:** the path between the colors (the interpolation space) matters as much as the ends.
7. **Temperature creates depth:** warm colors advance, cool ones recede — orange in front, blue behind.
8. **Pure black and white is a palette too:** with gray as the only step between them, hierarchy depends entirely on value, scale and space — the strictest test of a composition.
</core_axioms>

---

<gradients>
## 2. Gradients that don't turn "muddy"

```css
/* Interpolate in OKLCH/OKLab: avoids the gray in the middle between blue and orange */
.field { background: linear-gradient(135deg in oklch, #0b1638, #ff6a1a); }
/* More stops = a smooth perceptual curve */
.field-soft { background: radial-gradient(120% 90% at 70% 40% in oklab, #ff8a3d 0%, #b3471d 22%, #1b2a63 55%, #050816 100%); }
/* Banding: light noise on top (grain) breaks the steps on 8-bit screens */
.grain::after { content: ''; position: absolute; inset: 0; background: url(noise.png); opacity: .08; mix-blend-mode: overlay; }
```

Example palette — **midnight + orange**:

| Role | Color | Use |
|------|-------|-----|
| deep background | `#050816` | 60–70% |
| midnight blue | `#0b1638` / `#1b2a63` | fields, cards |
| electric blue | `#3a5bff` | a cool glow in the gradient (sparingly) |
| orange | `#ff6a1a` | accent, climax, CTA |
| amber | `#ffb36b` | the gradient's light |
| cream | `#f4efe6` | main text |
| mist | `#8e97bd` | secondary text (check 4.5:1) |
</gradients>

---

<agent_traps>
## 3. Guard (forbidden)
- Text over a gradient without checking contrast at the gradient's **worst point**.
- A straight RGB gradient between complementaries (a grayish middle).
- An accent covering more than ~10% of the screen on corporate.
- Picking a color in isolation in a color picker without seeing it in its final context.
</agent_traps>

---

<review_checklist>
## 4. Rubric
- [ ] `web-scrap` → `colors.accent`: the dominant accent ≤ 10–15% (corporate) or intentionally leading (brand).
- [ ] AA contrast on every text, including over color fields (`web-audit` + a visual check of the "uncertain" ones).
- [ ] Gradients interpolated in OKLCH/OKLab or with enough stops; no visible banding (capture at @2x).
- [ ] The background/neutral/accent proportion declared in the tokens.
</review_checklist>
