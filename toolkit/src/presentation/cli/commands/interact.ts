import { ACTION_HELP, parseAction, parseSequence, type Action } from '../../../domain/actions.js';
import { ParedeError } from '../../../domain/errors.js';
import { stamp } from '../../../domain/naming.js';
import { formatBytes, parseDuration, parseNumber, parseViewport, type Viewport } from '../../../domain/units.js';
import { kv, next, ok, parse, requireSession, warn, type Command } from './shared.js';

interface ShotResult {
  path: string;
  bytes: number;
  pixels: { width: number; height: number } | null;
  dpr: number;
  viewport: { width: number; height: number };
  fullPage: boolean;
  document: { width: number; height: number };
  warnings: string[];
}

interface ControlResult {
  results: { action: string; result: Record<string, unknown> }[];
  state: { url: string; scrollY: number; scrollHeight: number; innerHeight: number; activeElement: string | null; pages: number };
  consoleErrors: { text: string }[];
}

/** Named viewports for responsiveness tests in a single command. */
export const VIEWPORT_PRESETS: Record<string, Viewport> = {
  desktop: { width: 1440, height: 900 },
  laptop: { width: 1280, height: 800 },
  tablet: { width: 834, height: 1194 },
  'tablet-h': { width: 1194, height: 834 },
  mobile: { width: 390, height: 844 },
  'mobile-s': { width: 360, height: 740 },
  wide: { width: 1920, height: 1080 },
};

export function parseViewportList(value: string): { name: string; viewport: Viewport }[] {
  return value.split(',').map((raw) => {
    const name = raw.trim();
    const preset = VIEWPORT_PRESETS[name];
    if (preset) return { name, viewport: preset };
    const viewport = parseViewport(name);
    return { name: `${viewport.width}x${viewport.height}`, viewport };
  });
}

export const control: Command = {
  name: 'web-control',
  group: 'browser',
  summary: 'Real events: scroll, click, hover, mousemove, keypress, drag (chainable).',
  usage: `web-control <action> [parameters] [--screenshot]

${ACTION_HELP}

  --screenshot     captures the viewport after the action (e.g. to check a hover state)

Examples:
  web-control scroll-down 1200 --steps 24 --interval 50ms
  web-control hover "a.cta" --hold 600ms --screenshot
  web-control drag ".card" 400,300 --steps 30
  web-control sequence "scroll-to #pricing; wait 0.5; click 'button.buy'"
  web-record-frames --while "scroll-down 4000 --steps 80"     # actions during the recording`,
  async execute(argv, ctx) {
    requireSession(ctx);
    const withShot = argv.includes('--screenshot');
    const tokens = argv.filter((a) => a !== '--screenshot');
    if (!tokens.length) throw new ParedeError('BAD_ARG', 'Provide an action.', this.usage);

    let actions: Action[];
    if (tokens[0] === 'sequence') {
      if (!tokens[1]) throw new ParedeError('BAD_ARG', 'sequence needs a string "action; action; ...".', this.usage);
      actions = parseSequence(tokens.slice(1).join(' '));
    } else {
      actions = [parseAction(tokens)];
    }

    const r = await ctx.session.call<ControlResult>('control', { actions });
    const lines: string[] = [];
    for (const { action, result } of r.results) {
      if (action === 'inventory') {
        const inv = result as unknown as { total: number; items: { selector: string; tag: string; label: string; inViewport: boolean; disabled: boolean }[] };
        lines.push(ok(`inventory: ${inv.items.length} of ${inv.total} interactive elements`));
        for (const item of inv.items) {
          lines.push(`  ${item.inViewport ? '◉' : '○'} ${item.selector}  ${item.tag}${item.label ? ` "${item.label}"` : ''}${item.disabled ? ' (disabled)' : ''}`);
        }
      } else {
        const detail = Object.keys(result).length ? ` ${JSON.stringify(result)}` : '';
        lines.push(ok(`${action}${detail}`));
      }
    }
    const s = r.state;
    lines.push(kv('state', `scrollY ${s.scrollY}/${Math.max(0, s.scrollHeight - s.innerHeight)} · focus ${s.activeElement ?? '—'} · ${s.url}`));
    if (s.pages > 1) lines.push(warn(`${s.pages} tabs open (a click opened a new tab; the session stays on the original)`));
    if (r.consoleErrors.length) lines.push(warn(`${r.consoleErrors.length} new console error(s): ${r.consoleErrors.map((e) => e.text.slice(0, 100)).join(' | ')}`));

    let shot: ShotResult | undefined;
    if (withShot) {
      shot = await ctx.session.call<ShotResult>('screenshot', { path: ctx.artifacts.path('screenshots', `${stamp()}-after-${actions[actions.length - 1].type}.png`) });
      lines.push(kv('capture', shot.path));
    }
    return { data: { ...r, screenshot: shot }, text: lines.join('\n') };
  },
};

export const screenshot: Command = {
  name: 'web-screenshot',
  group: 'browser',
  summary: 'High-definition screenshot without browser chrome; viewport, page, element or several viewports.',
  usage: `web-screenshot [options]
  --full-page            full page (default: just the viewport)
  --selector <css>       captures a single element
  --dpr 3                deviceScaleFactor of this capture (re-rasterizes; default: the session's)
  --viewport 390x844     temporary viewport (responsiveness tests)
  --viewports desktop,tablet,mobile   several captures at once (presets: ${Object.keys(VIEWPORT_PRESETS).join(', ')} or WxH)
  --scroll-through       scrolls the page first to trigger lazy-loading/reveals
  --hide <css>           hides elements (repeatable)
  --hide-banners         hides known cookie/consent banners (visual only; nothing is accepted)
  --no-clean             keeps scrollbars/caret
  --out <file.png>       destination (default .parede/screenshots/)
  --quality 92           JPEG quality when --out ends in .jpg
  --timeout 60           seconds (heavy WebGL scenes on modest machines take a while to paint)`,
  async execute(argv, ctx) {
    requireSession(ctx);
    const { values } = parse(
      argv,
      {
        'full-page': { type: 'boolean' },
        selector: { type: 'string' },
        dpr: { type: 'string' },
        viewport: { type: 'string' },
        viewports: { type: 'string' },
        'scroll-through': { type: 'boolean' },
        hide: { type: 'string', multiple: true },
        'hide-banners': { type: 'boolean' },
        'no-clean': { type: 'boolean' },
        out: { type: 'string' },
        quality: { type: 'string' },
        timeout: { type: 'string' },
      },
      this.usage,
    );
    const label = values.selector ? 'element' : values['full-page'] ? 'full' : 'viewport';
    const shared = {
      fullPage: values['full-page'],
      selector: values.selector,
      dpr: values.dpr ? parseNumber(values.dpr, 'dpr', 2) : undefined,
      clean: !values['no-clean'],
      hide: values.hide,
      hideBanners: values['hide-banners'],
      scrollThrough: values['scroll-through'],
      quality: values.quality ? parseNumber(values.quality, 'quality', 92) : undefined,
      timeoutMs: parseDuration(values.timeout ?? '60', 's'),
    };
    const targets = values.viewports
      ? parseViewportList(values.viewports)
      : [{ name: values.viewport ? 'custom' : '', viewport: values.viewport ? parseViewport(values.viewport) : undefined }];
    const when = stamp();
    const results: ShotResult[] = [];
    for (const t of targets) {
      const size = t.viewport ? `-${t.name || `${t.viewport.width}x${t.viewport.height}`}` : '';
      const path = values.out && targets.length === 1 ? values.out : ctx.artifacts.path('screenshots', `${when}-${label}${size}${values.dpr ? `@${values.dpr}x` : ''}.png`);
      results.push(await ctx.session.call<ShotResult>('screenshot', { ...shared, path, viewport: t.viewport }));
    }
    const lines = results.flatMap((r) => {
      const px = r.pixels ? `${r.pixels.width}×${r.pixels.height}px` : '';
      return [ok(r.path), kv('image', `${px} @${r.dpr}x · ${formatBytes(r.bytes)} · ${r.fullPage ? 'full page' : 'viewport'} ${r.viewport.width}x${r.viewport.height}`), ...r.warnings.map(warn)];
    });
    lines.push(next('open the images to inspect them (the agent can read them directly)'));
    return { data: results.length === 1 ? results[0] : results, text: lines.join('\n') };
  },
};
