# Aesthetic · playful-canvas — The Portfolio's Living Board

<aesthetic_meta>
  <archetypes>personal / portfolio (primary) · small studios</archetypes>
  <use_when>Portfolios of designers, creative developers, product designers and studios that want to show process, tools and personality — "the site is my workspace".</use_when>
  <avoid_when>Traditional corporate; audiences that need fast, linear reading (the canvas demands curiosity).</avoid_when>
  <books>18 (signifiers) · 11 (microinteractions) · 12 (animation) · 14 (type) · 22 (accessibility)</books>
  <reference_studied>The "sarah." portfolio, sent as a video and read with media-frames (Oct/2026): a cream canvas with a drafting-board grid; a giant wordmark in a heavy geometric sans inside a Figma-style selection box (8 handles); colored multiplayer cursors with role labels ("ui designer", "creative developer", "frontend developer"); tool icons in tiles; a comment bubble; tilted cards (a laptop with an image, a "portfolio" card, a code card); everything draggable; a trail of grid cells following the cursor; on scroll, the canvas becomes a rounded card that recedes and reveals a dark section with "NOT JUST ANOTHER DEVELOPER." in thin gray caps with a reddish-orange period and projects floating at an angle.</reference_studied>
</aesthetic_meta>

---

<visual_dna>
## 1. Visual DNA

| Axis | Rule |
|------|------|
| Background | paper/cream (`#efebe5`–`#f4f1ec`) with a **drafting-board grid** (1px lines at 4–6% opacity, 48–64px cells) |
| Typography | a wordmark in a heavy geometric sans (800–900), 12–18vw, tight tracking; UI in a small neutral sans; code in mono |
| Color | warm neutrals + **5–6 saturated sticker colors** (green, purple, magenta, cyan, orange) used on small areas: cursors, tags, icons |
| Objects | white cards with a soft shadow and a −6° to +6° rotation; device mockups; icon tiles with a 12px radius |
| Metaphors | a design tool: a selection box with handles, a comment with an avatar, a toggle ("AI mode"), multiplayer cursors |
| Transition | a dark section with huge thin type (300) in gray and a single colored accent |
</visual_dna>

---

<motion_signature>
## 2. Motion
"Elastic and playful": a light spring (overshoot 1.2–1.5), 180 / 350 / 700ms. Multiplayer cursors drift along smooth (noise) paths and "click" now and then. Dragging has short inertia and a slight rotation in the direction of motion.
</motion_signature>

---

<signature_moves>
## 3. Signature moves (with recipes in `library/`)
1. **Selectable wordmark:** a selection box with handles around the name; draggable. (`library/motion/draggable-canvas.js`)
2. **Pixel trail:** grid cells light up under the cursor and fade in 400–700ms. (`library/motion/pixel-trail.js`)
3. **Multiplayer cursors** labeled with roles/skills, each in a sticker color.
4. **Draggable stickers and cards** with light physics; positions saved in `localStorage`.
5. **Card stack:** the whole canvas becomes a card (scale 1 → 0.9, radius 0 → 32px) and reveals the next section. (`library/motion/card-stack.css`)
6. **A dark manifesto section** with a giant thin title and projects floating in perspective.
</signature_moves>

---

<accessibility_guard>
## 4. Accessibility guard
- Every draggable piece is also **reachable as a linear list** (logical DOM order; projects as normal links).
- `cursor: grab/grabbing`, a "drag me" hint on the first visit, a "tidy up" button that resets positions.
- Pixel trail and fake cursors: `aria-hidden`, off on touch and with `prefers-reduced-motion`.
- Fake cursors never imitate the real cursor to the point of confusing people.
</accessibility_guard>

---

<anti_patterns>
## 5. Anti-patterns
A canvas with no way out (the visitor can't find the projects) · elements falling off-screen when dragged · 15 stickers (it becomes a mess) · sticker colors on long texts.
</anti_patterns>

---

<qa_rubric>
## 6. QA
`web-control drag "<card>" +240,+120` and a capture · `web-interactions` on the cards (grab cursor, shadow) · `web-record-frames --while "mousemove ..."` for the trail · mobile `web-audit`: the canvas becomes a stacked layout with no overflow · `web-scrap`: `aesthetic.primary` = playful-canvas.
</qa_rubric>
