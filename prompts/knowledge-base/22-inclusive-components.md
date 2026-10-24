# 22 · Inclusive Components — Accessibility That Actually Works

<module_meta>
  <source>Inclusive Components — Heydon Pickering (an original distillation)</source>
  <router_trigger>Load for every interface with interactive components (menus, tabs, modals, toggles, carousels, forms, tooltips) and whenever there is intense motion, sound or mouse-dependent effects.</router_trigger>
  <enforcement_level>STRICT — WCAG 2.2 AA is the floor, not the goal.</enforcement_level>
  <pairs_with>03 · 11 · 13 · 18 · 20</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axioms

1. **Semantic HTML first:** `button` for actions, `a` for navigation, lists for lists, `fieldset/legend` for groups. ARIA fixes what HTML can't express — it doesn't replace it.
2. **Full keyboard:** everything that works with a mouse works with Tab/Shift+Tab/Enter/Space/Esc/arrows.
3. **Visible, predictable focus:** an indicator with ≥ 3:1 contrast; focus trapped in modals; focus returned on close.
4. **Name, role and state** exposed: `aria-expanded`, `aria-pressed`, `aria-selected`, `aria-current`.
5. **Content doesn't depend on hover, color or motion** to be understood.
6. **Optional motion:** `prefers-reduced-motion` respected; nothing flashing more than 3×/s.
7. **Legible, resizable text:** 200% zoom without loss; no text inside images.
8. **Generous targets** (≥ 24×24px; 44px is comfortable).
9. **Sound is opt-in:** a visible mute control, a way in without sound, and nothing essential carried only by audio.
</core_axioms>

---

<components>
## 2. Patterns

| Component | Requirements |
|-----------|--------------|
| Toggle button | `button` + `aria-pressed`; a stable label |
| Menu/disclosure | a button with `aria-expanded` + `aria-controls`; Esc closes |
| Tabs | `role=tablist/tab/tabpanel`, arrows navigate, `aria-selected` |
| Modal | `<dialog>` or Radix Dialog: focus trapped, Esc, focus returned, a linked title |
| Tooltip | appears on hover **and** focus; never holds essential information |
| Carousel | pausable; controls with names; doesn't auto-advance with a screen reader |
| Form | a visible `label` tied to the field; errors with `aria-describedby`; not color alone |
| Switch/lever (a physical metaphor) | `role="switch"` + `aria-checked`; operable with Enter/Space/arrows; a skip link to the goal |
| Cursor effects (Hover Font, magnetic, particles) | decorative: `aria-hidden` on the effect layers; the real text stays accessible; off on touch and with reduced-motion |
| Canvas/WebGL | `aria-hidden` if decorative; if informative, an equivalent text alternative |
| Self-running scroll experiences | the content they tell also exists as plain text; reduced-motion goes straight to the goal |
</components>

---

<agent_traps>
## 3. Guard (forbidden)
- A clickable `div` with no role and no keyboard support.
- `outline: none` without a replacement.
- Text split into per-letter `span`s without keeping the whole text accessible (`aria-label` on the parent — built from the visible lines, not glued together — and `aria-hidden` on the fragments).
- A modal that doesn't return focus.
</agent_traps>

---

<review_checklist>
## 4. Rubric (toolkit)
- [ ] `web-audit`: zero accessibility errors (alt, labels, names, focus, contrast, lang, targets).
- [ ] `web-interactions`: zero "invisible focus".
- [ ] `web-control keypress Tab --repeat 15 --screenshot`: a logical focus order.
- [ ] `web-url-fetch --reduced-motion` + a recording: no large motion.
</review_checklist>
