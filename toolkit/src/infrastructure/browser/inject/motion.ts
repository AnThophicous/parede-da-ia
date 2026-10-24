/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Motion collectors that run INSIDE the page. Self-contained (page.evaluate).
 *
 * collectMotion  → what is declared/running now (WAAPI, CSS transitions, @keyframes,
 *                  GSAP/ScrollTrigger when exposed, Lenis/Locomotive, prefers-reduced-motion)
 * startObserve   → starts watching inline style mutations + sampling frames (rAF)
 * stopObserve    → stops and summarizes: which elements animated, which properties, fps/jank
 *
 * The observation works even with bundled GSAP/Motion (no global): they write
 * inline styles every frame, and that is what the MutationObserver records.
 */

export function collectMotion() {
  const w = window as any;
  const doc = document;
  const label = (el: Element | null | undefined): string => {
    if (!el || !(el as Element).tagName) return '—';
    const e = el as Element;
    const cls = typeof e.className === 'string' ? e.className.trim().split(' ').filter(Boolean).slice(0, 2) : [];
    return `${e.tagName.toLowerCase()}${e.id ? `#${e.id}` : ''}${cls.length ? `.${cls.join('.')}` : ''}`;
  };
  const bump = (map: Map<string, number>, key: string, by = 1) => map.set(key, (map.get(key) ?? 0) + by);
  const top = (map: Map<string, number>, n: number) => {
    const total = [...map.values()].reduce((s, v) => s + v, 0) || 1;
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([value, c]) => ({ value, share: Math.round((c / total) * 1000) / 10 }));
  };
  /** Splits CSS lists on top-level commas (cubic-bezier(a, b, c, d) has inner commas). */
  const splitTop = (value: string) => {
    const out: string[] = [];
    let depth = 0;
    let cur = '';
    for (const ch of value) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) {
        out.push(cur.trim());
        cur = '';
      } else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  };
  const toMs = (v: string) => (v.endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000);

  // ── animations running now (CSS animations, CSS transitions, WAAPI) ──
  const anims: any[] = typeof doc.getAnimations === 'function' ? doc.getAnimations() : [];
  const byKind = new Map<string, number>();
  const items = anims.slice(0, 80).map((a) => {
    const kind = a.constructor?.name ?? 'Animation';
    bump(byKind, kind);
    const effect = a.effect;
    const timing = effect?.getTiming ? effect.getTiming() : {};
    let properties: string[] = [];
    try {
      const frames: Record<string, unknown>[] = effect?.getKeyframes ? effect.getKeyframes() : [];
      const keys: string[] = frames.flatMap((f) => Object.keys(f));
      properties = [...new Set(keys)].filter((k) => !['offset', 'computedOffset', 'easing', 'composite'].includes(k));
    } catch {
      /* ignore */
    }
    return {
      kind,
      name: a.animationName ?? a.transitionProperty ?? a.id ?? '',
      target: label(effect?.target),
      durationMs: typeof timing.duration === 'number' ? Math.round(timing.duration) : null,
      delayMs: Math.round(timing.delay ?? 0),
      easing: timing.easing ?? 'linear',
      iterations: timing.iterations === Infinity ? 'infinite' : (timing.iterations ?? 1),
      playState: a.playState,
      properties,
    };
  });
  for (const a of anims.slice(80)) bump(byKind, a.constructor?.name ?? 'Animation');

  // ── declared transitions (the site's motion "vocabulary") ──
  const durations = new Map<string, number>();
  const easings = new Map<string, number>();
  const properties = new Map<string, number>();
  let transitionElements = 0;
  let scrollDriven = 0;
  let viewTransitions = 0;
  for (const el of Array.from(doc.querySelectorAll('body *')).slice(0, 4000)) {
    const cs = getComputedStyle(el) as any;
    if (cs.animationTimeline && !/^(auto|none)$/.test(cs.animationTimeline)) scrollDriven++;
    if (cs.viewTransitionName && cs.viewTransitionName !== 'none') viewTransitions++;
    const ds = splitTop(cs.transitionDuration);
    if (!ds.some((d) => parseFloat(d) > 0)) continue;
    transitionElements++;
    const es = splitTop(cs.transitionTimingFunction);
    const ps = splitTop(cs.transitionProperty);
    ds.forEach((d, i) => {
      if (parseFloat(d) <= 0) return;
      bump(durations, `${Math.round(toMs(d))}ms`);
      bump(easings, es[i % es.length] ?? 'ease');
      bump(properties, ps[i % ps.length] ?? 'all');
    });
  }

  // ── @keyframes and reduced-motion rules in accessible stylesheets ──
  const keyframes: { name: string; css: string }[] = [];
  let reducedRules = 0;
  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSKeyframesRule) {
        if (keyframes.length < 40) keyframes.push({ name: rule.name, css: rule.cssText.replace(/\s+/g, ' ').slice(0, 400) });
      } else if (rule instanceof CSSMediaRule) {
        if (/prefers-reduced-motion/.test(rule.conditionText)) reducedRules++;
        walk(rule.cssRules);
      } else if ('cssRules' in rule) {
        try {
          walk((rule as CSSGroupingRule).cssRules);
        } catch {
          /* ignore */
        }
      }
    }
  };
  for (const sheet of Array.from(doc.styleSheets)) {
    try {
      walk(sheet.cssRules);
    } catch {
      /* cross-origin */
    }
  }
  let reducedInJs = false;
  try {
    reducedInJs = Array.from(doc.scripts).some((s) => !s.src && /prefers-reduced-motion/.test(s.text));
  } catch {
    /* ignore */
  }

  // ── GSAP / ScrollTrigger (when exposed on window) ──
  let gsap: any = null;
  const g = w.gsap;
  if (g?.globalTimeline) {
    const CONTROL = new Set(['ease', 'duration', 'delay', 'onComplete', 'onUpdate', 'onStart', 'scrollTrigger', 'stagger', 'repeat', 'yoyo', 'overwrite', 'immediateRender', 'paused', 'id', 'callbackScope', 'runBackwards', 'startAt', 'data', 'lazy', 'inherit', 'onReverseComplete', 'onRepeat', 'onInterrupt', 'repeatDelay', 'repeatRefresh', 'reversed', 'yoyoEase', 'keyframes', 'force3D', 'parent']);
    let children: any[] = [];
    try {
      children = g.globalTimeline.getChildren(true, true, false);
    } catch {
      /* ignore */
    }
    const tweens = children.slice(0, 150).map((t) => {
      const targets = typeof t.targets === 'function' ? t.targets() : [];
      const ease = t.vars?.ease;
      return {
        targets: targets.slice(0, 3).map((x: any) => (x instanceof Element ? label(x) : typeof x)).join(', ') + (targets.length > 3 ? ` +${targets.length - 3}` : ''),
        durationS: Math.round((typeof t.duration === 'function' ? t.duration() : 0) * 1000) / 1000,
        ease: typeof ease === 'string' ? ease : ease ? 'custom' : String(g.defaults?.()?.ease ?? 'power1.out'),
        props: Object.keys(t.vars ?? {}).filter((k) => !CONTROL.has(k)).slice(0, 8),
        delayS: Math.round((typeof t.delay === 'function' ? t.delay() : 0) * 1000) / 1000,
        repeat: typeof t.repeat === 'function' ? t.repeat() : 0,
        stagger: Boolean(t.vars?.stagger),
        scrollTrigger: Boolean(t.vars?.scrollTrigger || t.scrollTrigger),
      };
    });
    const ST = w.ScrollTrigger;
    const triggers = ST?.getAll
      ? ST.getAll().slice(0, 80).map((st: any) => ({
          trigger: st.trigger ? label(st.trigger) : '—',
          start: typeof st.vars?.start === 'string' ? st.vars.start : st.vars?.start ? 'function' : 'top bottom',
          end: typeof st.vars?.end === 'string' ? st.vars.end : st.vars?.end ? 'function' : 'bottom top',
          scrub: st.vars?.scrub ?? null,
          pin: Boolean(st.vars?.pin),
          toggleActions: st.vars?.toggleActions ?? null,
        }))
      : [];
    gsap = { version: g.version ?? null, global: true, tweens, scrollTriggers: triggers };
  } else if (w.gsapVersions?.length) {
    gsap = { version: String(w.gsapVersions[0]), global: false, tweens: [], scrollTriggers: [] };
  }

  // ── smooth scroll ──
  let smooth: { library: string | null; options: Record<string, unknown> | null } = { library: null, options: null };
  const lenis = w.lenis ?? w.__lenis ?? null;
  if (lenis?.options) {
    const o = lenis.options;
    smooth = { library: 'Lenis', options: { lerp: o.lerp, duration: o.duration, smoothWheel: o.smoothWheel, wheelMultiplier: o.wheelMultiplier, touchMultiplier: o.touchMultiplier, easing: typeof o.easing === 'function' ? 'function' : o.easing, orientation: o.orientation } };
  } else if (w.lenisVersion || doc.documentElement.classList.contains('lenis')) {
    smooth = { library: 'Lenis', options: null };
  } else if (doc.documentElement.classList.contains('has-scroll-smooth') || doc.querySelector('[data-scroll-container]')) {
    smooth = { library: 'Locomotive Scroll', options: null };
  }

  const libraries: string[] = [];
  if (gsap) libraries.push(`GSAP ${gsap.version ?? ''}`.trim() + (gsap.global ? '' : ' (bundled)'));
  if (w.ScrollTrigger) libraries.push('ScrollTrigger');
  if (smooth.library) libraries.push(smooth.library);
  if ((w.__PAREDE__?.waapi ?? 0) > 3) libraries.push('Web Animations API (Motion/Framer Motion)');
  if (w.anime) libraries.push('Anime.js');
  if (w.lottie || w.bodymovin) libraries.push('Lottie');
  if (w.barba) libraries.push('Barba.js');

  return {
    url: location.href,
    libraries,
    running: { total: anims.length, byKind: Object.fromEntries(byKind), items },
    transitions: { elements: transitionElements, durations: top(durations, 8), easings: top(easings, 8), properties: top(properties, 10) },
    keyframes,
    gsap,
    smoothScroll: smooth,
    reducedMotion: { rulesFound: reducedRules, respected: reducedRules > 0 || reducedInJs },
    scrollDriven,
    viewTransitions,
  };
}

export function startObserve() {
  const w = window as any;
  if (w.__PAREDE_OBS__) w.__PAREDE_OBS__.stop?.();
  const PROPS = ['transform', 'translate', 'scale', 'rotate', 'opacity', 'clip-path', 'filter', 'visibility', 'background-color', 'color', 'width', 'height', 'top', 'left', 'letter-spacing', 'stroke-dashoffset', 'font-variation-settings'];
  const els = new Map<Element, { changes: number; props: Record<string, { first: string; last: string; samples: number }> }>();
  const state = { start: performance.now(), mutations: 0, frames: [] as number[], running: true };
  const track = (el: Element, prop: string, value: string) => {
    let entry = els.get(el);
    if (!entry) {
      if (els.size > 500) return;
      entry = { changes: 0, props: {} };
      els.set(el, entry);
    }
    entry.changes++;
    const slot = entry.props[prop];
    if (!slot) entry.props[prop] = { first: value, last: value, samples: 1 };
    else if (slot.last !== value) {
      slot.last = value;
      slot.samples++;
    }
  };
  const mo = new MutationObserver((records) => {
    for (const r of records) {
      state.mutations++;
      const el = r.target as HTMLElement;
      if (r.attributeName === 'class') {
        track(el, 'class', (typeof el.className === 'string' ? el.className : '').slice(0, 120));
        continue;
      }
      const style = el.style;
      if (!style) continue;
      for (const p of PROPS) {
        const v = style.getPropertyValue(p);
        if (v) track(el, p, v.slice(0, 120));
      }
    }
  });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'], subtree: true });
  let last = performance.now();
  const tick = (t: number) => {
    if (!state.running) return;
    state.frames.push(t - last);
    last = t;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  w.__PAREDE_OBS__ = {
    els,
    state,
    stop: () => {
      state.running = false;
      mo.disconnect();
    },
  };
  return true;
}

export function stopObserve() {
  const w = window as any;
  const obs = w.__PAREDE_OBS__;
  if (!obs) return null;
  obs.stop();
  const label = (e: Element): string => {
    const cls = typeof e.className === 'string' ? e.className.trim().split(' ').filter(Boolean).slice(0, 2) : [];
    return `${e.tagName.toLowerCase()}${e.id ? `#${e.id}` : ''}${cls.length ? `.${cls.join('.')}` : ''}`;
  };
  const propCount = new Map<string, number>();
  const elements = [...obs.els.entries()]
    .map(([el, v]: [Element, { changes: number; props: Record<string, { first: string; last: string; samples: number }> }]) => {
      for (const p of Object.keys(v.props)) propCount.set(p, (propCount.get(p) ?? 0) + 1);
      return { selector: label(el), changes: v.changes, props: v.props };
    })
    .filter((e: { props: Record<string, { samples: number }> }) => Object.values(e.props).some((p) => p.samples > 1))
    .sort((a: { changes: number }, b: { changes: number }) => b.changes - a.changes)
    .slice(0, 40);
  const total = [...propCount.values()].reduce((s, v) => s + v, 0) || 1;
  const frames: number[] = obs.state.frames.slice(1);
  const duration = performance.now() - obs.state.start;
  const sorted = [...frames].sort((a, b) => a - b);
  delete w.__PAREDE_OBS__;
  return {
    durationMs: Math.round(duration),
    mutations: obs.state.mutations,
    elements,
    properties: [...propCount.entries()].sort((a, b) => b[1] - a[1]).map(([value, c]) => ({ value, share: Math.round((c / total) * 1000) / 10 })),
    frames: frames.length
      ? {
          frames: frames.length,
          fps: Math.round((frames.length / (duration / 1000)) * 10) / 10,
          p95FrameMs: Math.round(sorted[Math.floor(sorted.length * 0.95)] * 10) / 10,
          worstFrameMs: Math.round(sorted[sorted.length - 1] * 10) / 10,
          longFrames: frames.filter((f) => f > 34).length,
        }
      : null,
  };
}
