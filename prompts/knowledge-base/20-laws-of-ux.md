# 20 · Laws of UX — Applied Psychology as Verifiable Rules

<module_meta>
  <source>Laws of UX — Jon Yablonski (an original distillation)</source>
  <router_trigger>Load when sizing targets, deciding the number of options, response times, navigation, onboarding and when backing layout decisions with evidence.</router_trigger>
  <enforcement_level>STRICT for Fitts, Doherty and Jakob; GUIDED for the rest.</enforcement_level>
  <pairs_with>03 · 04 · 11 · 18</pairs_with>
</module_meta>

---

<core_axioms>
## 1. The laws and how to apply them

| Law | Idea | Practical rule |
|-----|------|----------------|
| **Jakob** | people spend most of their time on other sites | follow conventions for navigation, cart, search, forms |
| **Fitts** | the time to reach a target depends on distance and size | large CTAs close to their context; targets ≥ 44px on mobile, ≥ 24px always |
| **Hick** | more options = slower decisions | reduce visible choices; highlight the recommended one |
| **Miller** | limited working memory | group in blocks of 3–5 |
| **Doherty** | productivity soars with responses < 400ms | immediate feedback; skeletons; optimistic UI |
| **Peak-end** | we remember the peak and the ending | one memorable climax + a strong ending (CTA/footer) |
| **Von Restorff** | the different thing is remembered | one highlighted element per group — not several |
| **Serial position** | we remember the first and last items | key items at the ends of the navigation |
| **Tesler** | complexity doesn't disappear, it moves | absorb complexity in the system, not in the user |
| **Postel** | be liberal in what you accept | tolerant forms (masks, paste, spaces) |
| **Common region / proximity / similarity** | perceptual grouping | use space and background to group before borders |
| **Goal-gradient** | effort grows near the goal | progress bars in flows |
| **Zeigarnik** | unfinished tasks stay in memory | show what is left to finish |
| **Aesthetic-usability** | the beautiful is perceived as easier | visual polish raises tolerance — it doesn't replace usability |
</core_axioms>

---

<agent_traps>
## 2. Guard (forbidden)
- Using a "law" as a decorative justification without measuring.
- A main CTA smaller than secondary links.
- Top menus with 9+ items and no grouping.
- Action feedback above 400ms with no indicator.
</agent_traps>

---

<review_checklist>
## 3. Rubric (toolkit)
- [ ] Fitts: `web-audit` without `tap-target`; CTAs ≥ 44px on mobile.
- [ ] Doherty: `web-interactions` → feedback transitions ≤ 300ms; LCP ≤ 2.5s.
- [ ] Hick: `web-control inventory` on the fold ≤ 7 main interactive elements.
- [ ] Peak-end: the climax and the ending show up clearly in the scroll spritesheet.
</review_checklist>
