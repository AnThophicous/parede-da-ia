import { classifyAesthetic } from '../../domain/aesthetic.js';
import type { PerfSnapshot, ScrapReport } from '../../domain/reports.js';
import { scanPage } from './inject/scanner.js';
import type { BrowserManager, NetworkEntry } from './manager.js';

const FONT_EXT = /\.(woff2?|ttf|otf|eot)(\?|#|$)/i;
const ASSET_3D = /\.(glb|gltf|obj|fbx|usdz|hdr|exr|ktx2|basis|splinecode|riv|drc)(\?|#|$)/i;

/** Detection by script/asset URL — complements the detection by DOM globals. */
const URL_SIGNATURES: [RegExp, string, string][] = [
  [/gsap|TweenMax/i, 'GSAP', 'animation'],
  [/ScrollTrigger/i, 'ScrollTrigger', 'animation'],
  [/\/three(@[\d.]+)?\/|three(\.module)?(\.min)?\.js/i, 'Three.js', '3d/webgl'],
  [/lenis/i, 'Lenis', 'scroll'],
  [/locomotive/i, 'Locomotive Scroll', 'scroll'],
  [/barba/i, 'Barba.js', 'transitions'],
  [/swiper/i, 'Swiper', 'ui'],
  [/lottie|dotlottie/i, 'Lottie', 'animation'],
  [/pixi/i, 'PixiJS', '3d/webgl'],
  [/babylon/i, 'Babylon.js', '3d/webgl'],
  [/@splinetool|spline\.design/i, 'Spline', '3d/webgl'],
  [/@rive-app|\.riv(\?|$)/i, 'Rive', 'animation'],
  [/\/_next\//, 'Next.js', 'framework'],
  [/\/_nuxt\//, 'Nuxt', 'framework'],
  [/\/_astro\//, 'Astro', 'framework'],
  [/webflow/i, 'Webflow', 'platform'],
  [/framerusercontent\.com|framer\.com\/m\//i, 'Framer', 'platform'],
  [/cdn\.shopify\.com/i, 'Shopify', 'platform'],
  [/wp-content|wp-includes/i, 'WordPress', 'platform'],
  [/jquery/i, 'jQuery', 'library'],
  [/googletagmanager\.com/i, 'Google Tag Manager', 'analytics'],
  [/google-analytics\.com|gtag\/js/i, 'Google Analytics', 'analytics'],
  [/plausible\.io/i, 'Plausible', 'analytics'],
  [/clarity\.ms/i, 'Microsoft Clarity', 'analytics'],
  [/hotjar/i, 'Hotjar', 'analytics'],
  [/posthog/i, 'PostHog', 'analytics'],
  [/_vercel\/insights|vercel-insights/i, 'Vercel Analytics', 'analytics'],
  [/sentry/i, 'Sentry', 'monitoring'],
];

function fontProvider(url: string, pageHost: string): string {
  let host = '';
  try {
    host = new URL(url).hostname;
  } catch {
    return 'unknown';
  }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(host)) return 'Google Fonts';
  if (/typekit\.net$/.test(host)) return 'Adobe Fonts';
  if (/fonts\.bunny\.net$/.test(host)) return 'Bunny Fonts';
  if (/fontshare\.com$/.test(host)) return 'Fontshare';
  if (/fonts\.net$/.test(host)) return 'Fonts.com';
  if (/typography\.com$/.test(host)) return 'Cloud.typography';
  if (host === pageHost) return 'Self-hosted';
  return `CDN (${host})`;
}

function hostingFromHeaders(h: Record<string, string>): string[] {
  const out: string[] = [];
  const add = (name: string, hit: unknown) => hit && !out.includes(name) && out.push(name);
  add('Vercel', h['x-vercel-id'] || /vercel/i.test(h.server ?? ''));
  add('Netlify', h['x-nf-request-id'] || /netlify/i.test(h.server ?? ''));
  add('Cloudflare', h['cf-ray']);
  add('GitHub Pages', h['x-github-request-id']);
  add('AWS CloudFront', h['x-amz-cf-id']);
  add('Fastly', /cache-/.test(h['x-served-by'] ?? ''));
  add('Fly.io', h['fly-request-id']);
  add('Render', h['x-render-origin-server']);
  add('Shopify', h['x-shopify-stage']);
  add('Wix', h['x-wix-request-id']);
  add('Framer', /framer/i.test(h.server ?? ''));
  if (h['x-powered-by']) out.push(`x-powered-by: ${h['x-powered-by']}`);
  if (h.server && !out.length) out.push(`server: ${h.server}`);
  return out;
}

function summarizeNetwork(entries: NetworkEntry[], pageHost: string) {
  const byType: Record<string, { count: number; bytes: number }> = {};
  const domains = new Map<string, number>();
  let totalBytes = 0;
  for (const e of entries) {
    const bucket = (byType[e.type] ??= { count: 0, bytes: 0 });
    bucket.count++;
    bucket.bytes += e.bytes ?? 0;
    totalBytes += e.bytes ?? 0;
    try {
      const host = new URL(e.url).hostname;
      if (host) domains.set(host, (domains.get(host) ?? 0) + 1);
    } catch {
      /* data: / blob: */
    }
  }
  return {
    requests: entries.length,
    totalBytes,
    byType,
    domains: [...domains.entries()].sort((a, b) => b[1] - a[1]).map(([host, count]) => ({ host, count, thirdParty: host !== pageHost })),
    failed: entries.filter((e) => e.failure || (e.status ?? 0) >= 400).slice(0, 40),
    largest: [...entries].filter((e) => e.bytes).sort((a, b) => (b.bytes ?? 0) - (a.bytes ?? 0)).slice(0, 12),
    assets3d: entries.filter((e) => ASSET_3D.test(e.url)).map((e) => e.url),
    wasm: entries.filter((e) => /\.wasm(\?|$)/i.test(e.url) || e.mime === 'application/wasm').map((e) => e.url),
    resources: entries.slice(0, 800),
  };
}

function parseExternalCss(bodies: Map<string, string>) {
  const varNames = new Set<string>();
  const fontFaces: { family: string; weight: string; style: string; urls: string[]; sheet: string }[] = [];
  for (const [sheet, css] of bodies) {
    for (const m of css.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)) {
      if (varNames.size < 1500) varNames.add(m[1]);
    }
    for (const m of css.matchAll(/@font-face\s*{([^}]*)}/g)) {
      const block = m[1];
      const family = /font-family\s*:\s*([^;]+)/i.exec(block)?.[1].replace(/["']/g, '').trim();
      if (!family || fontFaces.length > 200) continue;
      fontFaces.push({
        family,
        weight: /font-weight\s*:\s*([^;]+)/i.exec(block)?.[1].trim() ?? '400',
        style: /font-style\s*:\s*([^;]+)/i.exec(block)?.[1].trim() ?? 'normal',
        urls: [...block.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((u) => {
          try {
            return new URL(u[1], sheet).href;
          } catch {
            return u[1];
          }
        }),
        sheet,
      });
    }
  }
  return { varNames: [...varNames], fontFaces };
}

/** Web Vitals collected by the hooks (CLS, LCP, long tasks). */
export async function perfSnapshot(m: BrowserManager): Promise<PerfSnapshot> {
  const empty: PerfSnapshot = { cls: null, lcpMs: null, lcpElement: null, longTasks: 0, longTaskMs: 0 };
  const perf = await m
    .requirePage()
    .evaluate(() => (window as unknown as { __PAREDE__?: { perf: PerfSnapshot } }).__PAREDE__?.perf ?? null)
    .catch(() => null);
  return perf ? { ...empty, ...perf } : empty;
}

export async function scrap(m: BrowserManager, maxElements: number): Promise<ScrapReport> {
  const page = m.requirePage();
  const pageUrl = page.url();
  const pageHost = (() => {
    try {
      return new URL(pageUrl).hostname;
    } catch {
      return '';
    }
  })();

  const external = parseExternalCss(m.cssBodies);
  const dom = await page.evaluate(scanPage, { maxElements, extraVarNames: external.varNames });
  const network = summarizeNetwork(m.network, pageHost);

  // Stack: merges DOM/globals detection with URL signatures in the network.
  const stack = [...dom.stack.map((s) => ({ ...s, source: 'dom' }))];
  for (const e of m.network) {
    if (e.type !== 'script' && e.type !== 'fetch' && e.type !== 'other' && !ASSET_3D.test(e.url)) continue;
    for (const [re, name, category] of URL_SIGNATURES) {
      if (re.test(e.url) && !stack.some((s) => s.name === name)) stack.push({ name, category, version: undefined, source: 'network' });
    }
  }

  // Fonts: declared families (internal + external @font-face), downloaded files and providers.
  const fontFiles = m.network
    .filter((e) => e.type === 'font' || FONT_EXT.test(e.url))
    .map((e) => ({ url: e.url, format: FONT_EXT.exec(e.url)?.[1]?.toLowerCase() ?? e.mime ?? '?', bytes: e.bytes, provider: fontProvider(e.url, pageHost) }));
  const providers = new Set(fontFiles.map((f) => f.provider));
  for (const e of m.network) if (/fonts\.googleapis\.com|typekit\.net\/.*\.css|fonts\.bunny\.net\/css|fontshare\.com\/v2\/css/.test(e.url)) providers.add(fontProvider(e.url, pageHost));
  const googleFamilies = m.network
    .filter((e) => /fonts\.googleapis\.com\/css/.test(e.url))
    .flatMap((e) => {
      try {
        return new URL(e.url).searchParams.getAll('family').flatMap((f) => f.split('|')).map((f) => f.split(':')[0].replace(/\+/g, ' '));
      } catch {
        return [];
      }
    });
  const families = new Map<string, { weights: Set<string>; styles: Set<string>; sources: Set<string> }>();
  const touch = (family: string) => {
    const key = family.trim();
    if (!families.has(key)) families.set(key, { weights: new Set(), styles: new Set(), sources: new Set() });
    return families.get(key)!;
  };
  for (const f of dom.typography.fontFaces) {
    const entry = touch(f.family);
    entry.weights.add(f.weight);
    entry.styles.add(f.style);
    const url = /url\(["']?([^"')]+)/.exec(f.src)?.[1];
    if (url) {
      try {
        entry.sources.add(fontProvider(new URL(url, pageUrl).href, pageHost));
      } catch {
        /* ignore */
      }
    } else if (/local\(/.test(f.src)) entry.sources.add('local()');
  }
  for (const f of external.fontFaces) {
    const entry = touch(f.family);
    entry.weights.add(f.weight);
    entry.styles.add(f.style);
    for (const u of f.urls.slice(0, 1)) entry.sources.add(fontProvider(u, pageHost));
  }
  for (const family of googleFamilies) touch(family).sources.add('Google Fonts');

  // Usage comes per family+weight: sum the weights to get the family's share.
  const usedShare = new Map<string, number>();
  for (const u of dom.typography.used) usedShare.set(u.family, Math.round(((usedShare.get(u.family) ?? 0) + u.share) * 10) / 10);
  const fonts = {
    providers: [...providers],
    families: [...families.entries()].map(([family, v]) => ({
      family,
      weights: [...v.weights].sort(),
      styles: [...v.styles],
      sources: [...v.sources],
      usedShare: usedShare.get(family) ?? 0,
    })),
    files: fontFiles.slice(0, 60),
    used: dom.typography.used,
    scale: dom.typography.scale,
  };

  const consoleEntries = await m.consoleEntries();
  const report: Omit<ScrapReport, 'aesthetic'> = {
    tool: 'parede-da-ia/web-scrap',
    generatedAt: new Date().toISOString(),
    page: dom.page,
    meta: dom.meta,
    hosting: hostingFromHeaders(m.documentHeaders),
    stack,
    colors: dom.colors,
    contrast: dom.contrast,
    fonts,
    icons: dom.icons,
    media: dom.media,
    effects: dom.effects,
    gradients: dom.gradients,
    motion: dom.motion,
    layout: dom.layout,
    architecture: dom.architecture,
    network,
    perf: await perfSnapshot(m),
    console: {
      errors: consoleEntries.filter((c) => c.type === 'error' || c.type === 'pageerror').slice(-30),
      warnings: consoleEntries.filter((c) => c.type === 'warning').length,
    },
  };
  return { ...report, aesthetic: classifyAesthetic(report as ScrapReport) };
}
