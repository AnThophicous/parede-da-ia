# 05 · Refactoring UI — Hierarchy, Space, Type, Color and Depth as a System

<module_meta>
  <source>Refactoring UI — Adam Wathan & Steve Schoger (an original distillation)</source>
  <router_trigger>Load for ANY interface build or fix. It is the router's most used module.</router_trigger>
  <enforcement_level>STRICT — values off the defined scales are bugs, not style.</enforcement_level>
  <pairs_with>14 (typography) · 15 (grid) · 16 (color) · 21 (tokens)</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axioms

1. **Function before the frame.** Design the functionality (the form, the card) before the page layout.
2. **Start in grayscale.** Hierarchy must work with size, weight and space alone; color comes later.
3. **Systems before pixels:** a spacing scale, a type scale, a palette with tones, shadows and radii defined **before** composing screens.
4. **Emphasis also comes from de-emphasis.** Push the secondary down (lighter gray, lower weight) instead of only enlarging the primary.
5. **Visual hierarchy ≠ semantics.** An `h1` can be small if it is not the visual focus — the tag serves accessibility, the style serves the eye.
6. **Start with too much space** and remove it. Space **between** groups > space **inside** groups.
7. **Running text at 45–75 characters per line.** Don't stretch content to fill the screen.
8. **A real palette has many tones:** 8–10 grays and 5–10 tones per brand/state color, defined by lightness and saturation (OKLCH/HSL), never by opacity.
9. **Light comes from above.** Elevation = a lighter top edge + a shadow below; realistic shadows have two layers.
10. **Borders are the weakest separation tool.** Prefer space, a background change or a shadow.
</core_axioms>

---

<scales>
## 2. Canonical scales (a starting point)

```css
:root {
  /* space (multiples of 4, non-linear progression) */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-5: 24px;
  --space-6: 32px; --space-7: 48px; --space-8: 64px; --space-9: 96px; --space-10: 128px; --space-11: 192px;
  /* type (ratio ~1.25 for text, bigger jumps for display) */
  --text-xs: 12px; --text-sm: 14px; --text-base: 16px; --text-lg: 18px; --text-xl: 20px; --text-2xl: 24px;
  --text-3xl: 30px; --text-4xl: 36px; --text-5xl: 48px; --text-6xl: 60px; --text-7xl: 72px; --text-display: clamp(64px, 12vw, 220px);
  /* radius and shadow */
  --radius-sm: 4px; --radius-md: 8px; --radius-lg: 16px; --radius-pill: 999px;
  --shadow-1: 0 1px 2px rgb(0 0 0 / .06), 0 1px 1px rgb(0 0 0 / .04);
  --shadow-3: 0 10px 24px -6px rgb(0 0 0 / .18), 0 2px 6px rgb(0 0 0 / .08);
  --shadow-5: 0 40px 80px -20px rgb(0 0 0 / .35), 0 8px 24px rgb(0 0 0 / .12);
}
```
Line-height inversely proportional to size (body 1.5–1.7; display 0.85–1.1). Negative tracking on large headings (−0.02 to −0.06em); positive on small caps (+0.06 to +0.14em). Numbers in tables with `tabular-nums`.
</scales>

---

<agent_traps>
## 3. Guard against "everything shouts the same"

- **Forbidden:** three levels of text with the same weight, size and color.
- **Forbidden:** gray on a colored background (use a tone of the same hue).
- **Forbidden:** communicating state with color alone (pair it with an icon, text or shape).
- **Forbidden:** scaling a 16px icon up to 48px; use a container with a background.
- **Forbidden:** equal-weight buttons competing for attention: primary solid, secondary outline/tonal, tertiary a link.
- **Empty states** are the first impression of many screens: illustration/icon + explanation + action.
</agent_traps>

---

<review_checklist>
## 4. Rubric (verifiable)

| Criterion | Command |
|-----------|---------|
| Spacing on the scale (≥ 85% on the 4px grid) | `web-scrap` → `layout.spacingOn4pxGrid` |
| Font sizes from the scale (≤ 8 distinct sizes) | `web-scrap` → `fonts.scale` |
| AA contrast on 100% of texts | `web-audit` / `web-scrap` → `contrast` |
| hover/focus/active/disabled states defined | `web-interactions` |
| The screen works in grayscale | apply `filter: grayscale(1)` with `web-eval "document.documentElement.style.filter='grayscale(1)'"` and capture |
| Radii and shadows from a small set | `web-tokens` → `radius` and `shadow` groups |
</review_checklist>

---

<few_shot>
## 5. Example — a card without and with hierarchy
```css
/* bad: everything shouts the same */
.card h3, .card p, .card span { font: 700 20px/1.2 var(--font-sans); color: #000; }

/* good: primary, secondary, tertiary */
.card h3   { font: 600 20px/1.25 var(--font-sans); letter-spacing: -0.01em; color: var(--gray-900); }
.card p    { font: 400 16px/1.6 var(--font-sans); color: var(--gray-600); }
.card span { font: 500 12px/1 var(--font-sans); letter-spacing: .08em; text-transform: uppercase; color: var(--gray-500); }
```
</few_shot>
