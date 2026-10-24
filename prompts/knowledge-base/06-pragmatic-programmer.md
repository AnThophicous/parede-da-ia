# 06 · The Pragmatic Programmer — Craft, Orthogonality and Reversibility

<module_meta>
  <source>The Pragmatic Programmer (20th Anniversary) — Andrew Hunt & David Thomas (an original distillation)</source>
  <router_trigger>Load when planning an implementation, weighing duplication and coupling, choosing an incremental approach or dealing with technical uncertainty.</router_trigger>
  <enforcement_level>STRICT for knowledge DRY and orthogonality; GUIDED for the rest.</enforcement_level>
  <pairs_with>01 · 02 · 07 · 08</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axioms

1. **Own the outcome.** Offer options, not excuses. If something can't be done, say what can.
2. **Don't live with broken windows.** One unrecorded hack invites ten. Fix it or document it with a deadline.
3. **DRY is about knowledge, not text.** Every rule has one authoritative representation. Similar snippets that change for different reasons are **not** duplication.
4. **Orthogonality:** changing one thing does not require changing unrelated things. Test: "if I swap X, how many modules break?"
5. **Reversibility:** no decision is final. Isolate vendors, formats and engines (animation, 3D, CMS) behind boundaries.
6. **Tracer bullets:** a thin end-to-end path early (UI → data → deploy), then fatten it.
7. **Prototypes are disposable** and exist to learn.
8. **Fail early and loudly:** validate inputs at the edges with useful messages.
9. **Don't program by coincidence.** If it works and you don't know why, it doesn't work yet.
10. **Automate what repeats** (build, visual QA, deploy).
</core_axioms>

---

<agent_traps>
## 2. Guard against waste (agents)

- **Forbidden:** polishing one isolated layer for hours without end-to-end integration.
- **Forbidden:** "poking at several things until the bug goes away": isolate the change that fixed it and explain the mechanism.
- **Forbidden:** copying the same animation config into 12 components: create tokens/hooks.
- **Forbidden:** wiring an analytics, CMS or 3D SDK straight into presentation components.
</agent_traps>

---

<design_engineering>
## 3. Applied to design engineering agents

| Principle | Practice |
|-----------|----------|
| Visual tracer bullet | Ship the raw layout and open it with `web-url-fetch` before animating |
| Automated QA | One script: `web-serve` → `web-url-fetch` → `web-audit` → `web-interactions` → `web-record-frames` |
| Broken windows | A console warning, a contrast failure or jank in the report → fix it in the same iteration |
| Reversibility | Shaders and 3D scenes behind a component with a static fallback (swapping the engine = one file) |
| Token DRY | One source (CSS vars/@theme) feeds CSS, JS (GSAP) and shaders (uniforms) |
</design_engineering>

---

<review_checklist>
## 4. Rubric
- [ ] No business rule or visual token defined in two places.
- [ ] Swapping provider X changes a single adapter.
- [ ] An end-to-end slice runs before any refinement.
- [ ] Every fix has its mechanism explained.
- [ ] Repeated tasks became a script.
</review_checklist>
