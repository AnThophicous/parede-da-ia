# 17 · The Book of Shaders — Campos, Ruído e Luz na GPU

<module_meta>
  <source>The Book of Shaders — Patricio Gonzalez Vivo & Jen Lowe (destilação autoral)</source>
  <router_trigger>Carregar ao criar campos de gradiente animados, blurs procedurais, grão, dithering, partículas, distorções de imagem ou qualquer efeito em GLSL/WebGL (Three.js, Paper Shaders, OGL).</router_trigger>
  <enforcement_level>STRICT quanto a performance e fallback; GUIDED quanto à estética.</enforcement_level>
  <pairs_with>16 · 12 · aesthetics/gradiente-atmosferico.md · aesthetics/imersivo-webgl.md · library/gradients/</pairs_with>
</module_meta>

---

<core_axioms>
## 1. Axiomas

1. **Pense em paralelo:** o fragment shader responde "de que cor é ESTE pixel?" para todos ao mesmo tempo, sem memória do vizinho.
2. **Coordenadas normalizadas:** trabalhe em `uv = gl_FragCoord.xy / resolution` e corrija o aspecto antes de desenhar formas.
3. **Funções de forma** (`step`, `smoothstep`, `mix`, `fract`, `length`) são o vocabulário: quase todo efeito é composição delas.
4. **Ruído é a matéria-prima do orgânico:** value/gradient/simplex noise e **fBm** (oitavas somadas) geram nuvens, líquidos e campos de cor.
5. **Domain warping:** deslocar as coordenadas pelo próprio ruído (`fbm(p + fbm(p))`) produz o aspecto "líquido" dos campos tipo monopo.
6. **Cor vem por último:** calcule um escalar (0–1) e mapeie para uma paleta (`mix` entre cores, ou paleta cosseno).
7. **Dithering e grão** escondem banding e dão textura analógica.
8. **Tempo e interação via uniforms** (`u_time`, `u_mouse`, `u_scroll`), suavizados na CPU (lerp) para não tremer.
</core_axioms>

---

<recipes>
## 2. Receitas

```glsl
// Paleta mapeada de um campo escalar (meia-noite → laranja → âmbar)
vec3 palette(float t) {
  vec3 midnight = vec3(0.02, 0.03, 0.09);
  vec3 indigo   = vec3(0.07, 0.11, 0.33);
  vec3 orange   = vec3(1.00, 0.42, 0.10);
  vec3 amber    = vec3(1.00, 0.70, 0.42);
  vec3 c = mix(midnight, indigo, smoothstep(0.0, 0.45, t));
  c = mix(c, orange, smoothstep(0.55, 0.8, t));
  return mix(c, amber, smoothstep(0.85, 1.0, t));
}

// Campo líquido: fBm com domain warping
float field(vec2 p, float t) {
  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.05)), fbm(p + vec2(5.2, 1.3) - t * 0.04));
  return fbm(p + 1.8 * q);
}

// Grão animado (esconde banding)
float grain(vec2 uv, float t) { return fract(sin(dot(uv * (t + 1.0), vec2(12.9898, 78.233))) * 43758.5453); }
```
Atalho de produção: **Paper Shaders** (`@paper-design/shaders-react`) oferece MeshGradient, GrainGradient, Dithering, Warp, LiquidMetal e outros prontos e leves — prefira-os a escrever GLSL do zero quando atenderem à direção.
</recipes>

---

<performance_guard>
## 3. Orçamento e fallback (STRICT)

- Renderize campos de cor em **resolução reduzida** (0.5–0.75× DPR) e escale; o olho não percebe em fundos desfocados.
- **Pause** quando fora da viewport (IntersectionObserver) ou com a aba oculta.
- Limite oitavas de fBm (3–5) e passos de raymarching (≤ 64).
- **Fallback estático:** gradiente CSS equivalente quando não houver WebGL, em `prefers-reduced-motion` e em dispositivos fracos.
- Meça: `web-record-frames` → `pageFrames` (fps, p95) e `web-audit` (long tasks).
</performance_guard>

---

<agent_traps>
## 4. Trava (proibido)
- Shader em tela cheia rodando a 2× DPR em notebook com GPU integrada.
- Texto importante sobre campo animado sem verificar contraste no pior frame.
- Comparação exata de float (`==`) e `if` dentro de loops quentes.
- Copiar shaders de terceiros sem licença compatível.
</agent_traps>
