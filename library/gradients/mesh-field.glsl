// parede-da-ia · campo de cor líquido (domain-warped fBm) — fragment shader WebGL1/2
// Uniforms: u_resolution (px), u_time (s), u_mouse (0–1, suavizado na CPU), u_c1..u_c4 (RGB 0–1), u_grain (0–0.2)
// Estética: gradiente-atmosferico. Renderize a 0.5–0.75× DPR e pause fora da viewport.
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_c1; // fundo profundo
uniform vec3 u_c2; // meio frio
uniform vec3 u_c3; // acento quente
uniform vec3 u_c4; // luz
uniform float u_grain;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.02;
    a *= 0.5;
  }
  return v;
}

vec3 palette(float t) {
  vec3 c = mix(u_c1, u_c2, smoothstep(0.05, 0.45, t));
  c = mix(c, u_c3, smoothstep(0.5, 0.78, t));
  return mix(c, u_c4, smoothstep(0.82, 1.0, t));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  float t = u_time * 0.06;

  // o cursor empurra o campo (lerp feito na CPU)
  p += (u_mouse - 0.5) * 0.25;

  vec2 q = vec2(fbm(p * 1.4 + vec2(0.0, t)), fbm(p * 1.4 + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p * 1.4 + 1.9 * q + vec2(1.7, 9.2) + t * 0.6), fbm(p * 1.4 + 1.9 * q + vec2(8.3, 2.8) - t * 0.4));
  float f = fbm(p * 1.4 + 2.2 * r);

  // vinheta mantém as bordas escuras (texto legível)
  float vignette = smoothstep(1.25, 0.25, length(p * vec2(0.9, 1.1)));
  vec3 col = palette(clamp(f * 1.15 * vignette + 0.05, 0.0, 1.0));

  // grão analógico
  col += (hash(uv * u_resolution + fract(u_time) * 100.0) - 0.5) * u_grain;
  gl_FragColor = vec4(col, 1.0);
}
