# 04 · 100 Things Every Designer Needs to Know About People — Perception, Attention and Motivation

<module_meta>
  <source>100 Things Every Designer Needs to Know About People — Susan Weinschenk (an original distillation)</source>
  <router_trigger>Load when deciding visual focus, emotional climax, persuasion, microcopy, onboarding, information density and conversion.</router_trigger>
  <enforcement_level>GUIDED — use it as a decision lens; cite the rule when it changes a choice.</enforcement_level>
  <pairs_with>05 (hierarchy) · 12 (animation) · 20 (laws of UX) · 23 (message)</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axioms

### How people see
1. **The periphery sets the mood; the center reads the detail.** Background, color field and composition are perceived before the text — that is why the hero's gradient is emotion and the title is information.
2. **Faces and gazes capture attention** and lead the eye to wherever the face is looking.
3. **Patterns are recognized before they are read.** Proximity, similarity and common region create structure effortlessly.
4. **Motion in the periphery is irresistible.** Use it to orient, never to compete with the task.
5. **Contrast and size beat color** for hierarchy (≈ 8% of men have some color vision deficiency).

### How they think and remember
6. **Working memory is small** (≈ 3–4 chunks). Group things and reveal them progressively.
7. **Recognizing is easier than recalling.** Show options; don't make people type from scratch.
8. **Mental models come from past experience.** Align the interface with what the audience already knows.
9. **Stories and concrete examples** are processed and remembered better than abstractions.

### What motivates
10. **Visible progress increases engagement** (the goal-gradient effect).
11. **Surprise and variable reward** hold attention — that is why delightful microinteractions work.
12. **Social proof reduces uncertainty.** Scarcity and exclusivity raise perceived value — use them honestly.
13. **Too many choices paralyze.** Highlight the recommended option.
14. **People decide by intuition and justify afterwards:** the first aesthetic impression becomes credibility.
15. **The peak and the end** are what people remember of an experience.
</core_axioms>

---

<agent_traps>
## 2. Guard against manipulation and noise

- **Forbidden:** fake scarcity ("today only!"), made-up urgency counters, fabricated social proof.
- **Forbidden:** continuous motion in the periphery while the user reads or fills in a form.
- **Forbidden:** filling the fold with competing stimuli: **one** focal point per section.
- Personality ≠ noise: the emotional climax happens **once** per page.
</agent_traps>

---

<design_engineering>
## 3. Applied

| Decision | Rule | Implementation |
|----------|------|----------------|
| Where the "wow" lives | peak-end (15) | one climax (shader, particle morph, transition) + a strong ending (footer/CTA) |
| Page rhythm | attention (4) and memory (6) | alternate dense sections and breathing room; blocks of 3–5 items |
| Button microcopy | mental model (8) | verb + result: "Install the skill", "See the 23 books" |
| Cursor and hover | feedback (11) | confirm interactivity before the click |
| Long flows | progress (10) | numbered steps and a progress bar |
| Plans/options | choice (13) | 3 options, the recommended one highlighted |
</design_engineering>

---

<review_checklist>
## 4. Rubric

- [ ] Each section has a single focal point (check the capture: where does the eye go first?).
- [ ] Information grouped in blocks of 3–5 items.
- [ ] Motion orients (what changed, where to look) and does not compete with reading.
- [ ] There is real social proof near the conversion CTA.
- [ ] A memorable climax and ending can be spotted in the scroll spritesheet.
</review_checklist>

---

<few_shot>
## 5. Example
**Bad:** four cards animating in a loop next to the contact form.
**Good:** a static form, one real testimonial beside it, and the animation saved for the submission confirmation (a reward at the end).
</few_shot>
