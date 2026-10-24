# Aesthetic · atmospheric-gradient — Color Fields, Grain and Glass

<aesthetic_meta>
  <archetypes>ambitious (primary) · personal · corporate hero (as an accent)</archetypes>
  <use_when>Creative studios, launches, tech/AI brands, music, fashion — when the first impression should be emotion and atmosphere.</use_when>
  <avoid_when>Dense reading content on top of the field; very weak target devices without a fallback.</avoid_when>
  <books>16 (color) · 17 (shaders) · 12 · 13 · 14</books>
  <reference_studied>monopo.vn (monopo saigon), measured with the toolkit (Oct/2026): Nuxt + Vue + GSAP 3.7 (bundled) + Locomotive Scroll + Three.js r131; a full-screen WebGL2 canvas with 7 shaders forming a liquid color field (olive green, amber, black) with grain, and a glass sphere refracting the field; a "hello saigon" preloader over a blurred blob; the Roobert font self-hosted, 225px display at weight 400 with isolated italic letters ("Creat*i*ve stud*io*"); masked line reveals (translate3d 0 → ±150%); 800ms and 1250ms with cubic-bezier(0.19, 1, 0.22, 1) on 67% of the transitions; a rotating circular "scroll down" badge; vertical navigation on the right; 34MB transferred and no reduced-motion rule (what not to copy).</reference_studied>
</aesthetic_meta>

---

<visual_dna>
## 1. Visual DNA

| Axis | Rule |
|------|------|
| Color field | an animated procedural gradient (mesh/fBm with domain warping) or layered blurred CSS gradients; 3–5 colors; luminous bands over darkness |
| Texture | mandatory grain (8–15% opacity) — hides banding and adds materiality |
| Object | optional: a glass sphere/shape refracting the field, or liquid metal |
| Typography | very large light-to-medium display (300–500) in warm white; occasional italic letters; small, airy body text |
| Layout | few elements, lots of air; discreet navigation at the edges |
| Example palette | midnight + orange: `#050816` background · `#0b1638` / `#1b2a63` midnight · `#3a5bff` cool glow · `#ff6a1a` orange · `#ffb36b` amber · `#f4efe6` text |
</visual_dna>

---

<motion_signature>
## 2. Motion
"Fluid and cinematic": expo-out `cubic-bezier(0.19, 1, 0.22, 1)`, 800–1250ms on reveals, 200–400ms on feedback. A slow color field (speed 0.1–0.25) that reacts to the cursor with lerp; section transitions by mask or by a change of the field.
</motion_signature>

---

<signature_moves>
## 3. Signature moves
1. **A "hello" preloader** with a pulsing blurred blob (≤ 1.8s). (`library/loaders/hello-preloader.css`)
2. **A hero with a liquid field** (Paper Shaders `MeshGradient` or `library/gradients/mesh-field.glsl`) + grain.
3. **A title with italic letters** and a line-by-line masked reveal.
4. **A glass sphere** (Three.js `MeshPhysicalMaterial` with `transmission`) or liquid metal over the field — desktop only.
5. **A circular "scroll · scroll ·" badge** rotating with the scroll. (`library/motion/scroll-badge.css`)
6. **Dark sections** with smaller fields (blur library) as "lights" behind cards.
</signature_moves>

---

<tech_stack>
## 4. Stack and budget
Paper Shaders (React or vanilla) for fields · Three.js only if there is a 3D object · GSAP + ScrollTrigger · Lenis (off with `prefers-reduced-motion`) · the field rendered at 0.5–0.75× DPR · paused outside the viewport · a CSS fallback (*Blurred* / *Irregular* from the library) · budget ≤ 2.5MB of JS+shaders. Avoid full-screen `mix-blend-mode` layers and stacked `backdrop-filter`s: they are the most expensive things to composite.
</tech_stack>

---

<accessibility_guard>
## 5. Guard
Text always with a shadow/scrim or over dark areas of the field; check contrast on the worst frame; reduced-motion freezes the field (static frame) and removes the animated glass.
</accessibility_guard>

---

<anti_patterns>
## 6. Anti-patterns
34MB of assets · the field at 2× DPR · a "muddy" RGB gradient between complementaries (interpolate in OKLCH) · thin text over light bands · no fallback.
</anti_patterns>

---

<qa_rubric>
## 7. QA
`web-record-frames` → `pageFrames.fps` ≥ 50 on integrated graphics · `web-audit` ≥ 85 · `web-scrap` → `aesthetic.primary` atmospheric-gradient/immersive · "uncertain" contrasts checked on the captures.
</qa_rubric>
