# 17 · The Book of Shaders — Fields, Noise and Light on the GPU

<module_meta>
  <source>The Book of Shaders — Patricio Gonzalez Vivo & Jen Lowe (an original distillation)</source>
  <router_trigger>Load when creating animated gradient fields, procedural blurs, grain, dithering, particles, image distortions or any GLSL/WebGL effect (Three.js, Paper Shaders, OGL).</router_trigger>
  <enforcement_level>STRICT on performance and fallback; GUIDED on aesthetics.</enforcement_level>
  <pairs_with>16 · 12 · aesthetics/atmospheric-gradient.md · aesthetics/immersive-webgl.md · library/gradients/</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axioms

1. **Think in parallel:** the fragment shader answers "what color is THIS pixel?" for every pixel at once, with no memory of its neighbors.
2. **Normalized coordinates:** work in `uv = gl_FragCoord.xy / resolution` and correct the aspect before drawing shapes.
3. **Shaping functions** (`step`, `smoothstep`, `mix`, `fract`, `length`) are the vocabulary: almost every effect is a composition of them.
4. **Noise is the raw material of the organic:** value/gradient/simplex noise and **fBm** (summed octaves) produce clouds, liquids and color fields.
5. **Domain warping:** displacing the coordinates by the noise itself (`fbm(p + fbm(p))`) gives monopo-style fields their "liquid" look.
6. **Color comes last:** compute a scalar (0–1) and map it to a palette (`mix` between colors, or a cosine palette).
7. **Dithering and grain** hide banding and add analog texture.
8. **Time and interaction through uniforms** (`u_time`, `u_mouse`, `u_scroll`), smoothed on the CPU (lerp) so they don't jitter.
9. **Sample the noise on continuous coordinates:** feeding a raw `atan` angle into noise creates a seam where it wraps (±π); use `vec2(cos(a), sin(a))` instead.
</core_axioms>

---

<recipes>
## 2. Recipes

```glsl
// A palette mapped from a scalar field (midnight → orange → amber)
vec3 palette(float t) {
  vec3 midnight = vec3(0.02, 0.03, 0.09);
  vec3 indigo   = vec3(0.07, 0.11, 0.33);
  vec3 orange   = vec3(1.00, 0.42, 0.10);
  vec3 amber    = vec3(1.00, 0.70, 0.42);
  vec3 c = mix(midnight, indigo, smoothstep(0.0, 0.45, t));
  c = mix(c, orange, smoothstep(0.55, 0.8, t));
  return mix(c, amber, smoothstep(0.85, 1.0, t));
}

// A liquid field: fBm with domain warping
float field(vec2 p, float t) {
  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.05)), fbm(p + vec2(5.2, 1.3) - t * 0.04));
  return fbm(p + 1.8 * q);
}

// Animated grain (hides banding)
float grain(vec2 uv, float t) { return fract(sin(dot(uv * (t + 1.0), vec2(12.9898, 78.233))) * 43758.5453); }

// Point-mass lensing (a black hole): what you see at p comes from further in
vec2 lens(vec2 p, float thetaE) { float r = length(p); return p - normalize(p) * thetaE * thetaE / max(r, 1e-3); }
```
Production shortcut: **Paper Shaders** (`@paper-design/shaders-react`) offers MeshGradient, GrainGradient, Dithering, Warp, LiquidMetal and others, ready and light — prefer them to writing GLSL from scratch when they serve the direction.
</recipes>

---

<performance_guard>
## 3. Budget and fallback (STRICT)

- Render color fields at a **reduced resolution** (0.5–0.75× DPR) and scale up; the eye doesn't notice on blurred backgrounds.
- **Pause** when off-screen (IntersectionObserver) or when the tab is hidden.
- Cap fBm octaves (3–5) and raymarching steps (≤ 64).
- Creating a WebGL context and compiling a shader can cost hundreds of milliseconds on weak GPUs: do it during idle time or behind a gesture, use `renderer.compileAsync` (KHR_parallel_shader_compile), and never in the middle of a scroll.
- **Static fallback:** an equivalent CSS gradient when there is no WebGL, under `prefers-reduced-motion` and on weak devices.
- Measure: `web-record-frames` → `pageFrames` (fps, p95) and `web-audit` (long tasks).
</performance_guard>

---

<agent_traps>
## 4. Guard (forbidden)
- A full-screen shader at 2× DPR on a laptop with integrated graphics.
- Important text over an animated field without checking contrast on the worst frame.
- Exact float comparison (`==`) and `if`s inside hot loops.
- Copying third-party shaders without a compatible license.
</agent_traps>
