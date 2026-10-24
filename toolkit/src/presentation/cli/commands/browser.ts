import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ParedeError } from '../../../domain/errors.js';
import { parseDuration, parseNumber, parseViewport } from '../../../domain/units.js';
import { kv, next, ok, parse, requireSession, warn, type Command } from './shared.js';

/** Accepts full URLs, "localhost:5173", bare domains and local file paths. */
export function normalizeUrl(raw: string): string {
  if (/^(https?|file|data|about):/i.test(raw)) return raw;
  if (/^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)(:\d+)?(\/|$)/i.test(raw)) return `http://${raw}`;
  const asPath = resolve(raw);
  if (existsSync(asPath)) return pathToFileURL(asPath).href;
  if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/.*)?$/.test(raw)) return `https://${raw}`;
  throw new ParedeError('BAD_ARG', `Invalid URL: "${raw}".`, 'E.g. https://lusion.co, localhost:5173 or ./dist/index.html');
}

interface OpenResult {
  url: string;
  status: number | null;
  title: string;
  viewport: { width: number; height: number };
  dpr: number;
  mobile: boolean;
  headful: boolean;
  hooks: boolean;
  ms: number;
}

export const urlFetch: Command = {
  name: 'web-url-fetch',
  group: 'browser',
  summary: 'Opens the URL in a persistent Chromium and injects the instrumentation hooks.',
  usage: `web-url-fetch <url> [options]
  --viewport 1440x900     viewport size (default 1440x900; mobile 390x844)
  --dpr 2                 deviceScaleFactor (default 2; mobile 3)
  --mobile                emulates a smartphone (touch, iPhone UA, isMobile)
  --headful               opens a visible window (useful for debugging)
  --color-scheme dark     light | dark | no-preference
  --reduced-motion        emulates prefers-reduced-motion: reduce
  --no-hooks              injects no instrumentation (canvas/shaders/WAAPI/vitals)
  --console               listens to the full console through CDP (default: only error/warn via hooks;
                          some sites detect the listener and slow down)
  --wait-until domcontentloaded   commit | domcontentloaded | load | networkidle
  --timeout 45            seconds for the navigation`,
  async execute(argv, ctx) {
    const { values, positionals } = parse(
      argv,
      {
        viewport: { type: 'string' },
        dpr: { type: 'string' },
        mobile: { type: 'boolean' },
        headful: { type: 'boolean' },
        'user-agent': { type: 'string' },
        'color-scheme': { type: 'string' },
        'reduced-motion': { type: 'boolean' },
        'no-hooks': { type: 'boolean' },
        console: { type: 'boolean' },
        'wait-until': { type: 'string' },
        timeout: { type: 'string' },
      },
      this.usage,
    );
    if (!positionals[0]) throw new ParedeError('BAD_ARG', 'Provide a URL.', this.usage);
    const waitUntil = (values['wait-until'] ?? 'domcontentloaded') as 'commit' | 'domcontentloaded' | 'load' | 'networkidle';
    if (!['commit', 'domcontentloaded', 'load', 'networkidle'].includes(waitUntil)) throw new ParedeError('BAD_ARG', `Invalid --wait-until: ${waitUntil}`);

    const url = normalizeUrl(positionals[0]);
    await ctx.session.ensure();
    const result = await ctx.session.call<OpenResult>('open', {
      url,
      viewport: values.viewport ? parseViewport(values.viewport) : undefined,
      dpr: values.dpr ? parseNumber(values.dpr, 'dpr', 2) : undefined,
      mobile: values.mobile,
      headful: values.headful,
      userAgent: values['user-agent'],
      colorScheme: values['color-scheme'],
      reducedMotion: values['reduced-motion'],
      hooks: !values['no-hooks'],
      fullConsole: values.console,
      waitUntil,
      timeoutMs: parseDuration(values.timeout ?? '45', 's'),
    });
    const lines = [
      ok(`opened ${result.url}${result.status ? ` (HTTP ${result.status})` : ''} in ${(result.ms / 1000).toFixed(1)}s`),
      kv('title', result.title || '—'),
      kv('viewport', `${result.viewport.width}x${result.viewport.height} @${result.dpr}x${result.mobile ? ' · mobile' : ''}${result.headful ? ' · headful' : ' · headless'}`),
      kv('hooks', result.hooks ? 'canvas · webgl/shaders · WAAPI · rAF · fonts · vitals' : 'disabled'),
    ];
    if (result.status && result.status >= 400) lines.push(warn(`the page answered HTTP ${result.status}`));
    lines.push(next('web-wait-page-load (default) or web-wait <s> for preloaders'));
    return { data: result, text: lines.join('\n') };
  },
};

export const waitPageLoad: Command = {
  name: 'web-wait-page-load',
  group: 'browser',
  summary: 'Waits for load + networkidle + fonts + 2 painted frames (the default method).',
  usage: `web-wait-page-load [--timeout 30]`,
  async execute(argv, ctx) {
    const { values } = parse(argv, { timeout: { type: 'string' } }, this.usage);
    const r = await ctx.session.call<{ readyState: string; title: string; resources: number; documentHeight: number; ms: number; consoleErrors: number; firstErrors: { text: string }[]; warnings: string[] }>('waitLoad', {
      timeoutMs: parseDuration(values.timeout ?? '30', 's'),
    });
    const lines = [ok(`page stable in ${(r.ms / 1000).toFixed(1)}s · ${r.resources} resources · document ${r.documentHeight}px`), ...r.warnings.map(warn)];
    if (r.consoleErrors) lines.push(warn(`${r.consoleErrors} console error(s): ${r.firstErrors.map((e) => e.text.slice(0, 120)).join(' | ')}`));
    return { data: r, text: lines.join('\n') };
  },
};

export const waitSeconds: Command = {
  name: 'web-wait',
  group: 'browser',
  summary: 'Waits N seconds (fallback for canvas/WebGL preloaders).',
  usage: `web-wait <seconds> [--until-hidden <selector>] [--until-visible <selector>]
  Without flags: a fixed pause. With flags: waits for the selector to disappear/appear, using <seconds> as the limit.`,
  async execute(argv, ctx) {
    const { values, positionals } = parse(argv, { 'until-hidden': { type: 'string' }, 'until-visible': { type: 'string' } }, this.usage);
    const ms = parseDuration(positionals[0] ?? '2', 's');
    const selector = values['until-hidden'] ?? values['until-visible'];
    if (selector) {
      const state = values['until-hidden'] ? 'hidden' : 'visible';
      const r = await ctx.session.call<{ ms: number }>('waitFor', { selector, state, timeoutMs: ms });
      return { data: r, text: ok(`"${selector}" became ${state === 'hidden' ? 'hidden' : 'visible'} in ${(r.ms / 1000).toFixed(1)}s`) };
    }
    await new Promise((r) => setTimeout(r, ms));
    return { data: { waitedMs: ms }, text: ok(`waited ${(ms / 1000).toFixed(1)}s`) };
  },
};

export const close: Command = {
  name: 'web-close',
  group: 'browser',
  summary: 'Closes the browser and the session daemon.',
  usage: 'web-close',
  async execute(_argv, ctx) {
    if (!ctx.session.active()) return { data: { closed: false }, text: ok('no active session') };
    await ctx.session.call('close').catch(() => undefined);
    return { data: { closed: true }, text: ok('session closed') };
  },
};

export const evaluate: Command = {
  name: 'web-eval',
  group: 'browser',
  summary: 'Evaluates a JS expression in the page and returns JSON (inspection and debugging).',
  usage: `web-eval "<expression>"
  e.g. web-eval "getComputedStyle(document.body).fontFamily"
       web-eval "[...document.querySelectorAll('h2')].map(h => h.textContent)"
       web-eval "await fetch('/api/health').then(r => r.status)"`,
  async execute(argv, ctx) {
    requireSession(ctx);
    const expression = argv.join(' ').trim();
    if (!expression) throw new ParedeError('BAD_ARG', 'Provide an expression.', this.usage);
    const r = await ctx.session.call<{ type: string; value: string }>('eval', { expression });
    return { data: r, text: `${ok(`(${r.type})`)}\n${r.value}` };
  },
};

export const status: Command = {
  name: 'status',
  group: 'operations',
  summary: 'Shows the active session, the current URL and the scroll state.',
  usage: 'parede status',
  async execute(_argv, ctx) {
    const info = ctx.session.describe();
    if (!info) return { data: { active: false }, text: '• no active session' };
    const state = await ctx.session.call<Record<string, unknown>>('state').catch((err) => ({ error: (err as Error).message }));
    return {
      data: { active: true, session: info, state },
      text: [ok(`session "${info.name}" · pid ${info.pid} · port ${info.port}`), kv('state', JSON.stringify(state)), kv('log', info.log)].join('\n'),
    };
  },
};

export const logs: Command = {
  name: 'logs',
  group: 'operations',
  summary: 'Shows the latest console messages from the page (errors, warnings, logs).',
  usage: 'parede logs [--limit 50]',
  async execute(argv, ctx) {
    const { values } = parse(argv, { limit: { type: 'string' } }, this.usage);
    const entries = await ctx.session.call<{ type: string; text: string; at: number }[]>('logs', { limit: parseNumber(values.limit, 'limit', 50) });
    const text = entries.length ? entries.map((e) => `  [${e.type}] +${(e.at / 1000).toFixed(1)}s ${e.text}`).join('\n') : '• empty console';
    return { data: entries, text };
  },
};
