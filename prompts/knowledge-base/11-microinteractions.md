# 11 · Microinteractions — Trigger, Rules, Feedback, Loops and Modes

<module_meta>
  <source>Microinteractions: Designing with Details — Dan Saffer (an original distillation)</source>
  <router_trigger>Load when designing or reviewing hover, toggles, copy, likes, forms, buttons, cursors, toasts, loading states — any single-purpose interaction.</router_trigger>
  <enforcement_level>STRICT — every microinteraction needs its four parts declared.</enforcement_level>
  <pairs_with>12 · 13 · 18 · 20 · 22 · templates/motion-spec.md</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Anatomy (the four parts)

1. **Trigger** — what starts it: manual (click, hover, key, drag) or system (time, new data, scroll position). A manual trigger must **look actionable** before the action (a signifier `[18]`).
2. **Rules** — what can and cannot happen, in which order, within which limits. Rules are invisible; the user only sees their feedback.
3. **Feedback** — everything that communicates the rules: visuals, motion, sound, haptics, text. **Proportional**: a small action, small feedback; an irreversible action, unmistakable feedback.
4. **Loops and modes** — what happens over time (repetition, expiry, learning) and alternative states (edit mode, drag mode). Avoid modes whenever you can.

### Principles
- **Bring the data forward:** the trigger can show state (e.g., a "Copied ✓" button, a count on the icon).
- **Don't start from zero:** remember the last choice, prefill the obvious.
- **Prevent the error instead of explaining it.**
- **Use what is already on screen** before adding new elements (the button itself becomes the feedback).
- **Signature moment:** one memorable microinteraction can become part of the brand — but only one or two per product.
</core_axioms>

---

<timing>
## 2. Reference timings

| Type | Start | Duration | Easing |
|------|-------|----------|--------|
| Hover / focus | ≤ 50ms | 150–250ms | ease-out |
| Press (active) | immediate | 80–120ms | ease-out |
| Toggle / checkbox | immediate | 150–200ms | ease-in-out |
| Open a menu / modal | immediate | 250–400ms in · 200–300ms out | expo-out / ease-in |
| Toast | immediate | in 300ms · stays 2–4s · out 200ms | ease-out |
| Magnetic (follows the cursor) | continuous | lerp 0.1–0.2 per frame · elastic return 600–1000ms | elastic.out |

Exits faster than entrances. Feedback that takes > 400ms breaks the feeling of cause and effect (the Doherty threshold `[20]`).
</timing>

---

<agent_traps>
## 3. Guard against decoration

- **Forbidden:** a microinteraction without a focus state equivalent to its hover (keyboard users deserve feedback too).
- **Forbidden:** feedback that relies on color alone.
- **Forbidden:** an infinite looping animation with no function (an eternal spinner, an eternal pulse on the CTA).
- **Forbidden:** a magnetic effect on links in running text or on dense navigation elements.
- **Forbidden:** sound without a control and without opt-in.
- **Forbidden:** a custom cursor whose label or disc covers the target's own text.
</agent_traps>

---

<design_engineering>
## 4. Recipes (trigger → rules → feedback → loop)

| Microinteraction | Trigger | Rules | Feedback | Loop/mode |
|------------------|---------|-------|----------|-----------|
| Copy prompt | click | copies; if the API fails, selects the text | a "Copied ✓" label + a message | back to the label after 2.4s |
| Magnetic button | cursor inside the radius | moves up to 35% of the vector; inner text 50% of that | continuous motion + a fill on hover | elastic return on leave |
| Hover Font | cursor near the letters | weight by distance (120–200px radius) | nearby letters thicken | relaxes as it moves away; off with reduced-motion |
| Like / save | click | toggles state; idempotent | the icon fills + scales 1→1.2→1 | the counter updates |
| Drag a card | pointerdown + move | constrained to the container; z-index rises | a larger shadow + a slight rotation | drop with short inertia |
| Breaker switch | drag down | heavy resistance; trips past a detent | a clunk, a light comes on, haptics | stays on; keyboard pulls it too |
</design_engineering>

---

<review_checklist>
## 5. Rubric (check it with `web-interactions`)
- [ ] Every interactive element has a hover change **and** a visible focus.
- [ ] Feedback transitions between 150 and 300ms.
- [ ] `:active` responds (a tactile feel) on CTAs.
- [ ] Magnetic effects only on large, isolated targets.
- [ ] Each microinteraction was described in its four parts in the motion spec.
</review_checklist>
