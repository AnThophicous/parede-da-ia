# Aesthetic · product-saas — The Product Is the Hero

<aesthetic_meta>
  <archetypes>corporate (software)</archetypes>
  <use_when>Digital products with a demo, plans, integrations and onboarding; B2B and B2C.</use_when>
  <avoid_when>Services with no interface of their own; brands that sell emotion more than functionality.</avoid_when>
  <books>03 · 05 · 20 · 21 · 23 · 11</books>
</aesthetic_meta>

---

<visual_dna>
## 1. Visual DNA

| Axis | Rule |
|------|------|
| Typography | an interface sans (Inter, Geist, Instrument Sans) with 3–4 weights; headings 40–72px; tabular numbers |
| Color | cool neutrals + **one** product accent; states (success, warning, error) with their own tones; an optional dark mode designed from the start |
| Components | cards with a 12–16px radius, elevation shadows in 3 levels, translucent 1px borders, system icons (Lucide) |
| Imagery | **real screenshots and fragments of the UI** (cropped and enlarged), not generic illustrations |
| Layout | 12-column grid, one idea per section, an alternating "text ↔ demo" rhythm |
</visual_dna>

---

<motion_signature>
## 2. Motion
"Precise and responsive": 150 / 250 / 450ms, ease-out-quart. UI demos animated with short timelines (a fake cursor clicking, states changing). Card hover lifts 2–4px with a larger shadow.
</motion_signature>

---

<signature_moves>
## 3. Signature moves
1. **A hero with the real UI** in light perspective with a subtle reflection/glow (a gradient from the blur library, *Blurred*, behind it).
2. **Feature tabs** (shadcn Tabs) swapping the demo on the right.
3. **A bento grid** of features with micro-demos.
4. **A pricing table** with the recommended plan highlighted (Hick, Von Restorff).
5. **Integrations** in a searchable grid of authorized logos.
</signature_moves>

---

<anti_patterns>
## 4. Anti-patterns
A generic 3D laptop mockup · isometric illustrations unrelated to the product · fake dashboards with absurd data · 6 different CTAs.
</anti_patterns>

---

<qa_rubric>
## 5. QA
`web-audit` ≥ 90 · `web-interactions`: tabs/menus with keyboard and visible focus · LCP ≤ 2.5s with optimized screenshots (AVIF/WebP, width/height).
</qa_rubric>
