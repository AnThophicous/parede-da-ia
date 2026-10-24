import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ParedeError } from '../../../domain/errors.js';
import { parseDuration, parseNumber, parseViewport } from '../../../domain/units.js';
import { kv, next, ok, parse, requireSession, warn, type Command } from './shared.js';

/** Aceita URLs completas, "localhost:5173", domínios nus e caminhos de arquivo local. */
export function normalizeUrl(raw: string): string {
  if (/^(https?|file|data|about):/i.test(raw)) return raw;
  if (/^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)(:\d+)?(\/|$)/i.test(raw)) return `http://${raw}`;
  const asPath = resolve(raw);
  if (existsSync(asPath)) return pathToFileURL(asPath).href;
  if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/.*)?$/.test(raw)) return `https://${raw}`;
  throw new ParedeError('BAD_ARG', `URL inválida: "${raw}".`, 'Ex.: https://lusion.co, localhost:5173 ou ./dist/index.html');
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
  group: 'navegador',
  summary: 'Abre a URL num Chromium persistente e injeta os hooks de instrumentação.',
  usage: `web-url-fetch <url> [opções]
  --viewport 1440x900     tamanho da viewport (padrão 1440x900; mobile 390x844)
  --dpr 2                 deviceScaleFactor (padrão 2; mobile 3)
  --mobile                emula smartphone (touch, UA iPhone, isMobile)
  --headful               abre janela visível (útil para depurar)
  --color-scheme dark     light | dark | no-preference
  --reduced-motion        emula prefers-reduced-motion: reduce
  --no-hooks              não injeta instrumentação (canvas/shaders/WAAPI/vitals)
  --console               escuta o console completo via CDP (padrão: só error/warn via hooks;
                          alguns sites detectam a escuta e ficam lentos)
  --wait-until domcontentloaded   commit | domcontentloaded | load | networkidle
  --timeout 45            segundos para a navegação`,
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
    if (!positionals[0]) throw new ParedeError('BAD_ARG', 'Informe a URL.', this.usage);
    const waitUntil = (values['wait-until'] ?? 'domcontentloaded') as 'commit' | 'domcontentloaded' | 'load' | 'networkidle';
    if (!['commit', 'domcontentloaded', 'load', 'networkidle'].includes(waitUntil)) throw new ParedeError('BAD_ARG', `--wait-until inválido: ${waitUntil}`);

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
      ok(`aberto ${result.url}${result.status ? ` (HTTP ${result.status})` : ''} em ${(result.ms / 1000).toFixed(1)}s`),
      kv('título', result.title || '—'),
      kv('viewport', `${result.viewport.width}x${result.viewport.height} @${result.dpr}x${result.mobile ? ' · mobile' : ''}${result.headful ? ' · headful' : ' · headless'}`),
      kv('hooks', result.hooks ? 'canvas · webgl/shaders · WAAPI · rAF · fontes · vitals' : 'desativados'),
    ];
    if (result.status && result.status >= 400) lines.push(warn(`a página respondeu HTTP ${result.status}`));
    lines.push(next('web-wait-page-load (padrão) ou web-wait <s> para pre-loaders'));
    return { data: result, text: lines.join('\n') };
  },
};

export const waitPageLoad: Command = {
  name: 'web-wait-page-load',
  group: 'navegador',
  summary: 'Espera load + networkidle + fontes + 2 frames pintados (método padrão).',
  usage: `web-wait-page-load [--timeout 30]`,
  async execute(argv, ctx) {
    const { values } = parse(argv, { timeout: { type: 'string' } }, this.usage);
    const r = await ctx.session.call<{ readyState: string; title: string; resources: number; documentHeight: number; ms: number; consoleErrors: number; firstErrors: { text: string }[]; warnings: string[] }>('waitLoad', {
      timeoutMs: parseDuration(values.timeout ?? '30', 's'),
    });
    const lines = [ok(`página estável em ${(r.ms / 1000).toFixed(1)}s · ${r.resources} recursos · documento ${r.documentHeight}px`), ...r.warnings.map(warn)];
    if (r.consoleErrors) lines.push(warn(`${r.consoleErrors} erro(s) no console: ${r.firstErrors.map((e) => e.text.slice(0, 120)).join(' | ')}`));
    return { data: r, text: lines.join('\n') };
  },
};

export const waitSeconds: Command = {
  name: 'web-wait',
  group: 'navegador',
  summary: 'Espera N segundos (fallback para pre-loaders em canvas/WebGL).',
  usage: `web-wait <segundos> [--until-hidden <seletor>] [--until-visible <seletor>]
  Sem flags: pausa fixa. Com flags: espera o seletor sumir/aparecer, usando <segundos> como limite.`,
  async execute(argv, ctx) {
    const { values, positionals } = parse(argv, { 'until-hidden': { type: 'string' }, 'until-visible': { type: 'string' } }, this.usage);
    const ms = parseDuration(positionals[0] ?? '2', 's');
    const selector = values['until-hidden'] ?? values['until-visible'];
    if (selector) {
      const state = values['until-hidden'] ? 'hidden' : 'visible';
      const r = await ctx.session.call<{ ms: number }>('waitFor', { selector, state, timeoutMs: ms });
      return { data: r, text: ok(`"${selector}" ficou ${state === 'hidden' ? 'oculto' : 'visível'} em ${(r.ms / 1000).toFixed(1)}s`) };
    }
    await new Promise((r) => setTimeout(r, ms));
    return { data: { waitedMs: ms }, text: ok(`aguardou ${(ms / 1000).toFixed(1)}s`) };
  },
};

export const close: Command = {
  name: 'web-close',
  group: 'navegador',
  summary: 'Encerra o navegador e o daemon da sessão.',
  usage: 'web-close',
  async execute(_argv, ctx) {
    if (!ctx.session.active()) return { data: { closed: false }, text: ok('nenhuma sessão ativa') };
    await ctx.session.call('close').catch(() => undefined);
    return { data: { closed: true }, text: ok('sessão encerrada') };
  },
};

export const evaluate: Command = {
  name: 'web-eval',
  group: 'navegador',
  summary: 'Avalia uma expressão JS na página e devolve JSON (inspeção e depuração).',
  usage: `web-eval "<expressão>"
  Ex.: web-eval "getComputedStyle(document.body).fontFamily"
       web-eval "[...document.querySelectorAll('h2')].map(h => h.textContent)"
       web-eval "await fetch('/api/health').then(r => r.status)"`,
  async execute(argv, ctx) {
    requireSession(ctx);
    const expression = argv.join(' ').trim();
    if (!expression) throw new ParedeError('BAD_ARG', 'Informe uma expressão.', this.usage);
    const r = await ctx.session.call<{ type: string; value: string }>('eval', { expression });
    return { data: r, text: `${ok(`(${r.type})`)}\n${r.value}` };
  },
};

export const status: Command = {
  name: 'status',
  group: 'operação',
  summary: 'Mostra a sessão ativa, a URL atual e o estado de rolagem.',
  usage: 'parede status',
  async execute(_argv, ctx) {
    const info = ctx.session.describe();
    if (!info) return { data: { active: false }, text: '• nenhuma sessão ativa' };
    const state = await ctx.session.call<Record<string, unknown>>('state').catch((err) => ({ error: (err as Error).message }));
    return {
      data: { active: true, session: info, state },
      text: [ok(`sessão "${info.name}" · pid ${info.pid} · porta ${info.port}`), kv('estado', JSON.stringify(state)), kv('log', info.log)].join('\n'),
    };
  },
};

export const logs: Command = {
  name: 'logs',
  group: 'operação',
  summary: 'Mostra as últimas mensagens de console da página (erros, warnings, logs).',
  usage: 'parede logs [--limit 50]',
  async execute(argv, ctx) {
    const { values } = parse(argv, { limit: { type: 'string' } }, this.usage);
    const entries = await ctx.session.call<{ type: string; text: string; at: number }[]>('logs', { limit: parseNumber(values.limit, 'limit', 50) });
    const text = entries.length ? entries.map((e) => `  [${e.type}] +${(e.at / 1000).toFixed(1)}s ${e.text}`).join('\n') : '• console vazio';
    return { data: entries, text };
  },
};
