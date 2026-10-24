import { readFileSync, statSync } from 'node:fs';
import { createInterface } from 'node:readline';
import type { AppContext } from '../../application/ports.js';
import { toParedeError } from '../../domain/errors.js';
import { execute } from '../cli/registry.js';

/**
 * Servidor MCP mínimo (JSON-RPC 2.0 sobre stdio, uma mensagem por linha).
 * Cada ferramenta é um adaptador fino sobre o mesmo comando da CLI.
 */
type Json = Record<string, unknown>;

interface Tool {
  name: string;
  command: string;
  description: string;
  properties: Record<string, Json>;
  required?: string[];
  positional?: string[];
  toArgv?: (input: Json) => string[];
  /** Devolve a imagem gerada no resultado (quando o cliente aceita imagens). */
  image?: (data: Record<string, unknown>) => string | null | undefined;
}

const str = (description: string): Json => ({ type: 'string', description });
const num = (description: string): Json => ({ type: 'number', description });
const bool = (description: string): Json => ({ type: 'boolean', description });

function toArgv(input: Json, positional: string[]): string[] {
  const argv: string[] = [];
  for (const key of positional) if (input[key] !== undefined && input[key] !== null) argv.push(String(input[key]));
  for (const [key, value] of Object.entries(input)) {
    if (positional.includes(key) || value === undefined || value === null || value === false) continue;
    const flag = `--${key.replace(/_/g, '-')}`;
    if (value === true) argv.push(flag);
    else if (Array.isArray(value)) for (const item of value) argv.push(flag, String(item));
    else argv.push(flag, String(value));
  }
  return argv;
}
const without = (input: Json, ...keys: string[]) => Object.fromEntries(Object.entries(input).filter(([k]) => !keys.includes(k)));

const TOOLS: Tool[] = [
  {
    name: 'web_url_fetch',
    command: 'web-url-fetch',
    description: 'Abre uma URL num Chromium persistente (Playwright) e injeta hooks (canvas, shaders, WAAPI, vitals). Sempre o primeiro passo.',
    properties: {
      url: str('URL completa, localhost:PORTA ou caminho de arquivo HTML'),
      viewport: str('LARGURAxALTURA, ex.: 1440x900'),
      dpr: num('deviceScaleFactor (padrão 2)'),
      mobile: bool('emula smartphone'),
      headful: bool('janela visível'),
      color_scheme: str('light | dark'),
      reduced_motion: bool('prefers-reduced-motion: reduce'),
      wait_until: str('commit | domcontentloaded | load | networkidle'),
    },
    required: ['url'],
    positional: ['url'],
  },
  { name: 'web_wait_page_load', command: 'web-wait-page-load', description: 'Espera load + networkidle + fontes + 2 frames. Avisa se detectar pre-loader.', properties: { timeout: num('segundos (padrão 30)') } },
  {
    name: 'web_wait',
    command: 'web-wait',
    description: 'Pausa N segundos (fallback para pre-loaders em canvas/WebGL) ou espera um seletor sumir/aparecer.',
    properties: { seconds: num('segundos'), until_hidden: str('seletor que deve sumir'), until_visible: str('seletor que deve aparecer') },
    positional: ['seconds'],
  },
  {
    name: 'web_control',
    command: 'web-control',
    description:
      'Eventos reais. `actions` aceita ações separadas por ";": scroll-down [px|Nvh] --steps N · scroll-up · scroll-to <top|bottom|Y|seletor> · click <seletor|x,y> · hover <seletor|x,y> --hold 400ms · mousemove <x,y> [x,y...] · drag <seletor|x,y> <x,y|+dx,+dy> · keypress <tecla> · type <texto> · wait <s> · inventory',
    properties: { actions: str('ex.: "scroll-to #pricing; wait 0.5; hover a.cta --hold 600ms"'), screenshot: bool('captura a viewport depois') },
    required: ['actions'],
    toArgv: (input) => ['sequence', String(input.actions), ...(input.screenshot ? ['--screenshot'] : [])],
  },
  {
    name: 'web_screenshot',
    command: 'web-screenshot',
    description: 'Screenshot em alta definição: viewport, página inteira, elemento ou vários viewports (presets desktop,tablet,mobile).',
    properties: {
      full_page: bool('página inteira'),
      selector: str('captura só este elemento'),
      dpr: num('deviceScaleFactor desta captura'),
      viewport: str('viewport temporária, ex.: 390x844'),
      viewports: str('lista: desktop,tablet,mobile ou LxA'),
      scroll_through: bool('rola antes para disparar lazy-load'),
      hide_banners: bool('oculta banners de cookie (só visual)'),
      hide: { type: 'array', items: { type: 'string' }, description: 'seletores a ocultar' },
      out: str('arquivo de saída'),
      inline: bool('devolve a imagem no resultado (≤ 4 MB)'),
    },
    toArgv: (input) => toArgv(without(input, 'inline'), []),
    image: (d) => (typeof d.path === 'string' ? d.path : null),
  },
  {
    name: 'web_record_frames',
    command: 'web-record-frames',
    description: 'Grava frames (padrão 0.5s/frame) → spritesheet + MP4 + jank. `while` executa ações durante a gravação; `selector` recorta num componente.',
    properties: {
      interval: str('segundos por frame, ex.: 0.5 ou 250ms'),
      duration: str('duração total, ex.: 6'),
      while: str('ações durante a gravação, ex.: "scroll-down 4000 --steps 80"'),
      selector: str('recorta no elemento (microinterações)'),
      tail: str('segundos extras após as ações'),
      viewport: str('viewport temporária'),
      format: str('jpeg | png'),
      max_frames: num('limite de segurança (padrão 600)'),
      gif: bool('gera GIF'),
      no_video: bool('pula o MP4'),
      detach: bool('grava em background'),
      stop: bool('encerra a gravação em background'),
    },
  },
  {
    name: 'web_scrap',
    command: 'web-scrap',
    description: 'Wappalyzer de front-end: estética provável (com playbook), stack, fontes, paleta exata, contraste WCAG, gradientes, blur, mídia, shaders, vitals e rede.',
    properties: { max_elements: num('limite de elementos varridos (padrão 4000)'), out: str('arquivo JSON'), full: bool('devolve o JSON completo em vez do resumo') },
    toArgv: (input) => toArgv(without(input, 'full'), []),
  },
  {
    name: 'web_motion',
    command: 'web-motion',
    description: 'Disseca movimento: transições e curvas mais usadas, @keyframes, GSAP/ScrollTrigger, Lenis, o que anima durante ações (observe) e fps/jank. Sugere tokens de movimento.',
    properties: { observe: str('segundos de observação, ex.: 3'), while: str('ações durante a observação'), out: str('arquivo JSON') },
  },
  {
    name: 'web_interactions',
    command: 'web-interactions',
    description: 'Testa microinterações de cada interativo: hover, :active, foco visível e efeito magnético, com folha antes/hover/foco.',
    properties: { limit: num('quantos elementos (padrão 12)'), selector: str('testa só este'), hold: str('espera p/ transições, ex.: 500ms'), no_shots: bool('sem recortes') },
    image: (d) => (typeof d.sheet === 'string' ? d.sheet : null),
  },
  {
    name: 'web_audit',
    command: 'web-audit',
    description: 'QA automático em vários viewports: overflow, alvos de toque, contraste, foco, alt, títulos, metas, vitals, peso, console e reduced-motion → nota 0–100 e veredito.',
    properties: { viewports: str('desktop,tablet,mobile ou LxA'), full_page: bool('capturas de página inteira'), focus_steps: num('Tabs para checar foco (padrão 12)') },
  },
  { name: 'web_tokens', command: 'web-tokens', description: 'Exporta design tokens da página (cor, fonte, escala, espaço, raio, sombra, movimento) em CSS e JSON.', properties: { out: str('pasta de saída'), no_motion: bool('sem tokens de movimento') } },
  {
    name: 'web_eval',
    command: 'web-eval',
    description: 'Avalia uma expressão JavaScript na página e devolve JSON (inspeção/depuração).',
    properties: { expression: str('ex.: "getComputedStyle(document.body).fontFamily"') },
    required: ['expression'],
    toArgv: (input) => [String(input.expression)],
  },
  {
    name: 'media_frames',
    command: 'media-frames',
    description: 'Deixa o agente "assistir" um vídeo local (ex.: gravação de tela enviada pelo usuário): frames com timestamp + folhas de contato numeradas.',
    properties: { file: str('caminho do vídeo'), every: str('segundos entre frames'), scenes: num('limiar de mudança de cena 0–1'), from: str('início (s)'), to: str('fim (s)'), max: num('limite de frames') },
    required: ['file'],
    positional: ['file'],
    image: (d) => (Array.isArray(d.sheets) && typeof d.sheets[0] === 'string' ? d.sheets[0] : null),
  },
  {
    name: 'web_diff',
    command: 'web-diff',
    description: 'Compara duas imagens (antes × depois, build × referência): SSIM, PSNR, mapa de diferença e lado a lado.',
    properties: { a: str('imagem A'), b: str('imagem B'), out: str('pasta') },
    required: ['a', 'b'],
    positional: ['a', 'b'],
    image: (d) => (typeof d.sideBySide === 'string' ? d.sideBySide : null),
  },
  { name: 'web_close', command: 'web-close', description: 'Encerra o navegador e o daemon da sessão.', properties: {} },
  { name: 'parede_doctor', command: 'doctor', description: 'Diagnóstico de instalação (Node, Chromium, FFmpeg, PATH, agentes).', properties: {} },
];

async function callTool(ctx: AppContext, name: string, input: Json) {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) return { content: [{ type: 'text', text: `Ferramenta desconhecida: ${name}` }], isError: true };
  try {
    const argv = tool.toArgv ? tool.toArgv(input) : toArgv(input, tool.positional ?? []);
    const result = await execute(tool.command, argv, ctx);
    const content: Json[] = [{ type: 'text', text: name === 'web_scrap' && input.full ? JSON.stringify(result.data, null, 2) : result.text }];
    const imagePath = tool.image?.((result.data ?? {}) as Record<string, unknown>);
    const wantsImage = name !== 'web_screenshot' || Boolean(input.inline);
    if (imagePath && wantsImage && statSync(imagePath).size <= 4 * 1024 * 1024) {
      content.push({ type: 'image', mimeType: imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg', data: readFileSync(imagePath).toString('base64') });
    }
    return { content };
  } catch (err) {
    const e = toParedeError(err);
    return { content: [{ type: 'text', text: `✖ ${e.message}${e.hint ? `\n${e.hint}` : ''}` }], isError: true };
  }
}

export async function serveMcp(ctx: AppContext, version: string): Promise<void> {
  // stdout é exclusivo do protocolo.
  console.log = (...args: unknown[]) => console.error(...args);
  const write = (msg: Json) => process.stdout.write(`${JSON.stringify(msg)}\n`);
  const rl = createInterface({ input: process.stdin });

  rl.on('line', async (line) => {
    if (!line.trim()) return;
    let msg: { id?: number | string; method?: string; params?: Json };
    try {
      msg = JSON.parse(line);
    } catch {
      write({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
      return;
    }
    const { id, method, params = {} } = msg;
    if (id === undefined) return; // notificação
    const reply = (result: unknown) => write({ jsonrpc: '2.0', id, result });
    switch (method) {
      case 'initialize':
        return reply({
          protocolVersion: (params.protocolVersion as string) ?? '2025-06-18',
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'parede-da-ia', version },
          instructions:
            'Fluxo: web_url_fetch → web_wait_page_load → web_scrap / web_motion / web_interactions / web_screenshot / web_record_frames → web_audit antes de entregar. media_frames lê vídeos enviados pelo usuário. Feche com web_close.',
        });
      case 'ping':
        return reply({});
      case 'tools/list':
        return reply({
          tools: TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: { type: 'object', properties: t.properties, required: t.required ?? [] } })),
        });
      case 'tools/call':
        return reply(await callTool(ctx, String(params.name), (params.arguments as Json) ?? {}));
      default:
        write({ jsonrpc: '2.0', id, error: { code: -32601, message: `Método não suportado: ${method}` } });
    }
  });
  await new Promise<void>((resolve) => rl.on('close', resolve));
}
