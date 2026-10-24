import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BLACK_HOLE, BOOKS, coverUrl } from '@/content';
import { ease, journey, span, STAGE } from '@/lib/journey';
import { music } from '@/lib/music';

const MAX_STARS = 40;
const MAX_RIPPLES = 4;

const VERTEX = /* glsl */ `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`;

/**
 * One fullscreen shader, black ink on white paper: book-stars with diffraction spikes,
 * a black hole with a dark gravity well, a luminous lensed ring and a thin disk crossing it,
 * ripples on every beat, and — as it grows — a widening FOV and radially stretched stars.
 */
const FRAGMENT = /* glsl */ `
precision highp float;
#define MAX_STARS ${MAX_STARS}
#define MAX_RIPPLES ${MAX_RIPPLES}
uniform vec2 uRes;
uniform float uPr;
uniform float uTime;
uniform float uR;
uniform float uPulse;
uniform float uStretch;
uniform float uDark;
uniform float uHover;
uniform float uGrow;
uniform vec4 uStars[MAX_STARS];
uniform float uStarHover[MAX_STARS];
uniform int uCount;
uniform vec2 uRipples[MAX_RIPPLES];

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}

void main() {
  vec2 frag = gl_FragCoord.xy / uPr;
  vec2 p0 = vec2(frag.x - uRes.x * 0.5, (uRes.y - frag.y) - uRes.y * 0.5);
  float diag = length(uRes) * 0.5;
  // FOV stretch: the closer to the edge, the more the world is pulled out of shape.
  float r0 = length(p0);
  vec2 p = p0 / (1.0 + uStretch * 0.55 * pow(r0 / diag, 2.0));
  float r = length(p);
  vec2 dir = p / max(r, 1e-4);
  float R = uR * (1.0 + 0.045 * uPulse);

  // point-mass lensing: what we see at p comes from further in
  float thetaE = R * 1.7;
  vec2 src = p - dir * (thetaE * thetaE) / max(r, R * 0.35);

  float ink = 0.0;
  for (int i = 0; i < MAX_STARS; i++) {
    if (i >= uCount) break;
    vec4 s = uStars[i];
    vec2 d = src - s.xy;
    vec2 radial = normalize(s.xy + vec2(1e-3));
    float dr = dot(d, radial);
    float dt = dot(d, vec2(-radial.y, radial.x));
    float el = 1.0 + uStretch * 14.0;
    float dist = length(vec2(dr / el, dt));
    float size = s.z * (1.0 + 0.7 * uStarHover[i]);
    float core = smoothstep(size, size * 0.2, dist);
    float spikes = exp(-abs(d.y) * 1.1) * exp(-abs(d.x) / (size * 4.0)) + exp(-abs(d.x) * 1.1) * exp(-abs(d.y) / (size * 4.0));
    float halo = smoothstep(size * 2.6, size * 2.2, dist) * smoothstep(size * 1.9, size * 2.2, dist) * uStarHover[i];
    ink = max(ink, s.w * max(max(core, spikes * 0.5 * (1.0 - uStretch)), halo));
  }
  float col = 1.0 - ink;

  // gravity well: the paper darkens around the hole
  float well = exp(-max(r - R, 0.0) / (R * (0.95 + 0.15 * uHover)));
  col = mix(col, 0.05, well * 0.94);

  vec2 dp = p / R;
  float rr = length(dp);
  float ang = atan(dp.y, dp.x);
  // lensed back of the disk: a luminous ring hugging the shadow
  // noise over the unit circle (not the raw angle): no seam where atan wraps around
  float n = noise(vec2(cos(ang), sin(ang)) * 3.0 + vec2(uTime * 0.22, rr * 7.0 - uTime * 0.4));
  float ring = smoothstep(1.0, 1.05, rr) * (1.0 - smoothstep(1.05, 1.45 + 0.1 * uPulse, rr));
  col = mix(col, 0.96, ring * (0.3 + 0.55 * n) * (1.0 + 0.25 * uHover));
  // the shadow
  col = mix(col, 0.0, 1.0 - smoothstep(0.975, 1.0, rr));
  // front of the disk: a thin band crossing in front of the shadow
  float tilt = dp.y + 0.06 * dp.x;
  float band = (1.0 - smoothstep(0.015, 0.075, abs(tilt))) * (1.0 - smoothstep(2.0, 3.3, abs(dp.x)));
  // falling in: the disk thins out and only the ring sweeps past us
  band *= 1.0 - smoothstep(0.3, 0.65, uGrow);
  float st = 0.5 + 0.5 * sin(dp.x * 26.0 - uTime * 1.3 + n * 4.0);
  col = mix(col, 0.9, band * (0.35 + 0.55 * st));

  // the event horizon hitting us on every beat
  for (int i = 0; i < MAX_RIPPLES; i++) {
    vec2 rp = uRipples[i];
    if (rp.y <= 0.0) continue;
    float w = 2.0 + rp.x * 0.012;
    col = mix(col, 0.0, rp.y * (1.0 - smoothstep(0.0, w, abs(r0 - rp.x))));
  }

  col = mix(col, 0.0, uDark);
  gl_FragColor = vec4(vec3(col), 1.0);
}
`;

type Star = { x: number; y: number; vx: number; vy: number; size: number; book: number; alpha: number; tx: number; hideUntil: number };
type Cover = { id: number; book: number; x: number; y: number };

const fmt = new Intl.NumberFormat('en-US');

/**
 * The first scene. Every star is one of the 23 distilled books: hover to read it, click to see
 * the cover. A star is launched from the sides on every beat and never reaches the middle —
 * the middle belongs to the black hole. Scrolling makes the hole grow and swallow everything.
 */
export function Cosmos() {
  const host = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<{ x: number; y: number; book: number } | null>(null);
  const [hole, setHole] = useState<{ x: number; y: number } | null>(null);
  const [covers, setCovers] = useState<Cover[]>([]);
  const km = useRef<HTMLSpanElement>(null);
  const labelEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    const mobile = window.innerWidth < 768;
    const pr = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.25);
    renderer.setPixelRatio(pr);
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    el.appendChild(renderer.domElement);

    const uniforms = {
      uRes: { value: new THREE.Vector2(1, 1) },
      uPr: { value: pr },
      uTime: { value: 0 },
      uR: { value: 60 },
      uPulse: { value: 0 },
      uStretch: { value: 0 },
      uDark: { value: 0 },
      uHover: { value: 0 },
      uGrow: { value: 0 },
      uStars: { value: Array.from({ length: MAX_STARS }, () => new THREE.Vector4()) },
      uStarHover: { value: new Array(MAX_STARS).fill(0) },
      uCount: { value: 0 },
      uRipples: { value: Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector2()) },
    };
    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms })));

    let W = 1;
    let H = 1;
    const resize = () => {
      W = el.clientWidth || window.innerWidth;
      H = el.clientHeight || window.innerHeight;
      renderer.setSize(W, H, false);
      uniforms.uRes.value.set(W, H);
    };
    resize();
    window.addEventListener('resize', resize);

    const stars: Star[] = [];
    let bookCursor = Math.floor(Math.random() * BOOKS.length);
    const spawn = (warm = false) => {
      if (stars.length >= MAX_STARS) return;
      const side = Math.random() < 0.5 ? -1 : 1;
      const half = W / 2;
      // where it comes to rest horizontally: never inside the middle 40%
      const tx = side * half * (0.42 + 0.5 * Math.random());
      const star: Star = {
        x: warm ? tx : side * (half + 12),
        y: warm ? (Math.random() - 0.5) * H : -H / 2 + Math.random() * H * 0.45,
        vx: 0,
        vy: 14 + Math.random() * 18,
        size: (mobile ? 2.4 : 2.2) + Math.random() * 2.8,
        book: bookCursor++ % BOOKS.length,
        alpha: warm ? 1 : 0,
        tx,
        hideUntil: 0,
      };
      stars.push(star);
    };
    for (let i = 0; i < (mobile ? 6 : 12); i++) spawn(true);
    if ('__journey' in window) Object.assign(window, { __stars: () => stars.map((s) => ({ x: s.x + W / 2, y: s.y + H / 2, book: s.book })) });

    const ripples: { r: number; a: number }[] = [];
    let pulse = 0;
    let p = journey.p;
    const offP = journey.subscribe((v) => (p = v));
    const offBeat = music.onBeat(() => {
      if (p < STAGE.horizonEnd) spawn();
      pulse = 1;
      ripples.push({ r: uniforms.uR.value * 1.05, a: p > STAGE.cosmosEnd ? 0.55 : 0.22 });
      if (ripples.length > MAX_RIPPLES) ripples.shift();
    });

    // pointer: star hover/click, hole hover
    const mouse = { x: -1e4, y: -1e4 };
    let hovered = -1;
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX - W / 2;
      mouse.y = e.clientY - H / 2;
    };
    const onClick = () => {
      const s = hoveredStar;
      if (!s) return;
      const id = performance.now();
      setCovers((c) => [...c.slice(-3), { id, book: s.book, x: s.x + W / 2, y: s.y + H / 2 }]);
      s.hideUntil = performance.now() + 3300; // the star becomes the cover for a moment
      hoveredStar = null;
      window.setTimeout(() => {
        setCovers((c) => c.filter((k) => k.id !== id));
      }, 3400);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('click', onClick);

    const R0 = () => Math.min(W, H) * 0.065;
    let raf = 0;
    let last = performance.now();
    const t0 = last;
    let lastStar: Star | null = null;
    let hoveredStar: Star | null = null;
    let holeShown = false;
    let distance = BLACK_HOLE.lightYears * BLACK_HOLE.kmPerLightYear;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (document.hidden) return;
      const grow = span(p, STAGE.cosmosEnd, STAGE.horizonEnd);
      pulse *= Math.exp(-dt / 0.35);
      // the hole: small and calm, then growing fast, a step per beat
      const R = R0() * Math.exp(3.3 * grow ** 1.3 + grow * pulse * 0.25);
      const pull = grow * grow * 2400;

      let count = 0;
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.alpha = now < s.hideUntil ? 0 : Math.min(1, s.alpha + dt * 1.6);
        if (pull > 0) {
          // the hole pulls everything in, faster and faster
          const d = Math.hypot(s.x, s.y) || 1;
          s.vx -= (s.x / d) * pull * dt;
          s.vy -= (s.y / d) * pull * dt;
        } else {
          // launched from the side, it decelerates toward its lane
          s.vx = (s.tx - s.x) * 0.9;
        }
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        const r = Math.hypot(s.x, s.y);
        if (s.y > H / 2 + 30 || (grow > 0 && r < R * 0.95)) {
          stars.splice(i, 1);
          continue;
        }
      }
      // hover with hysteresis: easy to catch (26px), hard to lose (44px) while it drifts
      const near = (st: Star) => Math.hypot(st.x - mouse.x, st.y - mouse.y);
      if (hoveredStar && (!stars.includes(hoveredStar) || near(hoveredStar) > 44 || grow >= 0.2)) hoveredStar = null;
      if (!hoveredStar && grow < 0.2) {
        let best = 26;
        for (const st of stars) {
          const d = near(st);
          if (d < best && st.alpha > 0.5) {
            best = d;
            hoveredStar = st;
          }
        }
      }
      hovered = hoveredStar ? stars.indexOf(hoveredStar) : -1;
      for (let i = 0; i < stars.length && count < MAX_STARS; i++, count++) {
        const st = stars[i];
        uniforms.uStars.value[i].set(st.x, st.y, st.size, st.alpha);
        const target = i === hovered ? 1 : 0;
        uniforms.uStarHover.value[i] += (target - uniforms.uStarHover.value[i]) * Math.min(1, dt * 10);
      }
      uniforms.uCount.value = count;
      el.style.cursor = hoveredStar ? 'pointer' : '';
      if (hoveredStar !== lastStar) {
        lastStar = hoveredStar;
        setLabel(hoveredStar ? { x: hoveredStar.x + W / 2, y: hoveredStar.y + H / 2, book: hoveredStar.book } : null);
      }
      // the label rides along with its star
      if (hoveredStar && labelEl.current) {
        labelEl.current.style.left = `${hoveredStar.x + W / 2}px`;
        labelEl.current.style.top = `${hoveredStar.y + H / 2}px`;
      }

      // the hole under the cursor: how far it really is
      const overHole = Math.hypot(mouse.x, mouse.y) < R * 1.35 && grow < 0.25;
      uniforms.uHover.value += ((overHole ? 1 : 0) - uniforms.uHover.value) * Math.min(1, dt * 6);
      if (overHole !== holeShown) {
        holeShown = overHole;
        setHole(overHole ? { x: mouse.x + W / 2, y: mouse.y + H / 2 } : null);
      }
      if (overHole && km.current) {
        distance += dt * 29.78 * 40; // it keeps moving, so do we
        km.current.textContent = fmt.format(Math.round(distance));
      }

      for (let i = 0; i < MAX_RIPPLES; i++) {
        const rp = ripples[i];
        if (rp) {
          rp.r += dt * (120 + grow * 900);
          rp.a *= Math.exp(-dt / 1.6);
        }
        uniforms.uRipples.value[i].set(rp?.r ?? 0, rp?.a ?? 0);
      }

      uniforms.uR.value = R;
      uniforms.uGrow.value = grow;
      uniforms.uPulse.value = pulse;
      uniforms.uStretch.value = ease(span(p, STAGE.cosmosEnd + 0.03, STAGE.horizonEnd));
      uniforms.uDark.value = span(p, STAGE.horizonEnd - 0.035, STAGE.horizonEnd);
      uniforms.uTime.value = (now - t0) / 1000;
      // once it is fully dark there is nothing left to draw
      if (uniforms.uDark.value < 1 || p < STAGE.horizonEnd + 0.01) renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      offP();
      offBeat();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      el.removeEventListener('click', onClick);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const book = label ? BOOKS[label.book] : null;
  return (
    <div ref={host} className="fixed inset-0 z-0 bg-paper" aria-hidden="true">
      {book && label && (
        <div ref={labelEl} className="pointer-events-none absolute z-10 -translate-x-1/2 translate-y-4 whitespace-nowrap text-center text-black animate-in fade-in-0 slide-in-from-top-1 duration-300" style={{ left: label.x, top: label.y }}>
          <p className="text-[13px] font-medium tracking-[-0.01em]">{book.title}</p>
          <p className="font-mono text-[10.5px] text-black/55">{book.author} · click</p>
        </div>
      )}
      {hole && (
        <div className="pointer-events-none absolute z-10 translate-x-6 -translate-y-1/2 rounded-full border border-white/25 bg-black px-4 py-2 font-mono text-[11.5px] text-white shadow-[0_10px_40px_-10px_rgb(0_0_0/0.6)] animate-in fade-in-0 zoom-in-95 duration-300" style={{ left: hole.x, top: hole.y }}>
          {BLACK_HOLE.name} · {fmt.format(BLACK_HOLE.lightYears)} light-years · <span ref={km}>{fmt.format(Math.round(BLACK_HOLE.lightYears * BLACK_HOLE.kmPerLightYear))}</span> km from you
        </div>
      )}
      {covers.map((c) => (
        <BookCover key={c.id} book={c.book} x={c.x} y={c.y} />
      ))}
    </div>
  );
}

/** A star turned into its book for a moment (grayscale, like everything else here). */
function BookCover({ book, x, y }: { book: number; x: number; y: number }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const b = BOOKS[book];
  useEffect(() => {
    const t = window.setTimeout(() => setLeaving(true), 2900);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      className="pointer-events-none absolute z-20 w-[112px] -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-expo animate-in zoom-in-[0.15] fade-in-0"
      style={{ left: x, top: y, opacity: leaving ? 0 : 1, scale: leaving ? '0.2' : '1', animationDuration: '600ms' }}
    >
      {/* typographic cover right away; the real one fades in over it when it arrives */}
      <div className="flex aspect-[2/3] flex-col justify-between bg-black p-3 text-white shadow-[0_20px_50px_-12px_rgb(0_0_0/0.6)]">
        <p className="text-[13px] font-semibold leading-tight">{b.title}</p>
        <p className="font-mono text-[9px] text-white/60">{b.author}</p>
      </div>
      {!failed && (
        <img
          src={coverUrl(b.cover)}
          alt=""
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover grayscale transition-opacity duration-500"
          style={{ opacity: loaded ? 1 : 0 }}
        />
      )}
    </div>
  );
}
