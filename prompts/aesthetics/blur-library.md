# Blur library — 12 Gradient Types for Color Fields

<module_meta>
  <role>Gradient vocabulary and recipes for art direction. A reference resource for agents — not landing page content.</role>
  <enforcement_level>GUIDED — pick the type by its emotional effect; interpolate in OKLab/OKLCH; always with grain.</enforcement_level>
  <code>library/gradients/blur-library.css (.blur--* classes) · library/gradients/mesh-field.glsl · preview: library/gradients/index.html</code>
  <pairs_with>knowledge-base/16 (color) · 17 (shaders) · aesthetics/atmospheric-gradient.md</pairs_with>
</module_meta>

---

<catalog>
## 1. The 12 types (taxonomy popularized by Awwwards)

| Type | Class | Feeling | Best use |
|------|-------|---------|----------|
| Irregular | `.blur--irregular` | organic, alive | hero backgrounds, atmospheric fields (animatable with `.blur--drift`) |
| Radial Ramp | `.blur--radial-ramp` | focus, sunset, energy | behind a centered title or the final CTA |
| Blurred | `.blur--blurred` | soft, premium | product cards, SaaS (behind the UI) |
| Edgy | `.blur--edgy` | graphic, bold | young brands, campaigns |
| Landscape | `.blur--landscape` | horizon, calm | transition sections, cover images |
| Multicolor | `.blur--multicolor` | festive, diverse | events, communities |
| Retro | `.blur--retro` | nostalgia, spectrum | music, games (sparingly) |
| Duotone | `.blur--duotone` | clean, corporate | highlight bands in corporate-modernist |
| Tricolor | `.blur--tricolor` | balance, sophistication | three-color identities |
| Volume Mesh | `.blur--volume-mesh` | object, depth | decorative spheres/orbs, large icons |
| Banding Gradient | `.blur--banding` | graphic, 8-bit, editorial | editorial-brutalist, posters |
| Gradient / Image | `.blur--image` | a photo tinted by the brand | cohesion across diverse photos |
</catalog>

---

<rules>
## 2. Rules

1. **Palette through variables** (`--c1` background · `--c2` cool/middle · `--c3` accent · `--c4` light): the same type serves any brand.
2. **Perceptual interpolation:** `in oklab`/`in oklch` avoids the muddy gray between complementaries (blue × orange).
3. **Always grain** (8–12%): hides banding and adds materiality.
4. **A field is atmosphere, not a figure:** it fills the background, bleeds out of the frame and never fights the text.
5. **Text over a field:** check contrast at the worst point (`web-audit` marks it "uncertain").
6. **Animated = slow:** a 15–25s drift, or a shader at speed 0.1–0.25; reduced-motion freezes it.
7. **WebGL only when CSS is not enough** (a liquid field that reacts to the cursor → `mesh-field.glsl` or Paper Shaders `MeshGradient`).
</rules>

---

<qa>
## 3. QA
`web-screenshot --dpr 2` to check banding · `web-record-frames` to check the animated field's smoothness · `web-audit` for the contrast of text over the field.
</qa>
