import { ACTION_HELP, parseAction, parseSequence, type Action } from '../core/actions.js';
import { rpc } from '../core/client.js';
import { ParedeError } from '../core/errors.js';
import { outputPath, stamp } from '../core/paths.js';
import { formatBytes, parseDuration, parseNumber, parseViewport } from '../core/units.js';
import { kv, next, ok, parse, warn, type Command } from './shared.js';

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

export const control: Command = {
  name: 'web-control',
  summary: 'Dispara eventos reais: scroll, click, hover, mousemove, keypress (encadeáveis).',
  usage: `web-control <ação> [parâmetros] [--screenshot]

${ACTION_HELP}

  --screenshot     captura a viewport depois da ação (ex.: validar estado de hover)

Exemplos:
  web-control scroll-down 1200 --steps 24 --interval 50ms
  web-control hover "a.cta" --hold 600ms --screenshot
  web-control sequence "scroll-to #pricing; wait 0.5; click 'button.buy'"
  web-record-frames --duration 8 &  web-control scroll-down 4000 --steps 80   # simultâneo`,
  async execute(argv) {
    const withShot = argv.includes('--screenshot');
    const tokens = argv.filter((a) => a !== '--screenshot');
    if (!tokens.length) throw new ParedeError('BAD_ARG', 'Informe uma ação.', this.usage);

    let actions: Action[];
    if (tokens[0] === 'sequence') {
      if (!tokens[1]) throw new ParedeError('BAD_ARG', 'sequence precisa de uma string "ação; ação; ...".', this.usage);
      actions = parseSequence(tokens.slice(1).join(' '));
    } else {
      actions = [parseAction(tokens)];
    }

    const r = await rpc<ControlResult>('control', { actions });
    const lines: string[] = [];
    for (const { action, result } of r.results) {
      if (action === 'inventory') {
        const inv = result as unknown as { total: number; items: { selector: string; tag: string; label: string; inViewport: boolean; disabled: boolean }[] };
        lines.push(ok(`inventory: ${inv.items.length} de ${inv.total} elementos interativos`));
        for (const item of inv.items) {
          lines.push(`  ${item.inViewport ? '◉' : '○'} ${item.selector}  ${item.tag}${item.label ? ` "${item.label}"` : ''}${item.disabled ? ' (desabilitado)' : ''}`);
        }
      } else {
        const detail = Object.keys(result).length ? ` ${JSON.stringify(result)}` : '';
        lines.push(ok(`${action}${detail}`));
      }
    }
    const s = r.state;
    lines.push(kv('estado', `scrollY ${s.scrollY}/${Math.max(0, s.scrollHeight - s.innerHeight)} · foco ${s.activeElement ?? '—'} · ${s.url}`));
    if (s.pages > 1) lines.push(warn(`${s.pages} abas abertas (um clique abriu nova aba; a sessão continua na original)`));
    if (r.consoleErrors.length) lines.push(warn(`${r.consoleErrors.length} erro(s) novo(s) no console: ${r.consoleErrors.map((e) => e.text.slice(0, 100)).join(' | ')}`));

    let shot: ShotResult | undefined;
    if (withShot) {
      shot = await rpc<ShotResult>('screenshot', { path: outputPath('screenshots', `${stamp()}-after-${actions[actions.length - 1].type}.png`) });
      lines.push(kv('captura', shot.path));
    }
    return { data: { ...r, screenshot: shot }, text: lines.join('\n') };
  },
};

export const screenshot: Command = {
  name: 'web-screenshot',
  summary: 'Screenshot em alta definição (dpr alto), limpo de UI de navegador; viewport ou página inteira.',
  usage: `web-screenshot [opções]
  --full-page            página inteira (padrão: só a viewport)
  --selector <css>       captura apenas um elemento
  --dpr 3                deviceScaleFactor desta captura (padrão: o da sessão, 2)
  --viewport 390x844     viewport temporária (testes de responsividade)
  --scroll-through       rola a página antes para disparar lazy-load/reveals
  --hide <css>           oculta elementos (repetível): banners de cookie, widgets
  --no-clean             mantém scrollbars/caret
  --out <arquivo.png>    destino (padrão .parede/screenshots/)
  --quality 92           qualidade JPEG quando --out termina em .jpg
  --timeout 60           segundos (cenas WebGL pesadas em máquinas modestas demoram a pintar)`,
  async execute(argv) {
    const { values } = parse(
      argv,
      {
        'full-page': { type: 'boolean' },
        selector: { type: 'string' },
        dpr: { type: 'string' },
        viewport: { type: 'string' },
        'scroll-through': { type: 'boolean' },
        hide: { type: 'string', multiple: true },
        'no-clean': { type: 'boolean' },
        out: { type: 'string' },
        quality: { type: 'string' },
        timeout: { type: 'string' },
      },
      this.usage,
    );
    const viewport = values.viewport ? parseViewport(values.viewport) : undefined;
    const label = values.selector ? 'element' : values['full-page'] ? 'full' : 'viewport';
    const size = viewport ? `-${viewport.width}x${viewport.height}` : '';
    const path = values.out ?? outputPath('screenshots', `${stamp()}-${label}${size}${values.dpr ? `@${values.dpr}x` : ''}.png`);
    const r = await rpc<ShotResult>('screenshot', {
      path,
      fullPage: values['full-page'],
      selector: values.selector,
      dpr: values.dpr ? parseNumber(values.dpr, 'dpr', 2) : undefined,
      viewport,
      clean: !values['no-clean'],
      hide: values.hide,
      scrollThrough: values['scroll-through'],
      quality: values.quality ? parseNumber(values.quality, 'quality', 92) : undefined,
      timeoutMs: parseDuration(values.timeout ?? '60', 's'),
    });
    const px = r.pixels ? `${r.pixels.width}×${r.pixels.height}px` : '';
    return {
      data: r,
      text: [ok(`${r.path}`), kv('imagem', `${px} @${r.dpr}x · ${formatBytes(r.bytes)} · ${r.fullPage ? 'página inteira' : 'viewport'} ${r.viewport.width}x${r.viewport.height}`), ...r.warnings.map(warn), next('abra a imagem para inspecionar (o agente pode lê-la diretamente)')].join('\n'),
    };
  },
};
