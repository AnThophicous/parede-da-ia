# Aesthetics · index and decision matrix

<module_meta>
  <role>Map of parede-da-ia's aesthetic families. Load this index, pick ONE primary family (and at most one secondary), then load the matching playbook.</role>
  <enforcement_level>GUIDED — the family orients; the brand and the brief decide.</enforcement_level>
  <evidence>Playbooks built from references measured with the toolkit (web-scrap, web-motion, web-interactions, media-frames).</evidence>
</module_meta>

---

<matrix>
## 1. Archetype × family

| | corporate-modernist | corporate-brand | product-saas | playful-canvas | editorial-brutalist | atmospheric-gradient | immersive-webgl |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Corporate** | ★★★ | ★★★ | ★★★ | — | ★ | ★ (hero only) | — |
| **Personal / portfolio** | ★ | ★ | — | ★★★ | ★★★ | ★★ | ★ |
| **Ambitious / experience** | — | ★ | — | ★ | ★★ | ★★★ | ★★★ |

★★★ natural · ★★ works with care · ★ only as an accent · — avoid
</matrix>

---

<families>
## 2. Families

| id | Essence | Typical climax | Performance cost |
|----|---------|----------------|------------------|
| [`corporate-modernist`](corporate-modernist.md) | Swiss, economical, rigid grid, one color | big type and silence | low |
| [`corporate-brand`](corporate-brand.md) | The brand leads: strong color, rounded display type, organic shapes | a brand shape crossing the hero | low–medium |
| [`product-saas`](product-saas.md) | The product is the hero: real UI, proof, plans | an animated product demo | low–medium |
| [`playful-canvas`](playful-canvas.md) | A living, draggable designer's board | a wordmark in a selection box + pixel trail | medium |
| [`editorial-brutalist`](editorial-brutalist.md) | Extreme typographic contrast, monochrome | a giant title with Hover Font | low–medium |
| [`atmospheric-gradient`](atmospheric-gradient.md) | Blurred color fields, grain, glass | a liquid field + masked text | medium–high |
| [`immersive-webgl`](immersive-webgl.md) | A living 3D scene, particles, physics | a particle morph / reactive 3D object | high |

Gradient recipes: [`blur-library.md`](blur-library.md).
</families>

---

<mixing_rules>
## 3. Mixing rules

1. **One family leads; the secondary only seasons** (e.g., `corporate-brand` + an `atmospheric-gradient` hero).
2. **Corporate never inherits the cost of immersive:** if it uses WebGL, it is a single element with a static fallback and a 60 fps budget on integrated graphics.
3. **A single climax:** if the secondary brings a climax, the primary gives up its own.
4. **Coherent motion:** one motion language per site (`knowledge-base/13` §2).
5. **Confirm the hypothesis:** `web-scrap` → `aesthetic.primary/secondary` is for references; for the user's project, the decision comes from the approved brief/direction.
</mixing_rules>
