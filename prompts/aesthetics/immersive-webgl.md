# Aesthetic · immersive-webgl — A Living Scene, Particles and Physics

<aesthetic_meta>
  <archetypes>ambitious (primary)</archetypes>
  <use_when>3D/creative studios, launches of physical or tech products, campaigns and experiences competing for awards.</use_when>
  <avoid_when>Traditional corporate, content sites, audiences on weak devices without a fallback, short deadlines.</avoid_when>
  <books>17 (shaders) · 12 (animation) · 13 · 20 (Doherty) · 22</books>
  <reference_studied>lusion.co, measured with the toolkit (Oct/2026): Astro + Three.js 158; full-screen WebGL2 with ~80 shaders; 3D objects (blue, gray and black shapes) reacting to the cursor and the scroll; virtual scroll (a document the size of the viewport); Aeonik + IBM Plex Mono + LusionMono; blue #0016ec and lime #c1ff00 accents on white; 21MB transferred. Also parede-da-ia's own v0.3 landing: a lever-gated, self-running journey with generative Web Audio, a shader black hole, particle text and tracking eyes.</reference_studied>
</aesthetic_meta>

---

<visual_dna>
## 1. Visual DNA
| Axis | Rule |
|------|------|
| Scene | one leading 3D object/system (shapes, particles, fluid) with coherent lighting |
| Typography | a clean grotesque + a technical mono; text as an HTML layer above the canvas (accessible) |
| Color | a neutral background (white or midnight) + 1–2 saturated accents present in the scene |
| Interaction | the cursor and the scroll are **controls of the scene** (physics, rotation, morph) |
</visual_dna>

---

<signature_moves>
## 2. Signature moves
1. **Text morph:** particles that rearrange into words as you scroll (`library/particles/text-morph.js`).
2. **An object with physics** reacting to the cursor (springs, simple collisions).
3. **Section transitions inside the scene** (the camera travels instead of the page scrolling).
4. **Light post-processing** (bloom, grain, subtle chromatic aberration) — only if the budget allows.
5. **Sound as a gate:** a deliberate gesture (a switch, a lever) unlocks audio, and the visuals sync to its beat — always with a mute control and a way to enter without sound.
</signature_moves>

---

<tech_stack>
## 3. Stack and budget (STRICT)
Three.js (or R3F) · GSAP for camera timelines · progressive loading (Draco/KTX2) · `devicePixelRatio` capped at 1.5 · the scene pauses outside the viewport · a **complete fallback** (image/video + text) for no-WebGL, reduced-motion and weak devices · target: LCP ≤ 2.5s with the HTML text, the scene loads afterwards.
</tech_stack>

---

<anti_patterns>
## 4. Anti-patterns
Content only inside the canvas (inaccessible and invisible to SEO) · 20MB before the first frame · virtual scroll with no hint · a scene at 2× DPR on a laptop · no way to skip straight to the goal (install, contact, buy).
</anti_patterns>

---

<qa_rubric>
## 5. QA
`web-record-frames` → fps and jank · `web-audit` (accessible HTML text, LCP) · `web-url-fetch --reduced-motion` → the fallback shows · `web-scrap` → shaders and `aesthetic.primary` immersive-webgl.
</qa_rubric>
