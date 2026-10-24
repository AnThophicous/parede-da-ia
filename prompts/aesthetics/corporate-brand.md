# Aesthetic · corporate-brand — The Brand Leads

<aesthetic_meta>
  <archetypes>corporate (primary) · personal with a strong brand</archetypes>
  <use_when>Companies with a colorful identity and their own voice (mobility, retail, food, B2C fintechs, mature startups) that want to be remembered without giving up conversion.</use_when>
  <avoid_when>Conservative sectors without an expressive brand manual; when the brand color fails contrast and there is no accessible tone.</avoid_when>
  <books>19 (brand) · 16 (color) · 23 (message) · 11 (microinteractions) · 12 (animation)</books>
  <reference_studied>beetogreen.com — measured with the toolkit (Oct/2026): Nuxt + GSAP 3.15 + ScrollTrigger + Lenis + Lottie; Instrument Sans (text) + Parkinsans (rounded display); deep green #0c1e18, lime #e6ff55 and pastels (cream, lilac, peach, mint); a dark organic ribbon crossing the hero over video; pill buttons; 600ms with cubic-bezier(0.32, 0.72, 0, 1) on 58% of the transitions; text column ~770px.</reference_studied>
</aesthetic_meta>

---

<visual_dna>
## 1. Visual DNA

| Axis | Rule |
|------|------|
| Typography | a display face with personality (rounded, geometric or condensed) for headings + a neutral sans for text; headings 56–120px at weight 600–800 |
| Color | the brand color leads **on large surfaces** (sections, shapes), derived pastel tones for card backgrounds, a deep brand dark for text |
| Form | one **brand shape** (ribbon, wave, blob, asterisk) returns as a common thread; generous radii and pills |
| Imagery | photography of real people using the product/service, with a coherent color treatment |
| Icons | a custom system or a consistent library (e.g., Iconify/Lucide) in the brand color |
</visual_dna>

---

<motion_signature>
## 2. Motion
A "fluid and confident" language: `cubic-bezier(0.32, 0.72, 0, 1)` (soft out), durations 200 / 400 / 600–1000ms. The brand shape **draws or slides** with the scroll (scrub). A short preloader (≤ 1.5s) with the shape/logo in Lottie or SVG.
</motion_signature>

---

<signature_moves>
## 3. Signature moves
1. **A brand shape crossing the hero** (an SVG path with `stroke-dashoffset` or a mask) over a photo/video.
2. **A title in the brand color with an asterisk/glyph** that leads to a note (proof).
3. **Pastel cards** with an illustration/icon and a hover that lifts + tilts 1–2°.
4. **A strip of client logos** (authorized) in a slow marquee.
5. **An interactive simulator/calculator** (creates value and a lead).
</signature_moves>

---

<accessibility_guard>
## 4. Accessibility guard
Vibrant brand colors (lime, yellow) **do not work for text on white**: use them as a background with dark text, or create a darkened tone for text. Text over video needs an overlay and a manual check (`web-audit` marks it "uncertain").
</accessibility_guard>

---

<anti_patterns>
## 5. Anti-patterns
Brand color on everything (it becomes noise) · the brand shape in every section · a heavy background video without a poster · a 1MB Lottie in the preloader.
</anti_patterns>

---

<qa_rubric>
## 6. QA
`web-audit` ≥ 88 · AA contrast verified with the brand colors · `web-motion`: one dominant easing · total weight ≤ 3MB on the first visit.
</qa_rubric>
