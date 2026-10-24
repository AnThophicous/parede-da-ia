# Aesthetic · corporate-modernist — Swiss, Economical, Trustworthy

<aesthetic_meta>
  <archetypes>corporate (primary) · sober personal</archetypes>
  <use_when>Professional services, public sector, health, finance, legal, industry, consultancies — when trust and clarity are worth more than spectacle.</use_when>
  <avoid_when>Creative launches, portfolios that need a strong personality, campaigns that depend on emotion.</avoid_when>
  <books>15 (grid) · 05 (hierarchy) · 14 (type) · 03 (usability) · 23 (message)</books>
</aesthetic_meta>

---

<visual_dna>
## 1. Visual DNA

| Axis | Rule |
|------|------|
| Typography | one neutral grotesque with 4–6 weights (Inter, Instrument Sans, Geist, Suisse-like); display 48–96px at weight 500–600; body 16–18px; slight negative tracking on headings |
| Color | light background (white or cool off-white), near-black text, **one** brand accent on ≤ 10% of the area; grays in 8–10 steps |
| Grid | 12 columns, 1200–1440px container, text on 6–7 columns (640–720px), vertical rhythm in multiples of 8 |
| Form | small radii (0–8px), thin 1px borders, almost no shadows |
| Imagery | real documentary photography, straight crops, captions; consistent line icons |
| Texture | none, or very subtle paper |
</visual_dna>

---

<motion_signature>
## 2. Motion signature

A "precise and calm" language: `ease-out-quart` / `ease-in-out-quart`, durations **150 / 300 / 600ms**. Discreet reveals (fade + 12px), no parallax, no custom cursor. Signature microinteraction: an underline that grows from the left on links and arrows that slide 3px on hover.
</motion_signature>

---

<signature_moves>
## 3. Signature moves

1. **Typographic hero:** a big title aligned to the grid, a literal subtitle, a solid CTA — and lots of white space.
2. **Numbers as imagery:** real metrics in display type (tabular-nums) with a short caption.
3. **Editorial index:** a numbered list of services with thin rules and a hover that reveals one sentence.
4. **Allowed highlight moment (one):** a full-width band in the brand color, or a static color field (blur library: *Duotone* or *Radial Ramp*) behind the hero.
5. **Footer as a sitemap:** organized columns, visible contact, a real address.
</signature_moves>

---

<tech_stack>
## 4. Recommended stack
HTML/CSS (or React + Tailwind + shadcn) · self-hosted fonts · no scroll libraries · animations with CSS transitions or WAAPI · AVIF/WebP images with width/height.
</tech_stack>

---

<anti_patterns>
## 5. Anti-patterns
Generic purple gradient · 3 "benefit" cards with random icons · a carousel in the hero · stock photo of a handshake · animating everything · a low-contrast ghost CTA.
</anti_patterns>

---

<qa_rubric>
## 6. QA
`web-audit` ≥ 90 · `web-scrap`: `spacingOn4pxGrid` ≥ 85%, ≤ 2 vivid colors, `aesthetic.primary` = corporate-modernist · `web-motion`: no duration > 700ms · LCP ≤ 2.5s.
</qa_rubric>
