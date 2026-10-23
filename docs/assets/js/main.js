/* ==========================================================================
   parede-da-ia — interações da landing
   Cada módulo é independente e degrada com elegância (sem JS, sem WebGL,
   prefers-reduced-motion, toque).
   ========================================================================== */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  const gsap = window.gsap;
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  if (hasGsap && window.SplitText) gsap.registerPlugin(window.SplitText);

  /* ------------------------------------------------------------------ */
  /* Smooth scroll (Lenis) sincronizado com o ticker do GSAP             */
  /* ------------------------------------------------------------------ */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', () => window.ScrollTrigger && window.ScrollTrigger.update());
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  const scrollToTarget = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    else (typeof target === 'string' ? document.querySelector(target) : target)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  };
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2 || !document.querySelector(id)) return;
      e.preventDefault();
      scrollToTarget(id === '#top' ? 0 : id);
    });
  });

  /* ------------------------------------------------------------------ */
  /* Preloader → intro do hero                                          */
  /* ------------------------------------------------------------------ */
  const preloader = $('.preloader');
  const heroLines = $$('.hero__title .line__inner');
  const introTargets = $$('.hero__top, .hero__bottom, .hero__scroll, .header');

  function heroIntro() {
    if (!hasGsap || reduced) return;
    gsap.from(heroLines, { yPercent: 110, duration: 1.4, ease: 'expo.out', stagger: 0.09 });
    gsap.from(introTargets, { opacity: 0, y: 18, duration: 1.1, ease: 'power3.out', delay: 0.35, stagger: 0.06, clearProps: 'transform' });
  }

  if (!preloader || reduced || !hasGsap) {
    preloader?.remove();
    heroIntro();
  } else {
    lenis?.stop();
    const num = $('.preloader__num', preloader);
    const counter = { v: 0 };
    gsap.timeline({
      onComplete: () => {
        preloader.remove();
        lenis?.start();
      },
    })
      .to(counter, {
        v: 100, duration: 1.25, ease: 'power2.inOut',
        onUpdate: () => (num.textContent = String(Math.round(counter.v)).padStart(3, '0')),
      })
      .to(num, { yPercent: -100, duration: 0.5, ease: 'power3.in' })
      .to(preloader, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '-=0.1')
      .add(heroIntro, '-=0.55');
  }

  /* ------------------------------------------------------------------ */
  /* Hero WebGL — esfera em raymarching com dithering Bayer 8×8          */
  /* Só preto ou branco por pixel: monocromia literal.                   */
  /* ------------------------------------------------------------------ */
  (function heroShader() {
    const canvas = $('.hero__gl');
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) { document.documentElement.classList.add('no-webgl'); return; }

    const vert = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
    const frag = `
      precision highp float;
      uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uScroll;
      uniform vec2 uCenter; uniform float uScale;

      float Bayer2(vec2 a){ a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
      #define Bayer4(a) (Bayer2(0.5 * (a)) * 0.25 + Bayer2(a))
      #define Bayer8(a) (Bayer4(0.5 * (a)) * 0.25 + Bayer2(a))

      float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float noise(vec3 x){
        vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
      }
      float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++){ s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }
      mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

      float map(vec3 p){
        p.xz *= rot(uTime * 0.12 + uMouse.x * 0.7);
        p.yz *= rot(uMouse.y * 0.45);
        float d = length(p) - 1.0;
        d += (fbm(p * 1.55 + vec3(0.0, uTime * 0.16, 0.0)) - 0.5) * 0.62;
        return d * 0.68;
      }
      vec3 normalAt(vec3 p){
        vec2 e = vec2(0.003, 0.0);
        return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx)));
      }

      void main(){
        vec2 frag = gl_FragCoord.xy;
        vec2 uv = (frag - 0.5 * uRes) / uRes.y;
        uv = (uv - uCenter) / uScale;
        vec3 ro = vec3(0.0, 0.0, 3.2);
        vec3 rd = normalize(vec3(uv, -1.6));
        float t = 0.0; float hit = 0.0;
        for (int i = 0; i < 56; i++){
          float d = map(ro + rd * t);
          if (d < 0.002){ hit = 1.0; break; }
          t += d;
          if (t > 6.0) break;
        }
        float lum;
        if (hit > 0.5){
          vec3 p = ro + rd * t; vec3 n = normalAt(p);
          vec3 l = normalize(vec3(-0.55 + uMouse.x * 0.9, 0.7 + uMouse.y * 0.6, 0.85));
          float diff = max(dot(n, l), 0.0);
          float rim = pow(1.0 - max(dot(n, -rd), 0.0), 2.4);
          float spec = pow(max(dot(reflect(-l, n), -rd), 0.0), 22.0);
          lum = diff * 0.82 + rim * 0.38 + spec * 0.7;
        } else {
          float r = length(uv);
          // halo curto em volta da esfera (smoothstep exige edge0 < edge1)
          lum = 0.07 * (1.0 - smoothstep(0.5, 0.78, r)) * (0.6 + 0.4 * fbm(vec3(uv * 3.0, uTime * 0.1)));
        }
        lum *= 1.0 - uScroll * 0.9;
        // comparação estrita: o limiar 0 do Bayer não pode acender pixels de luminância 0
        gl_FragColor = vec4(vec3(lum > Bayer8(frag) ? 1.0 : 0.0), 1.0);
      }`;

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
      return s;
    };
    let program;
    try {
      program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, vert));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, frag));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('link');
    } catch (err) {
      document.documentElement.classList.add('no-webgl');
      return;
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = Object.fromEntries(['uRes', 'uTime', 'uMouse', 'uScroll', 'uCenter', 'uScale'].map((n) => [n, gl.getUniformLocation(program, n)]));

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let scrollProgress = 0;
    let visible = true;
    let pixel = 3;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const mobile = rect.width < 700;
      pixel = mobile ? 2 : 3;
      canvas.width = Math.max(1, Math.round(rect.width / pixel));
      canvas.height = Math.max(1, Math.round(rect.height / pixel));
      gl.viewport(0, 0, canvas.width, canvas.height);
      const aspect = rect.width / rect.height;
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      if (mobile) { gl.uniform2f(u.uCenter, 0.06, 0.3); gl.uniform1f(u.uScale, 0.3); }
      else { gl.uniform2f(u.uCenter, Math.min(0.56, aspect * 0.31), 0.02); gl.uniform1f(u.uScale, 0.5); }
    }
    resize();
    addEventListener('resize', resize);

    addEventListener('pointermove', (e) => {
      mouse.tx = (e.clientX / innerWidth) * 2 - 1;
      mouse.ty = -((e.clientY / innerHeight) * 2 - 1);
    }, { passive: true });

    if (hasGsap && window.ScrollTrigger) {
      window.ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', onUpdate: (s) => (scrollProgress = s.progress) });
    }
    new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(canvas);

    const start = performance.now();
    function draw(now) {
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      gl.uniform1f(u.uTime, reduced ? 4.0 : (now - start) / 1000);
      gl.uniform2f(u.uMouse, mouse.x, mouse.y);
      gl.uniform1f(u.uScroll, scrollProgress);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    if (reduced) { draw(performance.now()); return; }
    const loop = (now) => {
      if (visible && !document.hidden) draw(now);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  })();

  /* ------------------------------------------------------------------ */
  /* Cursor com rótulos contextuais                                      */
  /* ------------------------------------------------------------------ */
  (function cursor() {
    const el = $('.cursor');
    if (!el || !finePointer) return;
    document.body.classList.add('has-cursor');
    const dot = $('.cursor__dot', el);
    const ring = $('.cursor__ring', el);
    const label = $('.cursor__label', el);
    const pos = { x: innerWidth / 2, y: innerHeight / 2 };
    const lag = { x: pos.x, y: pos.y };
    addEventListener('pointermove', (e) => {
      pos.x = e.clientX; pos.y = e.clientY;
      el.classList.add('is-ready');
    }, { passive: true });
    addEventListener('pointerdown', () => el.classList.add('is-down'));
    addEventListener('pointerup', () => el.classList.remove('is-down'));
    document.addEventListener('pointerleave', () => el.classList.remove('is-ready'));
    document.addEventListener('pointerover', (e) => {
      const target = e.target.closest('[data-cursor]');
      if (target) { label.textContent = target.dataset.cursor; el.classList.add('has-label'); }
      else el.classList.remove('has-label');
    });
    const tick = () => {
      lag.x += (pos.x - lag.x) * (reduced ? 1 : 0.18);
      lag.y += (pos.y - lag.y) * (reduced ? 1 : 0.18);
      dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      ring.style.transform = `translate3d(${lag.x}px, ${lag.y}px, 0)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  })();

  /* ------------------------------------------------------------------ */
  /* Botões magnéticos                                                   */
  /* ------------------------------------------------------------------ */
  if (finePointer && !reduced && hasGsap) {
    $$('.magnetic').forEach((btn) => {
      const inner = $('.magnetic__inner', btn);
      const strength = 0.35;
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        gsap.to(btn, { x: x * strength, y: y * strength, duration: 0.6, ease: 'power3.out' });
        gsap.to(inner, { x: x * strength * 0.5, y: y * strength * 0.5, duration: 0.6, ease: 'power3.out' });
      });
      btn.addEventListener('pointerleave', () => {
        gsap.to([btn, inner], { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.35)' });
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Reveals de títulos por linha (SplitText com máscara)               */
  /* ------------------------------------------------------------------ */
  if (hasGsap && window.ScrollTrigger && !reduced) {
    $$('.js-reveal').forEach((el) => {
      if (window.SplitText) {
        window.SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit: (self) => gsap.from(self.lines, {
            yPercent: 105, duration: 1.2, ease: 'expo.out', stagger: 0.08,
            scrollTrigger: { trigger: el, start: 'top 82%', once: true },
          }),
        });
      } else {
        gsap.from(el, { opacity: 0, y: 40, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
      }
    });

    gsap.utils.toArray('.book, .tool, .phase, .stat, .intent').forEach((el) => {
      gsap.from(el, { opacity: 0, y: 28, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Manifesto — palavras acendem conforme o scroll                      */
  /* ------------------------------------------------------------------ */
  (function manifesto() {
    const el = $('.js-scrub-words');
    if (!el) return;
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(' ');
    const spans = $$('.w', el);
    if (!hasGsap || !window.ScrollTrigger || reduced) { spans.forEach((s) => s.classList.add('is-on')); return; }
    window.ScrollTrigger.create({
      trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true,
      onUpdate: (self) => {
        const lit = Math.round(self.progress * spans.length);
        spans.forEach((s, i) => s.classList.toggle('is-on', i < lit));
      },
    });
  })();

  /* Contadores */
  if (hasGsap && window.ScrollTrigger && !reduced) {
    $$('[data-count]').forEach((el) => {
      const to = Number(el.dataset.count);
      const obj = { v: 0 };
      gsap.to(obj, {
        v: to, duration: 1.6, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onUpdate: () => (el.textContent = String(Math.round(obj.v))),
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Marquee com inércia do scroll                                       */
  /* ------------------------------------------------------------------ */
  (function marquee() {
    const track = $('.marquee__track');
    if (!track || reduced) return;
    let x = 0;
    let dir = 1;
    let boost = 0;
    lenis?.on('scroll', (e) => {
      if (e.velocity) dir = e.velocity > 0 ? 1 : -1;
      boost = Math.min(Math.abs(e.velocity || 0) * 0.35, 18);
    });
    const step = () => {
      const half = track.scrollWidth / 2;
      x -= (0.6 + boost) * dir;
      boost *= 0.92;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      track.style.transform = `translate3d(${x}px, 0, 0)`;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  })();

  /* Anel de texto do loop gira com o scroll */
  if (hasGsap && window.ScrollTrigger && !reduced) {
    gsap.to('.loop__core', { rotate: -360, ease: 'none', scrollTrigger: { trigger: '.protocol', start: 'top bottom', end: 'bottom top', scrub: 1 } });
  }

  /* ------------------------------------------------------------------ */
  /* Simulador do router                                                 */
  /* ------------------------------------------------------------------ */
  (function routerSim() {
    const graph = $('.router__graph');
    if (!graph) return;
    const svg = $('.router__wires', graph);
    const routerNode = $('.node--router', graph);
    const flowNode = $('.node--flow', graph);
    const flowName = $('.router__flow-name', graph);
    const mods = $$('.node--mod', graph);
    const loadedEl = $('.router__loaded', graph);
    const savedEl = $('.router__saved', graph);
    const intents = $$('.intent');
    const TOTAL = 13;
    let current = intents[0];

    const anchor = (el, side) => {
      const g = graph.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return { x: (side === 'left' ? r.left : r.right) - g.left, y: r.top - g.top + r.height / 2 };
    };
    const curve = (a, b) => {
      const mx = (a.x + b.x) / 2;
      return `M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`;
    };

    function draw(animate) {
      const ids = (current.dataset.modules || '').split(',').filter(Boolean);
      const flow = current.dataset.flow;
      mods.forEach((m) => m.classList.toggle('is-on', ids.includes(m.dataset.id)));
      flowNode.classList.toggle('is-off', !flow);
      flowName.textContent = flow ? `${flow}.md` : '— sem workflow';
      const loaded = 1 + ids.length + (flow ? 1 : 0);
      loadedEl.textContent = String(loaded);
      savedEl.textContent = `${Math.round((1 - loaded / TOTAL) * 100)}%`;

      const from = anchor(routerNode, 'right');
      let paths = '';
      mods.forEach((m) => {
        const on = ids.includes(m.dataset.id);
        paths += `<path class="${on ? 'is-on' : 'is-dim'}" d="${curve(from, anchor(m, 'left'))}"/>`;
        if (on && flow) paths += `<path class="is-on" d="${curve(anchor(m, 'right'), anchor(flowNode, 'left'))}"/>`;
      });
      svg.innerHTML = paths;
      if (animate && hasGsap && !reduced) {
        $$('path.is-on', svg).forEach((p) => {
          const len = p.getTotalLength();
          gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.9, ease: 'power3.inOut' });
        });
      }
    }

    intents.forEach((btn) => {
      btn.addEventListener('click', () => {
        intents.forEach((b) => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-selected', String(b === btn)); });
        current = btn;
        draw(true);
      });
    });
    addEventListener('resize', () => draw(false));
    draw(false);
    if (window.ScrollTrigger) window.ScrollTrigger.create({ trigger: graph, start: 'top 75%', once: true, onEnter: () => draw(true) });
  })();

  /* ------------------------------------------------------------------ */
  /* Terminal simulado                                                   */
  /* ------------------------------------------------------------------ */
  (function terminal() {
    const code = $('.terminal__code');
    if (!code) return;
    const frames = $('.frames');
    const grid = $('.frames__grid');
    const tabs = $$('.tool');

    const DEMOS = {
      scrap: [
        ['$', 'web-url-fetch https://sotd-exemplo.studio'],
        ['✔', 'aberto https://sotd-exemplo.studio/ (HTTP 200) em 2.1s'],
        [' ', '  viewport   1440x900 @2x · headless'],
        [' ', '  hooks      canvas · webgl/shaders · WAAPI · rAF · fontes'],
        ['$', 'web-wait-page-load'],
        ['✔', 'página estável em 3.4s · 96 recursos'],
        ['⚠', 'overlay de tela cheia (div#preloader) → web-wait 3'],
        ['$', 'web-scrap'],
        ['✔', 'web-scrap https://sotd-exemplo.studio/'],
        [' ', '  stack      Three.js 158 · Astro · GSAP 3.13 · Lenis 1.3'],
        [' ', '  fontes     Neue Grotesk 61% [Self-hosted] · JetBrains Mono [Google Fonts]'],
        [' ', '  escala     144/400 · 49/400 · 38/400 · 26/400 · 16/400'],
        [' ', '  paleta     fundo #ffffff (74%) · texto #000000 (95%) · mono? sim'],
        [' ', '  mídia      canvas webgl2 (fullscreen) · 80 shaders capturados'],
        [' ', '  efeitos    mix-blend ×1 · sticky ×2 · cursor customizado'],
        [' ', '  contraste  ok em 793 textos'],
        [' ', '  json       .parede/scrap/sotd-exemplo.studio.json'],
      ],
      record: [
        ['$', 'web-record-frames --while "scroll-down 4000 --steps 80" --interval 0.5'],
        [' ', '  ◐ screencast do compositor · 0.5s/frame · jpeg q85'],
        ['✔', '12 frames em 6.0s (parada: ações concluídas)'],
        [' ', '  sprite     .parede/recordings/2026-10-23/spritesheet-01.png'],
        [' ', '  vídeo      .parede/recordings/2026-10-23/session.mp4'],
        [' ', '  → leia a spritesheet para avaliar a coreografia quadro a quadro'],
      ],
      control: [
        ['$', 'web-control inventory --limit 4'],
        ['✔', 'inventory: 4 de 18 elementos interativos'],
        [' ', '  ◉ #install  button "Instalar nossa Skill"'],
        [' ', '  ◉ nav > a:nth-of-type(1)  a "Router"'],
        [' ', '  ○ footer .top  a "Voltar ao topo"'],
        ['$', 'web-control hover "#install" --hold 600ms --screenshot'],
        ['✔', 'hover #install {"at":{"x":1180,"y":742}}'],
        [' ', '  captura    .parede/screenshots/after-hover.png'],
        ['$', 'web-control sequence "scroll-to #precos; wait 0.5; click #comprar"'],
        ['✔', 'scroll-to #precos {"reached":2140}'],
        ['✔', 'wait 500ms'],
        ['✔', 'click #comprar'],
        [' ', '  estado     scrollY 2140/5320 · foco button#comprar'],
      ],
    };

    const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    let run = 0;
    const sleep = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));

    function buildFrames() {
      grid.innerHTML = '';
      for (let k = 0; k < 12; k++) {
        const f = document.createElement('div');
        f.className = 'frame';
        const shift = k * 7;
        f.innerHTML = [0, 1, 2, 3].map((j) => {
          const top = 18 + j * 16 - shift;
          const width = [72, 54, 64, 38][j];
          return top > -10 && top < 100 ? `<i style="top:${top}%;width:${width}%"></i>` : '';
        }).join('') + `<i style="top:${Math.max(4, 82 - shift * 1.4)}%;left:58%;width:32%;height:${Math.min(60, 10 + shift)}%"></i>`;
        grid.appendChild(f);
      }
    }

    async function play(name) {
      const id = ++run;
      const lines = DEMOS[name];
      code.innerHTML = '';
      frames.classList.toggle('is-on', name === 'record');
      if (name === 'record') buildFrames();
      let html = '';
      for (const [kind, text] of lines) {
        if (id !== run) return;
        if (kind === '$') {
          for (let i = 0; i <= text.length; i += 2) {
            if (id !== run) return;
            code.innerHTML = `${html}<span class="p">$ </span>${esc(text.slice(0, i))}<span class="caret"></span>`;
            await sleep(18);
          }
          html += `<span class="p">$ </span>${esc(text)}\n`;
          await sleep(260);
        } else {
          const cls = kind === '✔' || kind === '⚠' ? 'o' : 'm';
          html += `<span class="${cls}">${kind === ' ' ? '' : `${kind} `}${esc(text)}</span>\n`;
          code.innerHTML = `${html}<span class="caret"></span>`;
          await sleep(70);
        }
      }
      if (name === 'record') {
        for (const f of $$('.frame', grid)) {
          if (id !== run) return;
          f.classList.add('is-on');
          await sleep(110);
        }
      }
    }

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => { t.classList.toggle('is-active', t === tab); t.setAttribute('aria-selected', String(t === tab)); });
        play(tab.dataset.demo);
      });
    });

    let started = false;
    new IntersectionObserver(([entry], obs) => {
      if (entry.isIntersecting && !started) { started = true; play('scrap'); obs.disconnect(); }
    }, { threshold: 0.35 }).observe($('.terminal'));
  })();

  /* ------------------------------------------------------------------ */
  /* Instalar nossa Skill — copia o prompt e abre o painel               */
  /* ------------------------------------------------------------------ */
  (function install() {
    const modal = $('#install-modal');
    const prompt = $('#bootstrap-prompt');
    if (!modal || !prompt) return;
    const statusText = $('.modal__status-text', modal);
    const copyBtn = $('.js-copy', modal);

    async function copy() {
      const text = prompt.textContent.trim();
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        const range = document.createRange();
        range.selectNodeContents(prompt);
        const sel = getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        let ok = false;
        try { ok = document.execCommand('copy'); } catch { ok = false; }
        sel.removeAllRanges();
        return ok;
      }
    }

    async function copyAndReport() {
      const ok = await copy();
      statusText.textContent = ok ? 'Prompt copiado para a área de transferência' : 'Selecione e copie o prompt abaixo';
      copyBtn.textContent = ok ? 'Copiado ✓' : 'Copiar prompt';
      if (ok) setTimeout(() => (copyBtn.textContent = 'Copiar prompt'), 2400);
    }

    $$('.js-install').forEach((btn) => btn.addEventListener('click', async () => {
      lenis?.stop();
      if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
      await copyAndReport();
    }));
    copyBtn.addEventListener('click', copyAndReport);
    const close = () => { if (modal.open) modal.close(); };
    $('.modal__close', modal).addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    modal.addEventListener('close', () => lenis?.start());
  })();
})();
