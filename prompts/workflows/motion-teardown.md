# Workflow · motion-teardown

<module_meta>
  <role>Dissects and specifies motion: scroll animations, section transitions and microinteractions. Produces an implementable motion spec.</role>
  <enforcement_level>GUIDED — measure before giving an opinion; specify before implementing.</enforcement_level>
  <pairs_with>knowledge-base/11 (microinteractions) · 12 (12 principles) · 13 (interface animation) · 20 (Doherty, peak-end) · templates/motion-spec.md</pairs_with>
</module_meta>

---

<measure>
## 1. Measure

```bash
web-motion                                   # declared vocabulary: durations, easings, props, @keyframes, GSAP/ScrollTrigger
web-motion --observe 4 --while "scroll-down 3000 --steps 60"   # what really animates (works with bundled GSAP)
web-interactions --limit 12                  # hover / :active / focus / magnetic, with a before/after sheet
web-record-frames --while "scroll-down 5000 --steps 100" --interval 0.2      # choreography
web-record-frames --selector "<button>" --interval 0.05 --duration 1.5 --while "hover <button> --hold 1s"   # micro, up close
```
Read `pageFrames` in the manifest: many `longFrames` = jank; the effect needs another technique (transform/opacity, fewer elements, targeted `will-change`).
</measure>

---

<interpret>
## 2. Interpret with an animation vocabulary

| Observation | Reading | Module |
|-------------|---------|--------|
| `cubic-bezier(0.16, 1, 0.3, 1)` / `(0.19, 1, 0.22, 1)` dominant | expo-out: fast entrance, long settle — the "premium" feel | 12 · slow in/out |
| 600–1250ms durations on reveals | editorial choreography; fine for entrances, too long for feedback | 13 · timing |
| hover feedback > 300ms | slow: hover should answer in 150–250ms | 11 · feedback · 20 · Doherty |
| `part--first/second` spans with `translate3d(0, ±150%)` | masked line reveal (overflow hidden) | 12 · staging |
| `matrix3d` on `main` | transform-based smooth scroll (Locomotive/virtual) — an accessibility cost | 13 · a11y |
| a hover transform that follows the cursor | magnetic effect | 11 · loops and modes |
| no `prefers-reduced-motion` rule | accessibility debt, always report it | 22 |
</interpret>

---

<specify>
## 3. Specify (use `templates/motion-spec.md`)

- **Tokens:** `--motion-fast` (150–200ms) feedback · `--motion-base` (300–450ms) states · `--motion-slow` (700–1200ms) choreography · named easings (`--ease-out-expo`, `--ease-in-out-quart`).
- **Choreography table:** trigger → elements → properties → duration → delay/stagger → easing → reduced-motion.
- **Microinteractions:** trigger, rules, feedback, loops/modes `[11]` for each one.
- **Budget:** maximum number of elements animating at once, allowed properties (transform, opacity, filter sparingly), a 60 fps target on a laptop with integrated graphics.
</specify>

---

<rules>
## 4. Non-negotiable rules

1. Animate **transform and opacity**. Avoid animating `width/height/top/left/box-shadow` in loops.
2. Interaction feedback starts in **≤ 100ms** and ends in **≤ 300ms**.
3. Large motion needs a **reduced-motion fallback**: swap displacement for a short fade or the final state directly.
4. No scroll-jacking that changes the speed or direction of the native wheel without a strong narrative reason.
5. The climax gets **one** memorable choreography. Everything else is quiet (peak-end `[20]`).
</rules>
