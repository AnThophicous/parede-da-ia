/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Computed-DOM inspector that runs INSIDE the page (page.evaluate).
 * Self-contained by necessity: no references to imports or outer closures.
 */
export interface ScanOptions {
  maxElements: number;
  extraVarNames: string[];
}

export function scanPage(opts: ScanOptions) {
  const w = window as any;
  const hooks = w.__PAREDE__;
  const doc = document;
  const root = doc.documentElement;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;

  // ───────────────────────── colors ─────────────────────────
  type Rgba = { r: number; g: number; b: number; a: number; hex: string };
  const probe = doc.createElement('canvas') as any;
  probe.__paredeInternal = true;
  probe.width = probe.height = 1;
  const ctx = probe.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
  const cache = new Map<string, Rgba | null>();
  const hex2 = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  const make = (r: number, g: number, b: number, a: number): Rgba => {
    const alpha = Math.round(a * 100) / 100;
    return { r: Math.round(r), g: Math.round(g), b: Math.round(b), a: alpha, hex: `#${hex2(r)}${hex2(g)}${hex2(b)}${alpha < 1 ? hex2(alpha * 255) : ''}` };
  };
  const parseColor = (input: string | null | undefined): Rgba | null => {
    if (!input) return null;
    const key = input.trim();
    if (cache.has(key)) return cache.get(key)!;
    let out: Rgba | null = null;
    const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i.exec(key);
    if (m) {
      const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      out = make(+m[1], +m[2], +m[3], a);
    } else if (!/^(transparent|none|currentcolor|inherit|initial|auto)$/i.test(key) && !/^-?[\d.]+(px|rem|em|%|s|ms)?$/.test(key)) {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = '#010203';
      ctx.fillStyle = key;
      if (ctx.fillStyle !== '#010203' || /^#010203$/i.test(key)) {
        ctx.fillRect(0, 0, 1, 1);
        const d = ctx.getImageData(0, 0, 1, 1).data;
        out = make(d[0], d[1], d[2], d[3] / 255);
      }
    }
    if (out && out.a === 0) out = null;
    cache.set(key, out);
    return out;
  };
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (c: Rgba) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const contrast = (a: Rgba, b: Rgba) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const blend = (top: Rgba, base: Rgba): Rgba =>
    make(top.r * top.a + base.r * (1 - top.a), top.g * top.a + base.g * (1 - top.a), top.b * top.a + base.b * (1 - top.a), 1);
  const chroma = (c: Rgba) => Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b);
  const extractColors = (value: string) =>
    (value.match(/(rgba?\([^)]*\)|#[0-9a-f]{3,8}\b|(?:oklch|oklab|lab|lch|hsla?|color)\([^)]*\))/gi) ?? [])
      .map(parseColor)
      .filter((c): c is Rgba => Boolean(c));

  const bump = (map: Map<string, number>, key: string, by = 1) => map.set(key, (map.get(key) ?? 0) + by);
  const top = (map: Map<string, number>, n: number) => {
    const total = [...map.values()].reduce((s, v) => s + v, 0) || 1;
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([value, weight]) => ({ value, share: Math.round((weight / total) * 1000) / 10 }));
  };

  // ───────────────────────── selectors ─────────────────────────
  const safeIdent = (s: string) => /^[A-Za-z_][\w-]*$/.test(s);
  const unique = (sel: string) => {
    try {
      return doc.querySelectorAll(sel).length === 1;
    } catch {
      return false;
    }
  };
  const selectorOf = (el: Element): string => {
    if (el.id && safeIdent(el.id) && unique(`#${el.id}`)) return `#${el.id}`;
    const parts: string[] = [];
    let node: Element | null = el;
    while (node && node !== doc.body && node !== root && parts.length < 6) {
      if (node.id && safeIdent(node.id)) {
        parts.unshift(`#${node.id}`);
        break;
      }
      let part = node.tagName.toLowerCase();
      const testId = node.getAttribute('data-testid');
      if (testId) part += `[data-testid="${testId.replace(/"/g, '\\"')}"]`;
      const classes = Array.from(node.classList).filter((c) => safeIdent(c) && c.length < 30).slice(0, 2);
      if (classes.length) part += `.${classes.join('.')}`;
      const parent: Element | null = node.parentElement;
      if (parent) {
        const tag = node.tagName;
        const siblings = Array.from(parent.children).filter((c) => c.tagName === tag);
        if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
      }
      parts.unshift(part);
      if (unique(parts.join(' > '))) return parts.join(' > ');
      node = parent;
    }
    return parts.join(' > ') || el.tagName.toLowerCase();
  };
  const directText = (el: Element) => {
    let text = '';
    for (const n of Array.from(el.childNodes)) if (n.nodeType === 3) text += n.textContent ?? '';
    return text.replace(/\s+/g, ' ').trim();
  };

  // ───────────────────────── stylesheets ─────────────────────────
  const varSources = new Map<string, string>();
  const keyframes = new Set<string>();
  const fontFaces: { family: string; weight: string; style: string; display: string; src: string }[] = [];
  let crossOriginSheets = 0;
  let ruleCount = 0;
  const walkRules = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      ruleCount++;
      if (rule instanceof CSSStyleRule) {
        if (/:root|^\s*html|^\s*body|\[data-theme|\[data-mode|\.dark|\.light|:host/.test(rule.selectorText)) {
          for (let i = 0; i < rule.style.length; i++) {
            const prop = rule.style[i];
            if (prop.startsWith('--') && !varSources.has(prop)) varSources.set(prop, rule.selectorText.slice(0, 60));
          }
        }
      } else if (rule instanceof CSSKeyframesRule) {
        keyframes.add(rule.name);
      } else if (rule instanceof CSSFontFaceRule) {
        if (fontFaces.length < 80) {
          fontFaces.push({
            family: rule.style.getPropertyValue('font-family').replace(/["']/g, '').trim(),
            weight: rule.style.getPropertyValue('font-weight') || '400',
            style: rule.style.getPropertyValue('font-style') || 'normal',
            display: rule.style.getPropertyValue('font-display') || 'auto',
            src: rule.style.getPropertyValue('src').slice(0, 240),
          });
        }
      } else if (rule instanceof CSSImportRule) {
        try {
          if (rule.styleSheet) walkRules(rule.styleSheet.cssRules);
        } catch {
          crossOriginSheets++;
        }
      } else if ('cssRules' in rule) {
        try {
          walkRules((rule as CSSGroupingRule).cssRules);
        } catch {
          /* ignore */
        }
      }
    }
  };
  for (const sheet of Array.from(doc.styleSheets)) {
    try {
      walkRules(sheet.cssRules);
    } catch {
      crossOriginSheets++;
    }
  }
  for (const name of opts.extraVarNames) if (!varSources.has(name)) varSources.set(name, '(external css)');

  const rootStyle = getComputedStyle(root);
  const bodyStyle = doc.body ? getComputedStyle(doc.body) : rootStyle;
  const colorVars: { name: string; value: string; hex: string; selector: string }[] = [];
  const otherVars: { name: string; value: string }[] = [];
  for (const [name, selector] of varSources) {
    const value = (rootStyle.getPropertyValue(name) || bodyStyle.getPropertyValue(name)).trim();
    if (!value) continue;
    const color = /^[\d.-]+$/.test(value) ? null : parseColor(value);
    if (color) colorVars.push({ name, value: value.slice(0, 80), hex: color.hex, selector });
    else if (otherVars.length < 150) otherVars.push({ name, value: value.slice(0, 80) });
  }

  // ───────────────────────── DOM sweep ─────────────────────────
  const all = Array.from(doc.querySelectorAll('body *'));
  const elements = all.slice(0, opts.maxElements);
  const bg = new Map<string, number>();
  const text = new Map<string, number>();
  const borders = new Map<string, number>();
  const svgPaint = new Map<string, number>();
  const gradients = new Map<string, number>();
  const interactive = new Map<string, number>();
  const fontsUsed = new Map<string, number>();
  const textStyles = new Map<string, { count: number; sample: string; tag: string }>();
  const spacing = new Map<string, number>();
  const radii = new Map<string, number>();
  const shadows = new Set<string>();
  const bgImages = new Set<string>();
  const effects = {
    backdropFilter: 0, mixBlendMode: 0, filter: 0, transform3d: 0, perspective: 0, clipPath: 0, mask: 0,
    willChange: 0, sticky: 0, fixed: 0, transitions: 0, scrollSnap: 0, scrollDrivenAnimations: 0,
    viewTransitions: 0, grainOverlays: 0, customCursor: false, grid: 0, flex: 0,
    blurFilters: 0, largeBlurs: 0, backdropBlurs: 0, rotated: 0, draggable: 0,
  };
  const gradientCss = new Map<string, number>();
  const motionDurations = new Map<string, number>();
  const motionEasings = new Map<string, number>();
  const motionProps = new Map<string, number>();
  const maxWidths = new Map<string, number>();
  /** Splits CSS lists on top-level commas (cubic-bezier has inner commas). */
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
  const animationNames = new Set<string>();
  const contrastIssues: { selector: string; text: string; fg: string; bg: string; ratio: number; required: number; uncertain: boolean }[] = [];
  let contrastChecked = 0;
  const contrastGroups = new Map<string, Set<Element>>();
  const bgLayerCache = new Map<Element, { color: Rgba | null; image: boolean }>();
  const layerOf = (el: Element) => {
    let info = bgLayerCache.get(el);
    if (!info) {
      const cs = getComputedStyle(el);
      info = { color: parseColor(cs.backgroundColor), image: cs.backgroundImage !== 'none' || /^(CANVAS|VIDEO|IMG)$/.test(el.tagName) };
      bgLayerCache.set(el, info);
    }
    return info;
  };
  const pageBase = parseColor(bodyStyle.backgroundColor) ?? parseColor(rootStyle.backgroundColor) ?? make(255, 255, 255, 1);
  const effectiveBg = (el: Element) => {
    const layers: Rgba[] = [];
    let uncertain = false;
    for (let node: Element | null = el; node; node = node.parentElement) {
      const info = layerOf(node);
      if (info.image) uncertain = true;
      if (info.color) {
        layers.push(info.color);
        if (info.color.a >= 0.99) break;
      }
    }
    let base = layers.length && layers[layers.length - 1].a >= 0.99 ? layers.pop()! : pageBase;
    for (let i = layers.length - 1; i >= 0; i--) base = blend(layers[i], base);
    return { color: base, uncertain };
  };

  // Media (even siblings with pointer-events: none) that may sit behind texts.
  const mediaRects = Array.from(doc.querySelectorAll('img, video, canvas, picture, iframe, svg[width]'))
    .map((m) => {
      const r = m.getBoundingClientRect();
      return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
    })
    .filter((r) => r.w * r.h > 400);
  const overMedia = (el: Element) => {
    const r = el.getBoundingClientRect();
    const t = { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
    const area = t.w * t.h || 1;
    return mediaRects.some((m) => {
      const ix = Math.max(0, Math.min(t.x + t.w, m.x + m.w) - Math.max(t.x, m.x));
      const iy = Math.max(0, Math.min(t.y + t.h, m.y + m.h) - Math.max(t.y, m.y));
      return (ix * iy) / area >= 0.3;
    });
  };
  const isInteractive = (el: Element) => el.matches('a, button, [role="button"], [role="tab"], input[type="submit"], input[type="button"], summary');
  const rootArea = vw * Math.max(root.scrollHeight, vh);
  bump(bg, pageBase.hex, rootArea * 0.25);

  for (const el of elements) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    const area = Math.min(rect.width, vw) * Math.min(rect.height, Math.max(root.scrollHeight, vh));
    const opacity = parseFloat(cs.opacity);

    const bgColor = parseColor(cs.backgroundColor);
    if (bgColor) bump(bg, bgColor.hex, area * bgColor.a);
    if (cs.backgroundImage !== 'none') {
      for (const c of extractColors(cs.backgroundImage)) bump(gradients, c.hex);
      for (const g of splitTop(cs.backgroundImage)) if (g.includes('gradient(') && gradientCss.size < 60) bump(gradientCss, g.slice(0, 220));
      for (const m of cs.backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
        if (m[1].startsWith('data:image/svg+xml') && /feTurbulence/i.test(decodeURIComponent(m[1]))) effects.grainOverlays++;
        else if (bgImages.size < 80) bgImages.add(m[1].slice(0, 300));
      }
    }
    if (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none') {
      const c = parseColor(cs.borderTopColor);
      if (c) bump(borders, c.hex, rect.width);
    }
    if (el instanceof SVGElement) {
      const fill = parseColor(cs.fill);
      const stroke = cs.stroke !== 'none' ? parseColor(cs.stroke) : null;
      if (fill) bump(svgPaint, fill.hex);
      if (stroke) bump(svgPaint, stroke.hex);
    }

    const ownText = directText(el);
    const fontSize = parseFloat(cs.fontSize);
    if (ownText && opacity > 0) {
      const fg = parseColor(cs.color);
      const weight = Number(cs.fontWeight) || 400;
      if (fg) bump(text, fg.hex, ownText.length * (fontSize / 16));
      const family = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
      bump(fontsUsed, `${family}|${weight}`, ownText.length);
      const styleKey = `${Math.round(fontSize)}px|${family}|${weight}|${cs.lineHeight}|${cs.letterSpacing}|${cs.textTransform}`;
      const entry = textStyles.get(styleKey) ?? { count: 0, sample: ownText.slice(0, 48), tag: el.tagName.toLowerCase() };
      entry.count += ownText.length;
      textStyles.set(styleKey, entry);

      if (fg && contrastChecked < 2500) {
        contrastChecked++;
        const back = effectiveBg(el);
        const shown = fg.a < 1 ? blend(fg, back.color) : fg;
        const ratio = contrast(shown, back.color);
        const large = fontSize >= 24 || (fontSize >= 18.66 && weight >= 700);
        const required = large ? 3 : 4.5;
        const blended = cs.mixBlendMode !== 'normal';
        // Texts split into letters (SplitText) produce one failure per character: group them by block.
        const block = el.closest('h1, h2, h3, h4, h5, h6, p, a, button, li, label') ?? el.parentElement?.parentElement ?? el;
        const groupKey = `${shown.hex}|${back.color.hex}`;
        const seen = contrastGroups.get(groupKey) ?? new Set<Element>();
        if (ratio < required && contrastIssues.length < 40 && !seen.has(block)) {
          seen.add(block);
          contrastGroups.set(groupKey, seen);
          contrastIssues.push({
            selector: selectorOf(block),
            text: ((block as HTMLElement).innerText ?? ownText).replace(/\s+/g, ' ').trim().slice(0, 60),
            fg: shown.hex,
            bg: back.color.hex,
            ratio: Math.round(ratio * 100) / 100,
            required,
            // A color identical to the background almost always = text over video/WebGL outside the ancestor tree.
            uncertain: back.uncertain || blended || ratio < 1.05 || overMedia(el),
          });
        }
      }
    }
    if (isInteractive(el)) {
      const fg = parseColor(cs.color);
      if (fg) bump(interactive, fg.hex);
      if (bgColor) bump(interactive, bgColor.hex, 3);
    }

    for (const prop of ['paddingTop', 'paddingLeft', 'marginTop', 'marginBottom', 'rowGap', 'columnGap'] as const) {
      const v = Math.round(parseFloat(cs[prop]));
      if (v > 0 && v < 400) bump(spacing, String(v));
    }
    const radius = Math.round(parseFloat(cs.borderTopLeftRadius));
    if (radius > 0) bump(radii, radius > 500 ? 'pill' : `${radius}px`);
    if (cs.boxShadow !== 'none' && shadows.size < 20) shadows.add(cs.boxShadow.slice(0, 160));

    const s = cs as any;
    const backdrop = s.backdropFilter ?? s.webkitBackdropFilter ?? 'none';
    if (backdrop !== 'none') effects.backdropFilter++;
    if (backdrop.includes('blur(')) effects.backdropBlurs++;
    const blurPx = /blur\(([\d.]+)px\)/.exec(cs.filter);
    if (blurPx) {
      effects.blurFilters++;
      if (Number(blurPx[1]) >= 40) effects.largeBlurs++;
    }
    const m2d = /^matrix\(([^,]+),\s*([^,]+)/.exec(cs.transform);
    if (m2d) {
      const angle = Math.abs((Math.atan2(Number(m2d[2]), Number(m2d[1])) * 180) / Math.PI);
      if (angle >= 1 && angle <= 30) effects.rotated++;
    }
    if (/grab/.test(cs.cursor) || (el.getAttribute('draggable') === 'true' && el.tagName !== 'IMG')) effects.draggable++;
    if (cs.maxWidth !== 'none' && rect.width >= vw * 0.5 && /px$/.test(cs.maxWidth)) bump(maxWidths, String(Math.round(parseFloat(cs.maxWidth))));
    const durs = splitTop(cs.transitionDuration);
    if (durs.some((d) => parseFloat(d) > 0)) {
      const eases = splitTop(cs.transitionTimingFunction);
      const props = splitTop(cs.transitionProperty);
      durs.forEach((d, i) => {
        if (parseFloat(d) <= 0) return;
        bump(motionDurations, `${Math.round(d.endsWith('ms') ? parseFloat(d) : parseFloat(d) * 1000)}ms`);
        bump(motionEasings, eases[i % eases.length] ?? 'ease');
        bump(motionProps, props[i % props.length] ?? 'all');
      });
    }
    if (cs.mixBlendMode !== 'normal') effects.mixBlendMode++;
    if (cs.filter !== 'none') effects.filter++;
    if (cs.transform.startsWith('matrix3d')) effects.transform3d++;
    if (cs.perspective !== 'none') effects.perspective++;
    if (cs.clipPath !== 'none') effects.clipPath++;
    if ((s.maskImage ?? s.webkitMaskImage ?? 'none') !== 'none') effects.mask++;
    if (cs.willChange !== 'auto') effects.willChange++;
    if (cs.position === 'sticky') effects.sticky++;
    if (cs.position === 'fixed') {
      effects.fixed++;
      if (cs.pointerEvents === 'none' && rect.width < 120 && rect.height < 120 && parseFloat(cs.borderTopLeftRadius) >= rect.width / 2 - 1) {
        effects.customCursor = true;
      }
    }
    if (cs.animationName !== 'none') for (const n of cs.animationName.split(',')) animationNames.add(n.trim());
    if (cs.transitionDuration.split(',').some((d) => parseFloat(d) > 0)) effects.transitions++;
    if (cs.scrollSnapType !== 'none') effects.scrollSnap++;
    if (s.animationTimeline && !/^(auto|none)$/.test(s.animationTimeline)) effects.scrollDrivenAnimations++;
    if (s.viewTransitionName && s.viewTransitionName !== 'none') effects.viewTransitions++;
    if (cs.display.includes('grid')) effects.grid++;
    if (cs.display.includes('flex')) effects.flex++;
  }
  if (rootStyle.cursor === 'none' || bodyStyle.cursor === 'none') effects.customCursor = true;

  // ───────────────────────── palette ─────────────────────────
  const parse = (hex: string) => parseColor(hex)!;
  const bgTop = top(bg, 8);
  const textTop = top(text, 8);
  const dominantBg = bgTop[0]?.value;
  const dominantText = textTop[0]?.value;
  const accentPool = new Map<string, number>();
  for (const [hex, weight] of interactive) bump(accentPool, hex, weight * 4);
  for (const [hex, weight] of [...gradients, ...svgPaint, ...borders]) bump(accentPool, hex, Math.sqrt(weight));
  for (const [hex, weight] of bg) if (chroma(parse(hex)) > 40) bump(accentPool, hex, Math.sqrt(weight) / 10);
  for (const [hex] of text) if (chroma(parse(hex)) > 40) bump(accentPool, hex, 5);
  accentPool.delete(dominantBg ?? '');
  accentPool.delete(dominantText ?? '');
  const accentTop = top(accentPool, 6);
  const allUsed = new Set([...bg.keys(), ...text.keys(), ...borders.keys(), ...svgPaint.keys(), ...gradients.keys()]);
  const chromatic = [...allUsed].filter((hex) => chroma(parse(hex)) > 6);

  // ───────────────────────── typography ─────────────────────────
  const loadedFaces = Array.from((doc.fonts as any) ?? []).map((f: any) => ({
    family: String(f.family).replace(/["']/g, ''),
    weight: String(f.weight),
    style: String(f.style),
    status: String(f.status),
  }));
  const typeScale = [...textStyles.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 14)
    .map(([key, v]) => {
      const [size, family, weight, lineHeight, letterSpacing, transform] = key.split('|');
      return { size, family, weight, lineHeight, letterSpacing, transform, tag: v.tag, sample: v.sample };
    })
    .sort((a, b) => parseFloat(b.size) - parseFloat(a.size));

  // ───────────────────────── icons ─────────────────────────
  const has = (sel: string) => {
    try {
      return Boolean(doc.querySelector(sel));
    } catch {
      return false;
    }
  };
  const count = (sel: string) => {
    try {
      return doc.querySelectorAll(sel).length;
    } catch {
      return 0;
    }
  };
  const svgs = Array.from(doc.querySelectorAll('svg'));
  const viewBoxes = new Map<string, number>();
  for (const svg of svgs) bump(viewBoxes, svg.getAttribute('viewBox') ?? '');
  const iconLibs: string[] = [];
  const addIcon = (name: string, hit: boolean) => hit && iconLibs.push(name);
  addIcon('Lucide', has('svg.lucide, [class*="lucide-"], [data-lucide]'));
  addIcon('Phosphor', has('i.ph, [class*=" ph-"], [class^="ph-"]') || (viewBoxes.get('0 0 256 256') ?? 0) >= 3);
  addIcon('Heroicons', has('svg[data-slot="icon"]'));
  addIcon('Feather', has('svg.feather'));
  addIcon('Tabler Icons', has('svg.tabler-icon, svg.icon-tabler, i[class*="ti-"]'));
  addIcon('Font Awesome', has('svg.svg-inline--fa, i.fa, i.fas, i.far, i.fab, i[class*="fa-"]'));
  addIcon('Material Symbols/Icons', has('.material-icons, [class*="material-symbols"]'));
  addIcon('Bootstrap Icons', has('i[class*="bi-"], svg.bi'));
  addIcon('Remix Icon', has('i[class*="ri-"]'));
  addIcon('Iconify', has('iconify-icon, .iconify, [data-icon]'));
  addIcon('Ionicons', has('ion-icon'));
  addIcon('Radix Icons', (viewBoxes.get('0 0 15 15') ?? 0) >= 3);

  // ───────────────────────── media ─────────────────────────
  const inView = (r: DOMRect) => r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
  const ext = (url: string) => (/\.(avif|webp|png|jpe?g|gif|svg|mp4|webm|mov|m3u8)(\?|#|$)/i.exec(url)?.[1] ?? (url.startsWith('data:') ? 'data-uri' : '?')).toLowerCase();
  const images = Array.from(doc.images).slice(0, 150).map((img) => {
    const r = img.getBoundingClientRect();
    const src = img.currentSrc || img.src;
    return {
      src: src.slice(0, 300),
      alt: img.getAttribute('alt'),
      format: ext(src),
      natural: `${img.naturalWidth}x${img.naturalHeight}`,
      rendered: `${Math.round(r.width)}x${Math.round(r.height)}`,
      loading: img.loading || 'eager',
      inViewport: inView(r),
      oversized: r.width > 0 && img.naturalWidth > r.width * dpr * 1.6,
      missingAlt: !img.hasAttribute('alt'),
    };
  });
  const videos = Array.from(doc.querySelectorAll('video')).map((v) => ({
    src: (v.currentSrc || v.src || v.querySelector('source')?.src || '').slice(0, 300),
    poster: v.poster ? v.poster.slice(0, 300) : null,
    autoplay: v.autoplay,
    muted: v.muted,
    loop: v.loop,
    playsInline: v.playsInline,
    size: `${v.videoWidth}x${v.videoHeight}`,
    duration: Number.isFinite(v.duration) ? Math.round(v.duration * 10) / 10 : null,
  }));
  const canvases = Array.from(doc.querySelectorAll('canvas')).map((c) => {
    const r = c.getBoundingClientRect();
    const cs = getComputedStyle(c);
    return {
      selector: selectorOf(c),
      size: `${c.width}x${c.height}`,
      css: `${Math.round(r.width)}x${Math.round(r.height)}`,
      context: hooks?.canvasContext?.get(c) ?? 'unknown',
      fixed: cs.position === 'fixed',
      fullscreen: r.width >= vw * 0.9 && r.height >= vh * 0.9,
    };
  });
  const customElements = new Map<string, number>();
  for (const el of all) if (el.tagName.includes('-')) bump(customElements, el.tagName.toLowerCase());

  // ───────────────────────── stack ─────────────────────────
  const sample = all.slice(0, 600);
  const keysStartWith = (prefix: string) => sample.some((el) => Object.keys(el).some((k) => k.startsWith(prefix)));
  const attrPrefix = (prefix: string) => sample.some((el) => Array.from(el.attributes).some((a) => a.name.startsWith(prefix)));
  const classMatches = (re: RegExp) => sample.filter((el) => re.test(typeof el.className === 'string' ? el.className : '')).length;
  const shaderText = (hooks?.shaders ?? []).map((s: any) => s.source).join('\n');
  const varNames = [...varSources.keys()];
  const stack: { name: string; version?: string; category: string }[] = [];
  const add = (name: string, category: string, hit: unknown, version?: unknown) => {
    if (hit) stack.push({ name, category, version: version ? String(version) : undefined });
  };
  add('Next.js', 'framework', w.__NEXT_DATA__ || w.next || has('#__next') || has('script[src*="/_next/"]'), w.next?.version);
  add('Nuxt', 'framework', w.__NUXT__ || w.$nuxt || has('#__nuxt'));
  add('React', 'framework', w.React || has('[data-reactroot]') || keysStartWith('__react'), w.React?.version);
  add('Vue', 'framework', w.Vue || w.__VUE__ || has('[data-v-app]') || attrPrefix('data-v-'), w.Vue?.version);
  add('Svelte', 'framework', classMatches(/\bsvelte-[a-z0-9]{4,}\b/) > 0 || Object.keys(w).some((k) => k.startsWith('__sveltekit')));
  add('Astro', 'framework', has('astro-island') || attrPrefix('data-astro-cid'));
  add('Angular', 'framework', has('[ng-version]') || w.ng, doc.querySelector('[ng-version]')?.getAttribute('ng-version'));
  add('Solid', 'framework', w._$HY);
  add('Gatsby', 'framework', has('#___gatsby'));
  add('Remix / React Router', 'framework', w.__remixContext || w.__reactRouterContext);
  add('Webflow', 'platform', root.hasAttribute('data-wf-site') || w.Webflow);
  add('Framer', 'platform', has('[data-framer-name], #__framer-badge-container') || w.__framer_importFromPackage);
  add('Wix', 'platform', w.wixBiSession);
  add('Shopify', 'platform', w.Shopify);
  add('WordPress', 'platform', has('link[href*="wp-content"], script[src*="wp-includes"]'));
  add('Squarespace', 'platform', w.Static?.SQUARESPACE_CONTEXT);
  add('GSAP', 'animation', w.gsap || w.gsapVersions || w.TweenMax, w.gsapVersions?.[0] ?? w.gsap?.version);
  add('ScrollTrigger', 'animation', w.ScrollTrigger || has('.pin-spacer'));
  add('Lenis', 'scroll', w.lenisVersion || w.lenis || root.classList.contains('lenis'), w.lenisVersion);
  add('Locomotive Scroll', 'scroll', w.LocomotiveScroll || has('[data-scroll-container]') || root.classList.contains('has-scroll-smooth'));
  add('Three.js', '3d/webgl', w.__THREE__ || w.THREE || /#define SHADER_(NAME|TYPE)/.test(shaderText), w.__THREE__);
  add('PixiJS', '3d/webgl', w.PIXI || w.__PIXI_APP__);
  add('Babylon.js', '3d/webgl', w.BABYLON);
  add('p5.js', 'canvas', w.p5);
  add('Matter.js', 'physics', w.Matter);
  add('Lottie', 'animation', w.lottie || w.bodymovin || has('lottie-player, dotlottie-player, dotlottie-wc'));
  add('Rive', 'animation', w.rive);
  add('Spline', '3d/webgl', has('spline-viewer'));
  add('model-viewer', '3d/webgl', has('model-viewer'));
  add('Barba.js', 'transitions', w.barba || has('[data-barba]'));
  add('Swup', 'transitions', w.swup || has('#swup'));
  add('Swiper', 'ui', w.Swiper || has('.swiper-initialized'));
  add('Splitting.js', 'typography', w.Splitting || has('.splitting'));
  add('Anime.js', 'animation', w.anime);
  add('Web Animations API (Motion/Framer Motion)', 'animation', (hooks?.waapi ?? 0) > 3);
  add('Alpine.js', 'framework', w.Alpine || has('[x-data]'));
  add('htmx', 'framework', w.htmx);
  add('jQuery', 'library', w.jQuery, w.jQuery?.fn?.jquery);
  add('Tailwind CSS', 'css', varNames.some((n) => n.startsWith('--tw-')) || classMatches(/(^|\s)(px-\d|py-\d|text-(xs|sm|lg|xl)|items-center|justify-between|bg-[a-z]+-\d{2,3})(\s|$)/) > 15);
  add('Bootstrap', 'css', varNames.some((n) => n.startsWith('--bs-')) || w.bootstrap);
  add('styled-components', 'css', has('style[data-styled]'));
  add('Emotion', 'css', has('style[data-emotion]'));
  add('CSS Modules', 'css', classMatches(/\b[\w-]+_[\w-]+__[A-Za-z0-9_-]{5}\b|\b[A-Za-z]+-module__[\w-]+/) > 5);

  // ───────────────────────── architecture ─────────────────────────
  const meta = (name: string) =>
    doc.querySelector(`meta[name="${name}"], meta[property="${name}"]`)?.getAttribute('content')?.slice(0, 300) ?? null;
  const scripts = Array.from(doc.scripts);
  const animatedNow = typeof doc.getAnimations === 'function' ? doc.getAnimations() : [];
  const elapsed = Math.max(1, (Date.now() - (hooks?.startedAt ?? Date.now())) / 1000);

  return {
    page: {
      url: location.href,
      title: doc.title,
      lang: root.lang || null,
      viewport: { width: vw, height: vh, dpr },
      document: { width: root.scrollWidth, height: root.scrollHeight },
      domNodes: doc.getElementsByTagName('*').length,
      scannedElements: elements.length,
      truncated: all.length > opts.maxElements,
      headings: Array.from(doc.querySelectorAll('h1, h2, h3'))
        .slice(0, 25)
        .map((h) => ({ tag: h.tagName.toLowerCase(), text: (h.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 90) })),
    },
    meta: {
      description: meta('description'),
      generator: meta('generator'),
      themeColor: meta('theme-color'),
      viewport: meta('viewport'),
      ogTitle: meta('og:title'),
      ogImage: meta('og:image'),
      twitterCard: meta('twitter:card'),
      canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
      jsonLd: count('script[type="application/ld+json"]'),
    },
    stack,
    colors: {
      background: bgTop,
      text: textTop,
      accent: accentTop,
      borders: top(borders, 5),
      svg: top(svgPaint, 5),
      gradients: top(gradients, 6),
      interactive: top(interactive, 6),
      cssVariables: colorVars.slice(0, 200),
      cssVariablesTotal: varSources.size,
      otherVariables: otherVars,
      isMonochrome: chromatic.length === 0,
      chromaticColors: chromatic.slice(0, 20),
    },
    contrast: { checked: contrastChecked, failures: contrastIssues.length, issues: contrastIssues },
    typography: {
      used: top(fontsUsed, 24).map((f) => ({ family: f.value.split('|')[0], weight: f.value.split('|')[1], share: f.share })),
      scale: typeScale,
      fontFaces,
      loadedFaces: loadedFaces.slice(0, 60),
      loadedByHook: hooks?.fontsLoaded ?? [],
    },
    icons: {
      libraries: iconLibs,
      inlineSvg: svgs.length,
      spriteUses: count('use'),
      topViewBoxes: top(viewBoxes, 4),
    },
    media: {
      images,
      imageFormats: images.reduce<Record<string, number>>((acc, i) => ((acc[i.format] = (acc[i.format] ?? 0) + 1), acc), {}),
      imagesMissingAlt: images.filter((i) => i.missingAlt).length,
      imagesOversized: images.filter((i) => i.oversized).length,
      backgroundImages: [...bgImages],
      videos,
      canvases,
      webglContexts: hooks?.contexts ?? null,
      shaders: (hooks?.shaders ?? []).map((s: any) => ({ type: s.type, length: s.length, hash: s.hash, source: s.source })),
      iframes: Array.from(doc.querySelectorAll('iframe')).map((f) => f.src.slice(0, 200)).slice(0, 20),
      customElements: top(customElements, 20).map((c) => c.value),
    },
    effects: {
      ...effects,
      cssAnimations: [...animationNames].slice(0, 40),
      keyframes: [...keyframes].slice(0, 60),
      runningAnimations: animatedNow.length,
      waapiCalls: hooks?.waapi ?? 0,
      rafPerSecond: Math.round((hooks?.raf ?? 0) / elapsed),
      shadows: [...shadows],
    },
    gradients: [...gradientCss.entries()]
      .sort((x, y) => y[1] - x[1])
      .slice(0, 20)
      .map(([value, count]) => ({ value, count, type: /^(repeating-)?(linear|radial|conic)-gradient/.exec(value)?.[0] ?? 'gradient' })),
    motion: { durations: top(motionDurations, 8), easings: top(motionEasings, 8), properties: top(motionProps, 10) },
    layout: {
      spacingScale: top(spacing, 14),
      spacingOn4pxGrid: (() => {
        let on = 0;
        let total = 0;
        for (const [v, n] of spacing) {
          total += n;
          if (Number(v) % 4 === 0) on += n;
        }
        return total ? Math.round((on / total) * 100) : null;
      })(),
      radii: top(radii, 8),
      maxContentWidth: maxWidths.size ? Number([...maxWidths.entries()].sort((a, b) => b[1] - a[1])[0][0]) : null,
    },
    architecture: {
      scripts: scripts.filter((s) => s.src).slice(0, 60).map((s) => ({ src: s.src.slice(0, 240), type: s.type || 'classic', async: s.async, defer: s.defer })),
      inlineScripts: scripts.filter((s) => !s.src).length,
      inlineScriptBytes: scripts.filter((s) => !s.src).reduce((n, s) => n + s.text.length, 0),
      stylesheets: Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).map((l) => l.href.slice(0, 240)),
      inlineStyles: count('style'),
      crossOriginSheets,
      cssRules: ruleCount,
      preconnect: Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="preconnect"], link[rel="dns-prefetch"]')).map((l) => l.href),
      preload: Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="preload"], link[rel="modulepreload"]')).map((l) => `${l.as || 'module'}: ${l.href.slice(0, 200)}`),
      serviceWorker: Boolean(navigator.serviceWorker?.controller),
      manifest: has('link[rel="manifest"]'),
    },
  };
}

export type ScanResult = ReturnType<typeof scanPage>;

/** Lists visible interactive elements with stable selectors (for the QA loop). */
export function inventoryPage(limit: number) {
  const doc = document;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const safeIdent = (s: string) => /^[A-Za-z_][\w-]*$/.test(s);
  const unique = (sel: string) => {
    try {
      return doc.querySelectorAll(sel).length === 1;
    } catch {
      return false;
    }
  };
  const selectorOf = (el: Element): string => {
    if (el.id && safeIdent(el.id) && unique(`#${el.id}`)) return `#${el.id}`;
    const parts: string[] = [];
    let node: Element | null = el;
    while (node && node !== doc.body && node !== doc.documentElement && parts.length < 6) {
      if (node.id && safeIdent(node.id)) {
        parts.unshift(`#${node.id}`);
        break;
      }
      let part = node.tagName.toLowerCase();
      const classes = Array.from(node.classList).filter((c) => safeIdent(c) && c.length < 30).slice(0, 2);
      if (classes.length) part += `.${classes.join('.')}`;
      const parent: Element | null = node.parentElement;
      if (parent) {
        const tag = node.tagName;
        const siblings = Array.from(parent.children).filter((c) => c.tagName === tag);
        if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
      }
      parts.unshift(part);
      if (unique(parts.join(' > '))) return parts.join(' > ');
      node = parent;
    }
    return parts.join(' > ') || el.tagName.toLowerCase();
  };
  const candidates = new Set<Element>(
    doc.querySelectorAll('a[href], button, [role="button"], [role="link"], [role="tab"], [role="menuitem"], input, select, textarea, summary, [tabindex]:not([tabindex="-1"]), [onclick]'),
  );
  for (const el of Array.from(doc.querySelectorAll('body *')).slice(0, 5000)) {
    if (candidates.size > limit * 3) break;
    if (getComputedStyle(el).cursor === 'pointer' && !el.closest('a, button')) candidates.add(el);
  }
  const items = [];
  for (const el of candidates) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (cs.display === 'none' || cs.visibility === 'hidden' || r.width < 2 || r.height < 2) continue;
    const label = (el.getAttribute('aria-label') || (el as HTMLElement).innerText || (el as HTMLInputElement).value || el.getAttribute('title') || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 60);
    items.push({
      selector: selectorOf(el),
      tag: el.tagName.toLowerCase(),
      role: el.getAttribute('role'),
      label,
      href: el.getAttribute('href'),
      disabled: (el as HTMLButtonElement).disabled === true || el.getAttribute('aria-disabled') === 'true',
      inViewport: r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw,
      box: { x: Math.round(r.x), y: Math.round(r.y + window.scrollY), width: Math.round(r.width), height: Math.round(r.height) },
    });
    if (items.length >= limit) break;
  }
  return { total: candidates.size, items };
}

/** Detects full-screen overlays (preloaders, splash screens, cookie walls) blocking the page. */
export function detectOverlay() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const points: [number, number][] = [[vw / 2, vh / 2], [vw * 0.1, vh * 0.1], [vw * 0.9, vh * 0.9]];
  const hits = new Map<Element, number>();
  for (const [x, y] of points) {
    let el = document.elementFromPoint(x, y);
    while (el && el !== document.body && el !== document.documentElement && el.tagName !== 'CANVAS') {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if ((cs.position === 'fixed' || cs.position === 'absolute') && r.width >= vw * 0.9 && r.height >= vh * 0.9 && parseFloat(cs.opacity) > 0.05) {
        hits.set(el, (hits.get(el) ?? 0) + 1);
        break;
      }
      el = el.parentElement;
    }
  }
  for (const [el, n] of hits) {
    if (n < 2) continue;
    const label = `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}` : ''}`;
    const looksLikeLoader = /load|preload|intro|splash|curtain|overlay|cookie|consent|gate/i.test(`${el.id} ${el.className}`);
    return { selector: label, looksLikeLoader, text: ((el as HTMLElement).innerText ?? '').trim().slice(0, 80) };
  }
  return null;
}
