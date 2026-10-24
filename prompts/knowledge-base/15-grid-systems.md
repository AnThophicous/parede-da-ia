# 15 · Grid Systems in Graphic Design — Order, Module and Visual Economy

<module_meta>
  <source>Grid Systems in Graphic Design — Josef Müller-Brockmann (an original distillation)</source>
  <router_trigger>Load for every corporate project, for editorial layouts and whenever the page "looks misaligned". The base of the corporate-modernist playbook.</router_trigger>
  <enforcement_level>STRICT on corporate; GUIDED in expressive directions (breaking the grid requires a grid).</enforcement_level>
  <pairs_with>05 · 14 · aesthetics/corporate-modernist.md · aesthetics/editorial-brutalist.md</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axioms

1. **The grid is an attitude:** order, clarity and objectivity communicate competence — that is why Swiss modernism is corporate's natural language.
2. **Module:** the page splits into columns and fields with a constant gutter; text, image and empty space take whole fields.
3. **A shared baseline:** vertical spacing is a multiple of the body's line height.
4. **Unequal margins create useful tension** (more breathing room at the bottom/left in editorial layouts).
5. **Empty space is an active element**, not leftover.
6. **Few sizes, few weights, one family** (a neutral grotesque) — hierarchy comes from the position on the grid.
7. **Image and text align to the same lines.**
8. **Breaking the grid is a rare, intentional gesture** — an element that bleeds, a title that crosses columns.
</core_axioms>

---

<blueprints>
## 2. Approved grids

```css
/* 12 fluid columns with a fixed gutter (corporate/SaaS) */
.grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: clamp(16px, 2vw, 32px); padding-inline: clamp(16px, 4vw, 64px); max-width: 1440px; margin-inline: auto; }

/* Asymmetric editorial: 4 columns of 3 + a breathing column */
.editorial { display: grid; grid-template-columns: 1fr repeat(4, minmax(0, 3fr)) 1fr; column-gap: 24px; }

/* Vertical rhythm: multiples of the line height (24px) */
:root { --baseline: 24px; } section { padding-block: calc(var(--baseline) * 5); }
```

| Layout | Columns | Use |
|--------|---------|-----|
| Institutional | 12 | content on 8, aside on 4; text on 6–7 columns |
| Product landing | 12 | hero 7/5, features 4/4/4, proof 6/6 |
| Editorial | 4+2 | the title crosses 3, text on 2, the image bleeds |
| Portfolio | 6 | a project grid 3/3 or 2/2/2 with a rhythm of heights |
</blueprints>

---

<agent_traps>
## 3. Guard (forbidden)
- "Almost aligned" elements (2–8px differences between edges that should coincide).
- A gutter that changes between sections.
- Text spanning 12 columns on desktop (a huge measure).
- Centering everything for lack of a decision.
</agent_traps>

---

<review_checklist>
## 4. Rubric
- [ ] `web-scrap` → `layout.maxContentWidth` coherent (e.g., a 1200–1440 container, 640–720 for text).
- [ ] The edges of titles, texts and images coincide on the captures (overlay a grid with `web-eval` if needed).
- [ ] Vertical spaces are multiples of the baseline (`layout.spacingScale`).
- [ ] At most one intentional grid break per section.
</review_checklist>
