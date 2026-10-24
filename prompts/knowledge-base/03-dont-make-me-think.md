# 03 · Don't Make Me Think — Obvious, Scannable, Frictionless Usability

<module_meta>
  <source>Don't Make Me Think, Revisited — Steve Krug (an original distillation for agents)</source>
  <router_trigger>Load when designing navigation, a hero, CTAs, forms, page hierarchy, or when auditing the UX of any interface — experimental ones included.</router_trigger>
  <enforcement_level>STRICT — experimental must never mean illegible.</enforcement_level>
  <pairs_with>05 (hierarchy) · 18 (signifiers) · 20 (laws of UX) · 22 (accessibility)</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axioms

1. **Obvious beats clever.** Every screen should be self-explanatory; when it can't be, at least self-evident at a one-second glance.
2. **People scan, they don't read.** They hunt for words that match their task and click the first "good enough" option.
3. **People muddle through, they don't figure things out.** The interface must tolerate "wrong" use without punishing it.
4. **Clicks without doubt beat fewer clicks.** Three obvious clicks > one ambiguous click.
5. **Cut the words in half — then cut again.** Welcome text and instructions are rarely read.
6. **Conventions are allies.** The logo at the top-left goes home; a magnifier is search; the active nav item is highlighted.
7. **Navigation always answers:** where am I, what is here, where can I go, how do I get back.
8. **The home page has one job:** say in 5 seconds what it is, who it is for and what the next action is.
9. **Test early, with few people.** Three people per round reveal most of the serious problems.
10. **The reservoir of goodwill:** every friction (a popup, an unnecessary field, a hidden price) drains patience — and it does not come back.
</core_axioms>

---

<agent_traps>
## 2. Guard against "illegible creativity" (agent traps)

- **Forbidden:** a hero with a poetic line and no literal subtitle explaining the product.
- **Forbidden:** three equal-weight buttons side by side. One primary, one secondary, the rest become links.
- **Forbidden:** an icon without a label for a rare action (its meaning is not universal).
- **Forbidden:** repeated "Click here" / "Learn more": the link text describes the destination.
- **Forbidden:** a preloader or entrance animation that holds the content back for more than 2.5s (a deliberate, skippable gate — like a sound switch — is the exception, and it always offers a way straight to the goal).
- **Forbidden:** scroll-jacking that changes the speed or direction of the native wheel without a narrative reason.
- **The double-reading rule:** the **first reading is conventional** (navigation, CTA, main text); the **second is surprising** (type, motion, transition). Daring lives in the second.
</agent_traps>

---

<design_engineering>
## 3. Applied to high-end interfaces

### 3.1 A hero that survives the 5-second test
```
[ brand ]                                [ short navigation ]   [ primary CTA ]
EXPRESSIVE TITLE (it may be poetic)
Literal subtitle: what it is · who it is for · the result
[ primary CTA ]  [ secondary link ]
short proof (logos, a number, a quote) ─────────────── visual climax (shader/3D) beside or behind
```
### 3.2 Forms
Visible labels (never only a placeholder) · inline errors when leaving the field · nothing required without a reason · the button says what happens ("Send proposal", not "Submit").
### 3.3 Navigation on experimental sites
An overlay menu is allowed, but: the button says "Menu", has a visible focus, closes with Esc and returns focus to the button.
### 3.4 Mobile
The main CTA within thumb reach and above the fold; targets ≥ 44px; never hover as the only way to reveal information.
</design_engineering>

---

<review_checklist>
## 4. Rubric (check it with the toolkit)

| Check | How to prove it |
|-------|-----------------|
| 5 seconds: what it is, who it is for, next action | `web-screenshot` of the fold — read it and answer the 3 questions without scrolling |
| One dominant primary CTA per screen | `web-control inventory` + a capture |
| Links and buttons look clickable without hover | `web-interactions` → "no hover feedback" = fail |
| Active nav item highlighted | captures of inner pages |
| CTA above the fold on mobile | `web-screenshot --viewport 390x844` |
| Form with labels and inline errors | `web-audit` (input-label) + a manual test with `web-control type` |
</review_checklist>

---

<few_shot>
## 5. Example

**Bad:** "We build tomorrow, today." + buttons "Learn more", "Discover", "Explore".
**Good:** "We build tomorrow, today." + the subtitle "Practice management software for veterinary clinics — scheduling, records and billing in one place." + the CTA "Book a demo" + the link "See pricing".
</few_shot>
