# 14 · Thinking with Type — Letter, Text and Grid as a Voice

<module_meta>
  <source>Thinking with Type — Ellen Lupton (an original distillation)</source>
  <router_trigger>Load when choosing fonts, building a type scale, composing expressive titles, using variable fonts (Hover Font) or reviewing the legibility of running text.</router_trigger>
  <enforcement_level>STRICT for running-text legibility; GUIDED for expressive display.</enforcement_level>
  <pairs_with>05 · 15 · 16 · 22</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axioms

### Letter
1. **Type has anatomy and a voice.** x-height, aperture, stroke contrast and terminals define the personality before the content does.
2. **Pair by contrast, not similarity:** geometric sans + italic serif; grotesque + mono. Two families are enough; three is the limit.
3. **Variable fonts are a material:** weight (wght), width (wdth), optical size (opsz) and italic axes allow hierarchy and motion without swapping files.

### Text
4. **Measure:** 45–75 characters per line for body text; 30–45 in narrow columns and on mobile.
5. **Leading** grows with the measure and shrinks with the size (body 1.5–1.7; display 0.85–1.05).
6. **Tracking:** negative on large display, positive on small caps, zero on body text.
7. **Left alignment** for running text; centered only for short blocks.
8. **Hierarchy with few signals:** size OR weight OR color per level — stacking all of them shouts.

### Grid
9. **Type sits on a grid:** a shared baseline, consistent margins, columns that align title, text and image.
10. **Intentional asymmetry** (editorial) only works on top of a rigorous grid.
</core_axioms>

---

<expressive_type>
## 2. Expressive display (ambitious/personal)

| Technique | Rule |
|-----------|------|
| **Hover Font** (weight by cursor proximity) | a variable font with a wide wght range (100–900); 120–220px radius; smooth interpolation; **reserve space** for the maximum width (avoids reflow) or use a font with stable widths; off with reduced-motion and on touch |
| **Single-letter hover** | only the letter under the cursor grows (scale from the baseline, spring easing); the neighbors stay still |
| Italic letters mid-word (monopo: "Creat*i*ve") | 1–2 letters per word, the same family with an ital axis |
| Extreme scale contrast | display ≥ 8× the body; the body stays comfortable |
| Masked text (line-by-line reveal) | `overflow: hidden` on the parent, `translateY(105%)` on the child |
| Italic serif mixed into a sans | only on key words (semantic emphasis) |
| Hand-drawn writing | outlines drawn with `stroke-dashoffset`, letter by letter, pulled by a single thread |
</expressive_type>

---

<agent_traps>
## 3. Guard (forbidden)
- More than 3 families or more than 8 sizes on the page.
- Running text in a display font or in a thin weight (< 300) over a textured background.
- All caps in paragraphs.
- A visible fallback font (FOUT without `size-adjust`): use `font-display: swap` + fallback metrics.
- A Hover Font that changes the letters' widths and pushes the layout (CLS).
</agent_traps>

---

<review_checklist>
## 4. Rubric (toolkit)
- [ ] `web-scrap` → `fonts.used`: ≤ 3 families; `fonts.scale`: ≤ 8 sizes.
- [ ] Body measure 45–75 characters (measure on the capture: column width / ~0.5em).
- [ ] `web-audit`: no text < 12px on mobile.
- [ ] CLS ≤ 0.1 with the Hover Font active (`web-scrap` → `perf.cls` after `web-control mousemove`).
</review_checklist>
