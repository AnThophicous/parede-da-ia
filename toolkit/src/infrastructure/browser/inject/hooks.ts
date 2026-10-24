/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Instrumentação injetada ANTES de qualquer script da página (context.addInitScript).
 * Precisa ser autocontida: o Playwright serializa a função com toString().
 *
 * Coleta, sem alterar o comportamento da página:
 *  - contextos de canvas criados (2d / webgl / webgl2 / webgpu / bitmaprenderer)
 *  - código-fonte de shaders GLSL compilados (deduplicado)
 *  - chamadas à Web Animations API (Motion/Framer Motion usam WAAPI)
 *  - frequência de requestAnimationFrame (indica loop de animação em JS)
 *  - fontes carregadas via document.fonts
 *  - console.error/warn, rejeições não tratadas
 *  - Web Vitals: CLS, LCP (e o elemento), long tasks
 */
export function installHooks(): void {
  const w = window as any;
  if (w.__PAREDE__) return;

  const state = {
    version: 1,
    startedAt: Date.now(),
    contexts: { '2d': 0, webgl: 0, webgl2: 0, webgpu: 0, bitmaprenderer: 0, other: 0 } as Record<string, number>,
    canvasContext: new WeakMap<object, string>(),
    shaders: [] as { type: string; length: number; hash: string; source: string }[],
    shaderHashes: new Set<string>(),
    waapi: 0,
    raf: 0,
    fontsLoaded: [] as string[],
    console: [] as { type: string; at: number; text: string }[],
    perf: { cls: 0, lcpMs: null as number | null, lcpElement: null as string | null, longTasks: 0, longTaskMs: 0 },
  };
  try {
    Object.defineProperty(w, '__PAREDE__', { value: state, enumerable: false, configurable: false });
  } catch {
    return;
  }

  try {
    performance.setResourceTimingBufferSize(10_000);
  } catch {
    /* navegadores antigos */
  }

  const observe = (type: string, onEntries: (entries: any[]) => void) => {
    try {
      new PerformanceObserver((list) => onEntries(list.getEntries())).observe({ type, buffered: true } as PerformanceObserverInit);
    } catch {
      /* tipo não suportado */
    }
  };
  observe('layout-shift', (entries) => {
    for (const e of entries) if (!e.hadRecentInput) state.perf.cls = Math.round((state.perf.cls + e.value) * 1000) / 1000;
  });
  observe('largest-contentful-paint', (entries) => {
    const last = entries[entries.length - 1];
    if (!last) return;
    state.perf.lcpMs = Math.round(last.startTime);
    const el = last.element as Element | null;
    const cls = el && typeof el.className === 'string' ? el.className.trim().split(' ').filter(Boolean).slice(0, 2).join('.') : '';
    state.perf.lcpElement = el ? `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls ? `.${cls}` : ''}` : null;
  });
  observe('longtask', (entries) => {
    for (const e of entries) {
      state.perf.longTasks++;
      state.perf.longTaskMs += Math.round(e.duration);
    }
  });

  const hash = (text: string) => {
    let h = 5381;
    for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  };

  const patchGetContext = (proto: any) => {
    if (!proto || !proto.getContext) return;
    const original = proto.getContext;
    proto.getContext = function (this: any, type: string, ...rest: unknown[]) {
      const ctx = original.call(this, type, ...rest);
      try {
        if (ctx && !this.__paredeInternal && !state.canvasContext.has(this)) {
          state.canvasContext.set(this, type);
          const key = type === 'experimental-webgl' ? 'webgl' : type;
          state.contexts[key in state.contexts ? key : 'other']++;
        }
      } catch {
        /* nunca quebrar a página */
      }
      return ctx;
    };
  };
  patchGetContext(w.HTMLCanvasElement?.prototype);
  patchGetContext(w.OffscreenCanvas?.prototype);

  for (const ctor of [w.WebGLRenderingContext, w.WebGL2RenderingContext]) {
    if (!ctor?.prototype?.shaderSource) continue;
    const original = ctor.prototype.shaderSource;
    ctor.prototype.shaderSource = function (this: any, shader: unknown, source: string) {
      try {
        if (typeof source === 'string' && state.shaders.length < 80) {
          const h = hash(source);
          if (!state.shaderHashes.has(h)) {
            state.shaderHashes.add(h);
            const kind = this.getShaderParameter(shader, this.SHADER_TYPE) === this.VERTEX_SHADER ? 'vertex' : 'fragment';
            state.shaders.push({ type: kind, length: source.length, hash: h, source: source.slice(0, 6000) });
          }
        }
      } catch {
        /* ignore */
      }
      return original.call(this, shader, source);
    };
  }

  if (w.Element?.prototype?.animate) {
    const original = w.Element.prototype.animate;
    w.Element.prototype.animate = function (this: Element, ...args: unknown[]) {
      state.waapi++;
      return original.apply(this, args);
    };
  }

  const originalRaf = w.requestAnimationFrame;
  if (originalRaf) {
    w.requestAnimationFrame = function (cb: FrameRequestCallback) {
      state.raf++;
      return originalRaf.call(w, cb);
    };
  }

  // console.error/warn capturados aqui (barato) em vez de via CDP: sites com detecção anti-DevTools
  // (truques com %c e getters) degradam o render quando um cliente serializa o console.
  const describe = (a: unknown) =>
    typeof a === 'string' ? a : a instanceof Error ? `${a.name}: ${a.message}` : typeof a === 'number' || typeof a === 'boolean' ? String(a) : Object.prototype.toString.call(a);
  const pushLog = (type: string, args: unknown[]) => {
    if (state.console.length < 300) state.console.push({ type, at: Date.now(), text: args.map(describe).join(' ').slice(0, 600) });
  };
  for (const [level, type] of [['error', 'error'], ['warn', 'warning']] as const) {
    const original = (console as any)[level];
    (console as any)[level] = function (this: unknown, ...args: unknown[]) {
      try {
        pushLog(type, args);
      } catch {
        /* ignore */
      }
      return original.apply(this, args);
    };
  }
  w.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    try {
      pushLog('error', ['Unhandled rejection:', event.reason]);
    } catch {
      /* ignore */
    }
  });

  try {
    document.fonts?.addEventListener('loadingdone', (event: any) => {
      for (const face of event.fontfaces ?? []) {
        const label = `${face.family.replace(/["']/g, '')} ${face.weight} ${face.style}`;
        if (!state.fontsLoaded.includes(label)) state.fontsLoaded.push(label);
      }
    });
  } catch {
    /* ignore */
  }
}
