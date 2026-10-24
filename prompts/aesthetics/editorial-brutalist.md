# Aesthetic · editorial-brutalist — Extreme Typographic Contrast

<aesthetic_meta>
  <archetypes>personal / portfolio · ambitious · studios</archetypes>
  <use_when>Studios, agencies, designers and cultural projects that want authority and attitude at a low visual cost; great when the content is text and work.</use_when>
  <avoid_when>Audiences that need warmth and comfort (health, children); products with a lot of functional UI.</avoid_when>
  <books>14 (type) · 15 (grid) · 05 · 12</books>
  <reference_studied>parede-da-ia's own landing (v0.1 and v0.3, black and white) and the Cuberto/Swiss studio family: pure black and white, giant display type with an italic serif as counterpoint, mono as the technical voice, hairlines, magnetic round buttons, a mix-blend difference cursor, ink drawings instead of photos.</reference_studied>
</aesthetic_meta>

---

<visual_dna>
## 1. Visual DNA

| Axis | Rule |
|------|------|
| Typography | heavy display sans at 12–20vw, tracking −0.05 to −0.07em; an italic serif for key words; mono for metadata |
| Color | monochrome (black, white and 6–8 grays) or monochrome + **one** high-impact accent |
| Grid | intentional asymmetry on top of a strict grid; section numbers "(01)", 1px rules |
| Form | square corners; circles only for buttons and the cursor |
| Texture | subtle grain; dithering as imagery |
</visual_dna>

---

<motion_signature>
## 2. Motion
"Dry and graphic": line-by-line masked reveals (expo-out, 1–1.2s), a marquee with scroll inertia, magnetic buttons, a cursor that turns into a label (only where the target has no text of its own). No "cuteness".
</motion_signature>

---

<signature_moves>
## 3. Signature moves
1. **A giant title with Hover Font** (weight grows near the cursor). (`library/motion/hover-font.js`)
2. **An editorial list** (01–10) with rows that invert color on hover.
3. **A magnetic round button** with a fill that rises. (`library/motion/magnetic.js`)
4. **A 1-bit dithered image** or the library's *Banding Gradient* color field.
5. **A footer with a full-width wordmark.**
</signature_moves>

---

<anti_patterns>
## 4. Anti-patterns
Brutalism as an excuse for illegibility · "stylish" low contrast · running text in all caps · a custom cursor hiding the real one in forms.
</anti_patterns>

---

<qa_rubric>
## 5. QA
`web-scrap`: `isMonochrome` (if the direction is B&W) and AA contrast · `web-audit` ≥ 88 · CLS ≤ 0.1 with the Hover Font active.
</qa_rubric>
