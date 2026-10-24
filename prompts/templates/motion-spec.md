# Template · motion spec

```css
:root {
  /* Durations */
  --motion-instant: 100ms;   /* toggles, pressed */
  --motion-fast: 180ms;      /* hover, focus */
  --motion-base: 380ms;      /* states, menus, modals */
  --motion-slow: 900ms;      /* reveals and choreography */
  /* Easings */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1);
  --ease-spring-soft: cubic-bezier(0.34, 1.56, 0.64, 1); /* light overshoot, use sparingly */
}
@media (prefers-reduced-motion: reduce) {
  :root { --motion-fast: 0ms; --motion-base: 0ms; --motion-slow: 0ms; }
}
```

## Choreography

| # | Trigger | Elements | Properties | Duration | Stagger / delay | Easing | Reduced-motion |
|---|---------|----------|------------|----------|-----------------|--------|----------------|
| 1 | enters the viewport (top 80%) | title lines | translateY 105% → 0 (mask) | slow | 80ms per line | ease-out-expo | appears without displacement |
| 2 | hover on the CTA | button background | scaleY 0 → 1 (bottom origin) | fast | — | ease-out-quart | direct color change |
| 3 | scroll 0–100% of the section | section card | scale 1 → 0.92, radius 0 → 24px | scrub | — | linear (scrub) | no effect |

## Microinteractions (Saffer)

| Name | Trigger | Rules | Feedback | Loops / modes |
|------|---------|-------|----------|---------------|
| Copy prompt | click on the button | copies to the clipboard; selection fallback | the label becomes "Copied ✓" for 2.4s + a toast | back to the original label |

## Budget
- Max elements animating at once: <n>
- Allowed properties: transform, opacity (+ occasional filter)
- Target: 60 fps on a laptop with integrated graphics · `web-record-frames` → `pageFrames.longFrames` ≤ 5%
