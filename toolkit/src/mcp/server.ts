import { readFileSync, statSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { execute } from '../cli.js';
import { toParedeError } from '../core/errors.js';
import { VERSION } from '../core/paths.js';

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
}

const str = (description: string): Json => ({ type: 'string', description });
const num = (description: string): Json => ({ type: 'number', description });
const bool = (description: string): Json => ({ type: 'boolean', description });

const TOOLS: Tool[] = [
  {
    name: 'web_url_fetch',
    command: 'web-url-fetch',
    description: 'Abre uma URL num Chromium persistente (Playwright) e injeta hooks de instrumentação no DOM. Sempre o primeiro passo.',
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
  {
    name: 'web_wait_page_load',
    command: 'web-wait-page-load',
    description: 'Espera load + networkidle + fontes + 2 frames. Método padrão após web_url_fetch. Avisa se detectar pre-loader.',
    properties: { timeout: num('segundos (padrão 30)') },
  },
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
      'Eventos reais de interação. `actions` aceita uma ou mais ações separadas por ";": scroll-down [px|Nvh] --steps N --interval 60ms · scroll-up · scroll-to <top|bottom|Y|seletor> · click <seletor|x,y> · hover <seletor|x,y> --hold 400ms · mousemove <x,y> [x,y...] --steps 20 · keypress <tecla> · type <texto> · wait <s> · inventory',
    properties: { actions: str('ex.: "scroll-to #pricing; wait 0.5; hover a.cta --hold 600ms"'), screenshot: bool('captura a viewport depois') },
    required: ['actions'],
    toArgv: (input) => ['sequence', String(input.actions), ...(input.screenshot ? ['--screenshot'] : [])],
  },
  {
    name: 'web_record_frames',
    command: 'web-record-frames',
    description: 'Grava frames (padrão 0.5s/frame) e gera spritesheet + MP4 via FFmpeg. Use `while` para rolar/interagir durante a gravação. Intervalos < 100ms custam muita CPU/RAM.',
    properties: {
      interval: str('segundos por frame, ex.: 0.5 ou 250ms'),
      duration: str('duração total, ex.: 6'),
      while: str('ações durante a gravação, ex.: "scroll-down 4000 --steps 80"'),
      tail: str('segundos extras após as ações'),
      viewport: str('viewport temporária'),
      format: str('png | jpeg'),
      max_frames: num('limite de segurança (padrão 600)'),
      gif: bool('gera GIF'),
      no_video: bool('pula o MP4'),
      detach: bool('grava em background'),
      stop: bool('encerra a gravação em background'),
    },
  },
  {
    name: 'web_screenshot',
    command: 'web-screenshot',
    description: 'Screenshot em alta definição, sem scrollbars/caret. Viewport, página inteira ou elemento.',
    properties: {
      full_page: bool('página inteira'),
      selector: str('captura só este elemento'),
      dpr: num('deviceScaleFactor desta captura'),
      viewport: str('viewport temporária, ex.: 390x844'),
      scroll_through: bool('rola antes para disparar lazy-load'),
      hide: { type: 'array', items: { type: 'string' }, description: 'seletores a ocultar' },
      out: str('arquivo de saída'),
      inline: bool('devolve a imagem no resultado (≤ 4 MB)'),
    },
    toArgv: (input) => toArgv({ ...input, inline: undefined }, []),
  },
  {
    name: 'web_scrap',
    command: 'web-scrap',
    description: 'Wappalyzer de front-end: stack, fontes, ícones, paleta exata (variáveis CSS + cores mais usadas), contraste WCAG, mídia, canvas/shaders, efeitos e rede. Salva JSON completo.',
    properties: { max_elements: num('limite de elementos varridos (padrão 4000)'), out: str('arquivo JSON'), full: bool('devolve o JSON completo em vez do resumo') },
    toArgv: (input) => toArgv({ ...input, full: undefined }, []),
  },
  { name: 'web_close', command: 'web-close', description: 'Encerra o navegador e o daemon da sessão.', properties: {} },
  { name: 'parede_doctor', command: 'doctor', description: 'Diagnóstico de instalação (Node, Chromium, FFmpeg, PATH, agentes).', properties: {} },
];

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

async function callTool(name: string, input: Json) {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) return { content: [{ type: 'text', text: `Ferramenta desconhecida: ${name}` }], isError: true };
  try {
    const argv = tool.toArgv ? tool.toArgv(input) : toArgv(input, tool.positional ?? []);
    const result = await execute(tool.command, argv);
    const content: Json[] = [{ type: 'text', text: name === 'web_scrap' && input.full ? JSON.stringify(result.data, null, 2) : result.text }];
    const path = (result.data as { path?: string })?.path;
    if (name === 'web_screenshot' && input.inline && path && statSync(path).size <= 4 * 1024 * 1024) {
      content.push({ type: 'image', mimeType: path.endsWith('.png') ? 'image/png' : 'image/jpeg', data: readFileSync(path).toString('base64') });
    }
    return { content };
  } catch (err) {
    const e = toParedeError(err);
    return { content: [{ type: 'text', text: `✖ ${e.message}${e.hint ? `\n${e.hint}` : ''}` }], isError: true };
  }
}

export async function main(): Promise<void> {
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
          serverInfo: { name: 'parede-da-ia', version: VERSION },
          instructions: 'Fluxo: web_url_fetch → web_wait_page_load → web_scrap / web_screenshot / web_control / web_record_frames. Feche com web_close.',
        });
      case 'ping':
        return reply({});
      case 'tools/list':
        return reply({
          tools: TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: { type: 'object', properties: t.properties, required: t.required ?? [] } })),
        });
      case 'tools/call':
        return reply(await callTool(String(params.name), (params.arguments as Json) ?? {}));
      default:
        write({ jsonrpc: '2.0', id, error: { code: -32601, message: `Método não suportado: ${method}` } });
    }
  });
  await new Promise<void>((resolve) => rl.on('close', resolve));
}
