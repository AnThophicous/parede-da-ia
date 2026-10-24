/**
 * parede-da-ia · text morph (partículas → texto)
 * Partículas que se reorganizam em palavras, com arcos, atraso individual e repulsão do cursor.
 *
 *   import * as THREE from 'three';
 *   import { createTextMorph } from './text-morph.js';
 *   const morph = await createTextMorph(THREE, container, { words: ['olhos', 'mãos', 'repertório'] });
 *   morph.setProgress(1.4);      // scrub contínuo: 0 = nuvem, 1 = palavra 1, 2 = palavra 2…
 *   morph.morphTo(2);            // ou transição animada até a forma 2
 *
 * O THREE é injetado (a receita não importa dependências): funciona com qualquer bundler.
 * Desempenho: DPR limitado a 1.5, pausa fora da viewport; use count menor no mobile.
 * A criação não trava a rolagem: as palavras são amostradas em meia resolução, uma por frame,
 * e o shader compila em paralelo (compileAsync) antes do primeiro render.
 * Acessibilidade: o canvas é decorativo (aria-hidden); mantenha o texto real no HTML.
 */

/** Escala do canvas de amostragem: metade da resolução = 1/4 dos pixels lidos, sem perda visível. */
const SAMPLE_SCALE = 0.5;
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

const VERTEX = /* glsl */ `
  attribute vec3 aTarget;
  attribute vec3 aRandom;
  attribute float aTone;
  uniform float uProgress;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec2 uMouse;
  uniform float uMouseRadius;
  varying float vTone;
  varying float vAlpha;

  float easeInOutCubic(float t) { return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0; }

  uniform float uSwirl;

  vec2 rotate(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }

  void main() {
    float delay = aRandom.x * 0.35;
    float p = easeInOutCubic(clamp((uProgress - delay) / 0.65, 0.0, 1.0));
    vec3 from = position;
    // nebulosa: a forma de origem gira devagar quando é a nuvem (uSwirl = 1 no primeiro segmento)
    from.xy = rotate(from.xy, uTime * (0.05 + aRandom.z * 0.08) * uSwirl);
    vec3 pos = mix(from, aTarget, p);
    // arco: cada partícula sai da linha reta no meio do trajeto
    float arc = sin(p * 3.14159265);
    pos.xy += (aRandom.yz - 0.5) * 180.0 * arc;
    // respiração ociosa
    pos.xy += vec2(sin(uTime * 0.7 + aRandom.x * 6.2831), cos(uTime * 0.6 + aRandom.y * 6.2831)) * 1.4;
    // repulsão do cursor
    vec2 toMouse = pos.xy - uMouse;
    float d = length(toMouse);
    pos.xy += normalize(toMouse + 0.0001) * smoothstep(uMouseRadius, 0.0, d) * 42.0;

    vTone = aTone;
    vAlpha = 0.7 + aRandom.z * 0.3;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uSize * uPixelRatio * (0.65 + aRandom.y * 0.7);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  varying float vTone;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    float soft = smoothstep(0.5, 0.0, r);
    vec3 col = vTone < 0.5 ? mix(uColorA, uColorB, vTone * 2.0) : mix(uColorB, uColorC, (vTone - 0.5) * 2.0);
    gl_FragColor = vec4(col, soft * vAlpha);
  }
`;

/** Amostra pontos (em px, centrados) de uma palavra desenhada num canvas 2D em escala reduzida. */
function sampleWord(word, width, height, font, count) {
  const w = Math.max(1, Math.floor(width * SAMPLE_SCALE));
  const h = Math.max(1, Math.floor(height * SAMPLE_SCALE));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.font = `${font.weight} 100px ${font.family}`;
  const measured = ctx.measureText(word).width || 1;
  const size = Math.min((w * 0.78) / measured, h * 0.0052) * 100;
  ctx.font = `${font.weight} ${size}px ${font.family}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText(word, w / 2, h / 2);
  const { data } = ctx.getImageData(0, 0, w, h);
  const step = Math.max(1, Math.round(size / 70));
  const pts = [];
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (data[(y * w + x) * 4 + 3] > 128) pts.push((x - w / 2) / SAMPLE_SCALE, -(y - h / 2) / SAMPLE_SCALE);
    }
  }
  const jitter = step / SAMPLE_SCALE;
  const out = new Float32Array(count * 3);
  const n = pts.length / 2 || 1;
  for (let i = 0; i < count; i++) {
    const k = Math.floor(Math.random() * n) * 2;
    out[i * 3] = (pts[k] ?? 0) + (Math.random() - 0.5) * jitter;
    out[i * 3 + 1] = (pts[k + 1] ?? 0) + (Math.random() - 0.5) * jitter;
    out[i * 3 + 2] = 0;
  }
  return out;
}

/** Nuvem inicial: nebulosa densa no centro com braços espirais suaves. */
function sampleCloud(width, height, count) {
  const out = new Float32Array(count * 3);
  const radius = Math.min(width, height) * 0.24;
  for (let i = 0; i < count; i++) {
    const u = Math.random() || 1e-6;
    const r = Math.sqrt(-2 * Math.log(u)) * 0.55 * radius;
    const arm = (i % 3) * ((Math.PI * 2) / 3);
    const angle = arm + r * 0.012 + (Math.random() - 0.5) * 1.6;
    out[i * 3] = Math.cos(angle) * r * 1.35;
    out[i * 3 + 1] = Math.sin(angle) * r;
    out[i * 3 + 2] = 0;
  }
  return out;
}

/**
 * @param {typeof import('three')} THREE
 * @param {HTMLElement} container
 * @param {{ words: string[], count?: number, font?: { family: string, weight: number },
 *           colors?: [string, string, string], pointSize?: number, maxDpr?: number }} options
 */
export async function createTextMorph(THREE, container, options) {
  const { words, count = 7000, font = { family: 'sans-serif', weight: 700 }, colors = ['#3a5bff', '#ff6a1a', '#ffb36b'], pointSize = 2.4, maxDpr = 1.5 } = options;
  await document.fonts?.load(`${font.weight} 100px ${font.family}`).catch(() => undefined);

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
  const dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
  renderer.setPixelRatio(dpr);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
  const geometry = new THREE.BufferGeometry();
  const random = new Float32Array(count * 3).map(() => Math.random());
  // Tom puxado para as cores quentes: ~15% frio, o resto entre laranja e âmbar.
  const tone = new Float32Array(count).map(() => (Math.random() < 0.15 ? Math.random() * 0.35 : 0.5 + Math.random() * 0.5));
  geometry.setAttribute('aRandom', new THREE.BufferAttribute(random, 3));
  geometry.setAttribute('aTone', new THREE.BufferAttribute(tone, 1));

  const uniforms = {
    uProgress: { value: 0 },
    uTime: { value: 0 },
    uSwirl: { value: 1 },
    uSize: { value: pointSize },
    uPixelRatio: { value: dpr },
    uMouse: { value: new THREE.Vector2(99999, 99999) },
    uMouseRadius: { value: 120 },
    uColorA: { value: new THREE.Color(colors[0]) },
    uColorB: { value: new THREE.Color(colors[1]) },
    uColorC: { value: new THREE.Color(colors[2]) },
  };
  const material = new THREE.ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  let shapes = [];
  let segment = -1;
  let width = 1;
  let height = 1;
  let buildId = 0;

  /** Amostra as formas uma por frame (nenhuma tarefa longa); devolve false se outra build a substituiu. */
  const build = async () => {
    const id = ++buildId;
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    const next = [sampleCloud(w, h, count)];
    for (const word of words) {
      await nextFrame();
      if (id !== buildId) return false;
      next.push(sampleWord(word, w, h, font, count));
    }
    width = w;
    height = h;
    renderer.setSize(width, height, false);
    Object.assign(camera, { left: -width / 2, right: width / 2, top: height / 2, bottom: -height / 2 });
    camera.updateProjectionMatrix();
    shapes = next;
    uniforms.uMouseRadius.value = Math.min(160, width * 0.12);
    segment = -1;
    return true;
  };
  const useSegment = (k) => {
    if (k === segment) return;
    segment = k;
    uniforms.uSwirl.value = k === 0 ? 1 : 0;
    geometry.setAttribute('position', new THREE.BufferAttribute(shapes[k], 3));
    geometry.setAttribute('aTarget', new THREE.BufferAttribute(shapes[Math.min(k + 1, shapes.length - 1)], 3));
  };
  await build();
  useSegment(0);
  // Compila o programa em paralelo (KHR_parallel_shader_compile) antes do primeiro render:
  // sem isso, o primeiro frame espera a compilação e a rolagem engasga.
  await renderer.compileAsync?.(scene, camera);

  /** Scrub contínuo: 0 = nuvem, 1 = primeira palavra, n = n-ésima palavra. */
  const setProgress = (t) => {
    const clamped = Math.max(0, Math.min(shapes.length - 1, t));
    const k = Math.min(shapes.length - 2, Math.floor(clamped));
    useSegment(Math.max(0, k));
    uniforms.uProgress.value = clamped - Math.max(0, k);
  };

  let tween = 0;
  /** Transição animada até a forma `index` (1-based para palavras; 0 = nuvem). */
  const morphTo = (index, duration = 1400) => {
    cancelAnimationFrame(tween);
    const start = segment + uniforms.uProgress.value;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      setProgress(start + (index - start) * p);
      if (p < 1) tween = requestAnimationFrame(step);
    };
    tween = requestAnimationFrame(step);
  };

  const onPointer = (e) => {
    const r = container.getBoundingClientRect();
    uniforms.uMouse.value.set(e.clientX - r.left - width / 2, -(e.clientY - r.top - height / 2));
  };
  const onLeave = () => uniforms.uMouse.value.set(99999, 99999);
  container.addEventListener('pointermove', onPointer, { passive: true });
  container.addEventListener('pointerleave', onLeave);
  // Só reconstrói quando o tamanho muda de fato (o observe() sempre notifica uma vez de cara).
  let resizeTimer = 0;
  const ro = new ResizeObserver(() => {
    if ((container.clientWidth || 1) === width && (container.clientHeight || 1) === height) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(async () => {
      const progress = segment + uniforms.uProgress.value;
      if (await build()) setProgress(progress);
    }, 150);
  });
  ro.observe(container);

  let visible = true;
  const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
  io.observe(container);
  let raf = 0;
  const start = performance.now();
  const loop = (now = performance.now()) => {
    raf = requestAnimationFrame(loop);
    if (!visible || document.hidden) return;
    uniforms.uTime.value = (now - start) / 1000;
    renderer.render(scene, camera);
  };
  loop();

  return {
    canvas: renderer.domElement,
    setProgress,
    morphTo,
    destroy() {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(tween);
      clearTimeout(resizeTimer);
      buildId++;
      ro.disconnect();
      io.disconnect();
      container.removeEventListener('pointermove', onPointer);
      container.removeEventListener('pointerleave', onLeave);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
