# Workflow · creative-direction

<module_meta>
  <role>Personal/portfolio and ambitious branch of Phase 1. Turns references and intent into 2–3 defensible creative directions.</role>
  <enforcement_level>GUIDED — the order of the steps is mandatory; the content of the directions is yours.</enforcement_level>
  <modes>short (personal/portfolio, 3–5 questions) · full (ambitious, 6–8 questions + reference research)</modes>
  <pairs_with>aesthetics/*.md · knowledge-base/04 · 12 · 16 · 17 · workflows/reference-teardown.md · templates/creative-direction.md</pairs_with>
</module_meta>

---

<step_1_questions>
## 1. Questions (one message)

### Short mode — personal / portfolio
1. Who are you in 3 adjectives? (e.g., curious, precise, playful)
2. Which work are you proudest of, and why?
3. What should the visitor **do** (hire you, talk to you, see projects) and **feel**?
4. How daring: 1 (sober) · 2 (personality) · 3 (experimental).
5. Do you have references? (URL, video, screenshot) — if so, send them.

### Full mode — ambitious
The core questions from frontend-master §1.C **plus**:
6. Who needs to be impressed (a jury, enterprise clients, the creative community)?
7. Target device and performance budget (e.g., "must run smoothly on a laptop with integrated graphics").
8. Is there original audio, 3D or video? Who produces it?
</step_1_questions>

---

<step_2_research>
## 2. Research and reference teardown

For each reference (the user's, or 3–5 you pick on Awwwards):

```bash
web-url-fetch <url> && web-wait-page-load
web-scrap                                   # aesthetic.primary/secondary, palette, type, stack
web-motion --observe 3 --while "scroll-down 2500 --steps 50"
web-record-frames --while "scroll-down 6000 --steps 120" --interval 0.25
web-interactions --limit 8
```

A video was sent? `media-frames <file>` (and `--scenes 0.25` for cuts). Record each reference's DNA with `workflows/reference-teardown.md` §2.
</step_2_research>

---

<step_3_directions>
## 3. Directions (use `templates/creative-direction.md`)

Propose **2 or 3 truly different directions** (never 3 variations of the same idea). Each direction has:

- **Name and concept in one sentence** (e.g., "Living board — the portfolio is the process itself").
- **Aesthetic family** (+ a secondary one, if any) and the playbook behind it.
- **References** and what to take from each (a principle, not an asset).
- **Initial tokens:** typography (with a variable axis, if there is a font effect), palette, radius, shadow, durations and easings.
- **Visual climax:** where it happens, how it comes in, how it leaves.
- **Motion signature:** 2–3 microinteractions and 1 section transition.
- **Risks and cost:** performance, accessibility, asset production.

Recommend **one** and explain why. Wait for the choice. Do not build all three.
</step_3_directions>

---

<signature_patterns>
## 4. Signature patterns available in `library/`

| Pattern | Typical family | File |
|---------|----------------|------|
| Hover Font (variable weight by cursor proximity) | editorial, gradient, canvas | `library/motion/hover-font.js` |
| Text morph (particles → text) | immersive, gradient | `library/particles/text-morph.js` |
| Liquid gradient field (mesh + grain) | atmospheric-gradient | `library/gradients/mesh-field.glsl` · Paper Shaders |
| Blur library (12 types) | gradient, brand | `library/gradients/blur-library.css` |
| Magnetic button | all except strict modernist | `library/motion/magnetic.js` |
| Pixel trail on a grid | playful-canvas | `library/motion/pixel-trail.js` |
| Draggable canvas with light physics | playful-canvas | `library/motion/draggable-canvas.js` |
| Card stack (a section becomes a card that recedes) | canvas, editorial | `library/motion/card-stack.css` |
| Rotating circular "scroll ·" badge | gradient, editorial | `library/motion/scroll-badge.css` |
| "Hello" preloader with a blurred blob | gradient, immersive | `library/loaders/hello-preloader.css` |
</signature_patterns>

---

<self_evaluation>
## 5. Rubric for the directions (0–2 each; minimum 9/12)

| Criterion | 2 = excellent |
|-----------|---------------|
| Real difference between directions | distinct concepts, families and climaxes |
| Fit with the person/brand | every choice points back to the step 1 answers |
| Visual climax | specific, with its entrance and exit described |
| Feasibility | performance budget and assets solved |
| Accessibility | motion fallback and contrast planned |
| Originality | principles extracted, nothing copied |
</self_evaluation>
