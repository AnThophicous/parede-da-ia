/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * QA checks that run INSIDE the page for one viewport. Self-contained.
 * Returns raw findings; severity and scoring are decided in the domain.
 */
export interface AuditChecksInput {
  mobile: boolean;
  tapMin: number;
  tapComfort: number;
  mobileTextMin: number;
}

export function auditChecks(o: AuditChecksInput) {
  const doc = document;
  const vw = window.innerWidth;
  const label = (e: Element): string => {
    const cls = typeof e.className === 'string' ? e.className.trim().split(' ').filter(Boolean).slice(0, 2) : [];
    return `${e.tagName.toLowerCase()}${e.id ? `#${e.id}` : ''}${cls.length ? `.${cls.join('.')}` : ''}`;
  };
  const visible = (e: Element) => {
    const cs = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0 && r.width > 0 && r.height > 0;
  };
  const accessibleName = (e: Element) =>
    (e.getAttribute('aria-label') || e.getAttribute('title') || (e as HTMLElement).innerText || e.querySelector('img[alt]')?.getAttribute('alt') || e.querySelector('svg title')?.textContent || '').trim();
  const clippedByAncestor = (e: Element) => {
    for (let p = e.parentElement; p && p !== doc.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (/(hidden|clip|auto|scroll)/.test(cs.overflowX)) return true;
    }
    return false;
  };

  // ── responsive: horizontal overflow ──
  const overflowX = Math.max(0, doc.documentElement.scrollWidth - vw);
  const offenders: { selector: string; by: number }[] = [];
  if (overflowX > 1) {
    for (const el of Array.from(doc.querySelectorAll('body *')).slice(0, 5000)) {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 && r.width > 0 && r.width < 6000 && !clippedByAncestor(el)) offenders.push({ selector: label(el), by: Math.round(r.right - vw) });
    }
    offenders.sort((a, b) => b.by - a.by);
  }

  // ── touch targets and small text (mobile) ──
  const interactive = Array.from(doc.querySelectorAll('a[href], button, [role="button"], input:not([type="hidden"]), select, textarea, summary')).filter(visible);
  const tooSmall: string[] = [];
  const uncomfortable: string[] = [];
  if (o.mobile) {
    for (const el of interactive) {
      const r = el.getBoundingClientRect();
      const inlineLink = el.tagName === 'A' && getComputedStyle(el).display === 'inline' && (el.parentElement?.innerText.length ?? 0) > (el as HTMLElement).innerText.length + 20;
      if (inlineLink) continue;
      // An error only when both dimensions fall below the minimum (WCAG 2.5.8 accepts compensating spacing).
      if (r.width < o.tapMin && r.height < o.tapMin) tooSmall.push(`${label(el)} (${Math.round(r.width)}×${Math.round(r.height)})`);
      else if (r.width < o.tapComfort || r.height < o.tapComfort) uncomfortable.push(`${label(el)} (${Math.round(r.width)}×${Math.round(r.height)})`);
    }
  }
  const smallText: string[] = [];
  if (o.mobile) {
    for (const el of Array.from(doc.querySelectorAll('body *')).slice(0, 4000)) {
      const own = Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent ?? '').trim().length > 3);
      if (!own || !visible(el)) continue;
      let size = parseFloat(getComputedStyle(el).fontSize);
      // Text in SVG: font-size is in viewBox units; the real size is × the on-screen scale.
      if (el instanceof SVGGraphicsElement) {
        const m = el.getScreenCTM();
        if (m) size = Math.round(size * Math.hypot(m.a, m.b) * 10) / 10;
      }
      if (size < o.mobileTextMin) smallText.push(`${label(el)} (${size}px)`);
    }
  }

  // ── content and semantics ──
  const imgs = Array.from(doc.images).filter(visible);
  const missingAlt = imgs.filter((i) => !i.hasAttribute('alt') && i.getAttribute('role') !== 'presentation' && i.getAttribute('aria-hidden') !== 'true').map(label);
  const noDimensions = imgs.filter((i) => !(i.getAttribute('width') && i.getAttribute('height')) && getComputedStyle(i).aspectRatio === 'auto').map(label);
  const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6')).filter(visible);
  const h1 = headings.filter((h) => h.tagName === 'H1').length;
  const skipped: string[] = [];
  let prev = 0;
  for (const h of headings) {
    const level = Number(h.tagName[1]);
    if (prev && level > prev + 1) skipped.push(`h${prev}→h${level} at ${label(h)}`);
    prev = level;
  }
  const unnamedButtons = Array.from(doc.querySelectorAll('button, [role="button"]')).filter(visible).filter((b) => !accessibleName(b)).map(label);
  const unnamedLinks = Array.from(doc.querySelectorAll('a[href]')).filter(visible).filter((a) => !accessibleName(a)).map(label);
  const fakeLinks = Array.from(doc.querySelectorAll('a')).filter(visible).filter((a) => !a.getAttribute('href') || a.getAttribute('href') === '#').map(label);
  const unsafeBlank = Array.from(doc.querySelectorAll('a[target="_blank"]')).filter((a) => !/noopener|noreferrer/.test(a.getAttribute('rel') ?? '')).map(label);
  const unlabeledInputs = Array.from(doc.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea'))
    .filter(visible)
    .filter((i) => {
      const id = i.getAttribute('id');
      return !(i.getAttribute('aria-label') || i.getAttribute('aria-labelledby') || i.closest('label') || (id && doc.querySelector(`label[for="${CSS.escape(id)}"]`)));
    })
    .map(label);

  const meta = (name: string) => doc.querySelector(`meta[name="${name}"], meta[property="${name}"]`)?.getAttribute('content') ?? null;

  return {
    overflowX,
    offenders: offenders.slice(0, 8),
    tooSmall: tooSmall.slice(0, 15),
    uncomfortable: uncomfortable.slice(0, 15),
    smallText: smallText.slice(0, 15),
    missingAlt: missingAlt.slice(0, 15),
    noDimensions: noDimensions.slice(0, 15),
    h1,
    skipped: skipped.slice(0, 8),
    unnamedButtons: unnamedButtons.slice(0, 10),
    unnamedLinks: unnamedLinks.slice(0, 10),
    fakeLinks: fakeLinks.slice(0, 10),
    unsafeBlank: unsafeBlank.slice(0, 10),
    unlabeledInputs: unlabeledInputs.slice(0, 10),
    lang: doc.documentElement.lang || null,
    title: doc.title || null,
    description: meta('description'),
    viewportMeta: meta('viewport'),
    ogImage: meta('og:image'),
    canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
    interactiveCount: interactive.length,
  };
}

/** Reads the focused element and the focus "visual weight" to compare before/after the blur. */
export function focusProbe() {
  const el = document.activeElement as HTMLElement | null;
  if (!el || el === document.body) return null;
  const cs = getComputedStyle(el);
  const cls = typeof el.className === 'string' ? el.className.trim().split(' ').filter(Boolean).slice(0, 2) : [];
  // A temporary mark to find exactly this element again after the blur.
  document.querySelectorAll('[data-parede-focus]').forEach((n) => n.removeAttribute('data-parede-focus'));
  el.setAttribute('data-parede-focus', '');
  return {
    selector: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls.length ? `.${cls.join('.')}` : ''}`,
    styles: [cs.outlineStyle, cs.outlineWidth, cs.outlineColor, cs.boxShadow, cs.borderTopColor, cs.backgroundColor, cs.color, cs.textDecorationLine, cs.transform].join('|'),
  };
}
