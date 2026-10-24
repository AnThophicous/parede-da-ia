# 18 · The Design of Everyday Things — Affordances, Signifiers, Mapping and Error

<module_meta>
  <source>The Design of Everyday Things (revised ed.) — Don Norman (an original distillation)</source>
  <router_trigger>Load when designing unconventional controls (draggable canvases, custom cursors, experimental menus, sliders, gestures, switches), error states and any interface "nobody understands how to use".</router_trigger>
  <enforcement_level>STRICT — expressive interfaces need even clearer signifiers.</enforcement_level>
  <pairs_with>03 · 11 · 20 · 22</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axioms

1. **An affordance** is the relationship between an object and a person (what can be done); **a signifier** is the signal that says where and how to act. On screen, almost everything depends on signifiers.
2. **Natural mapping:** controls relate spatially to what they control (the slider moves in the direction of the effect).
3. **Immediate, informative feedback** for every action — including "nothing happened because…".
4. **Conceptual model:** the user needs to form a simple explanation of how the system works; the interface should teach it.
5. **Constraints** (physical, cultural, semantic, logical) prevent errors before they happen.
6. **The two gulfs:** execution (how do I do it?) and evaluation (did it work?). Good design shortens both.
7. **Error belongs to the design, not the person.** Tell slips from mistakes (a wrong model) and design undo instead of confirmations.
8. **Knowledge in the world > knowledge in the head:** show options instead of demanding memory.
</core_axioms>

---

<design_engineering>
## 2. Applied to expressive interfaces

| Interface | Mandatory signifier |
|-----------|---------------------|
| A canvas with draggable elements (playful-canvas) | `cursor: grab/grabbing`, a shadow that grows on pick-up, a "drag me" hint on the first visit, a restorable position |
| A custom cursor | never hide the cursor in text fields; never cover the target's own text; labels only where the target has none |
| An experimental overlay menu | a button with the word "Menu"; Esc closes it; focus trapped inside the open menu |
| Pinned horizontal scroll | a progress and direction hint; don't hijack the wheel without a visual cue |
| A physical metaphor (lever, switch, dial) | it looks grabbable, moves in the expected direction, gives a detent and a sound/light when it trips, and has a keyboard and a no-gesture alternative |
| Hover Font / proximity effects | purely decorative — they never carry essential information |
| Mobile gestures | a button alternative for every gesture |
</design_engineering>

---

<agent_traps>
## 3. Guard (forbidden)
- Interactive elements indistinguishable from decoration.
- A destructive action without undo (or without a confirmation when undo is impossible).
- "Easter eggs" that hide necessary functions.
- An error message that blames the user or doesn't say how to fix it.
</agent_traps>

---

<review_checklist>
## 4. Rubric
- [ ] `web-interactions`: every interactive element changes on hover/focus and has a coherent cursor.
- [ ] `web-control inventory` lists no clickable element without a label.
- [ ] The gulf-of-evaluation test: after each action, does the capture show the result?
- [ ] Every destructive action has an undo.
</review_checklist>
