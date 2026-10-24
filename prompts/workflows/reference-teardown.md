# Workflow · reference-teardown (v0.3)

<module_meta>
  <role>Dissects a reference (URL, video or screenshot) and turns it into actionable visual DNA. Understand why it works — never copy it.</role>
  <enforcement_level>STRICT on rights: extract principles, systems and measurements; never third-party assets without a license.</enforcement_level>
  <pairs_with>knowledge-base/05 · 12 · 16 · 17 · aesthetics/*.md · workflows/motion-teardown.md</pairs_with>
</module_meta>

---

<capture>
## 1. Capture

### URL
```bash
web-url-fetch <url>
web-wait-page-load                     # preloader? → web-wait 8 --until-hidden "<selector>"
web-scrap                              # likely aesthetic, stack, palette, type, gradients, vitals
web-motion --observe 4 --while "scroll-down 3000 --steps 60"
web-screenshot --hide-banners          # first fold (what is seen in 5 s)
web-screenshot --viewports desktop,mobile --full-page --scroll-through --hide-banners
web-record-frames --while "scroll-down 8000 --steps 160 --interval 50ms" --interval 0.25
web-interactions --limit 8
web-record-frames --while "mousemove 100,450 1340,450 720,120 720,800 --steps 40" --interval 0.15
web-close
```
`scrolledBy: 0` with `virtualScroll: true` in `web-control` = virtual scroll (WebGL/transform): trust the spritesheets.

### Video (a screen recording sent by the user)
```bash
media-frames <file.mp4>                 # ~24 frames + a numbered contact sheet
media-frames <file.mp4> --scenes 0.25   # one frame per cut/transition
media-frames <file.mp4> --from 12 --to 18 --every 0.2   # a microinteraction up close
```

### Screenshot
Read the image; describe composition, type, color, texture and what looks interactive.
</capture>

---

<dna_sheet>
## 2. DNA sheet (fill it from the JSON and the images)

```yaml
reference: <url | file>
aesthetic: <aesthetic.primary> (+ <aesthetic.secondary>) — confirmed? yes/no, why
stack: [framework, motion, scroll, 3D/shaders]
typography:
  display: <family, weight, max size, tracking, variable axes>
  text: <family, size, line-height>
  signature: <e.g., italic letters mid-word, weight reacting to the cursor>
  scale: <fonts.scale>  # largest/smallest ratio
color:
  background: <colors.background>
  text: <colors.text>
  accents: <colors.accent>
  field: <CSS gradients or shader: closest type in the blur library>
motion:
  durations: <web-motion transitions.durations>
  easings: <web-motion transitions.easings>
  choreography: [masked reveal, parallax, pin, scrub, card stack, morph…]
  microinteractions: <web-interactions: hover/focus/magnetic>
  scroll: <Lenis/Locomotive/native · options>
climax: <the most memorable moment, section, how it comes in and leaves>
conventions: [what is safe and conventional]
bold_moves: [what surprises]
costs: [weight, LCP, jank (pageFrames), contrast, accessibility]
```
</dna_sheet>

---

<synthesis>
## 3. Synthesize for the user

1. **Three transferable principles**, with the why and where to apply them in their project.
2. **What to avoid**, with toolkit numbers (weight, LCP, contrast failures, missing reduced-motion).
3. **Suggested tokens** (`web-tokens` as a starting point, then adapted to their brand).
4. **Evidence**: paths to the images, spritesheets, contact sheets and JSONs.
</synthesis>
