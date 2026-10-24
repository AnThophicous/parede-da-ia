import { readFileSync, statSync } from 'node:fs';
import { createInterface } from 'node:readline';
import type { AppContext } from '../../application/ports.js';
import { toParedeError } from '../../domain/errors.js';
import { execute } from '../cli/registry.js';

/**
 * Minimal MCP server (JSON-RPC 2.0 over stdio, one message per line).
 * Each tool is a thin adapter over the same CLI command.
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
  /** Returns the generated image in the result (when the client accepts images). */
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
    description: 'Opens a URL in a persistent Chromium (Playwright) and injects hooks (canvas, shaders, WAAPI, vitals). Always the first step.',
    properties: {
      url: str('full URL, localhost:PORT or a path to an HTML file'),
      viewport: str('WIDTHxHEIGHT, e.g. 1440x900'),
      dpr: num('deviceScaleFactor (default 2)'),
      mobile: bool('emulate a smartphone'),
      headful: bool('visible window'),
      color_scheme: str('light | dark'),
      reduced_motion: bool('prefers-reduced-motion: reduce'),
      wait_until: str('commit | domcontentloaded | load | networkidle'),
    },
    required: ['url'],
    positional: ['url'],
  },
  { name: 'web_wait_page_load', command: 'web-wait-page-load', description: 'Waits for load + networkidle + fonts + 2 frames. Warns if it detects a preloader.', properties: { timeout: num('seconds (default 30)') } },
  {
    name: 'web_wait',
    command: 'web-wait',
    description: 'Pauses N seconds (fallback for canvas/WebGL preloaders) or waits for a selector to disappear/appear.',
    properties: { seconds: num('seconds'), until_hidden: str('selector that must disappear'), until_visible: str('selector that must appear') },
    positional: ['seconds'],
  },
  {
    name: 'web_control',
    command: 'web-control',
    description:
      'Real events. `actions` accepts actions separated by ";": scroll-down [px|Nvh] --steps N · scroll-up · scroll-to <top|bottom|Y|selector> · click <selector|x,y> · hover <selector|x,y> --hold 400ms · mousemove <x,y> [x,y...] · drag <selector|x,y> <x,y|+dx,+dy> · keypress <key> · type <text> · wait <s> · inventory',
    properties: { actions: str('e.g. "scroll-to #pricing; wait 0.5; hover a.cta --hold 600ms"'), screenshot: bool('capture the viewport afterwards') },
    required: ['actions'],
    toArgv: (input) => ['sequence', String(input.actions), ...(input.screenshot ? ['--screenshot'] : [])],
  },
  {
    name: 'web_screenshot',
    command: 'web-screenshot',
    description: 'High-definition screenshot: viewport, full page, an element or several viewports (presets desktop,tablet,mobile).',
    properties: {
      full_page: bool('full page'),
      selector: str('capture only this element'),
      dpr: num('deviceScaleFactor for this capture'),
      viewport: str('temporary viewport, e.g. 390x844'),
      viewports: str('list: desktop,tablet,mobile or WxH'),
      scroll_through: bool('scroll first to trigger lazy-loading'),
      hide_banners: bool('hide cookie banners (visual only)'),
      hide: { type: 'array', items: { type: 'string' }, description: 'selectors to hide' },
      out: str('output file'),
      inline: bool('return the image in the result (≤ 4 MB)'),
    },
    toArgv: (input) => toArgv(without(input, 'inline'), []),
    image: (d) => (typeof d.path === 'string' ? d.path : null),
  },
  {
    name: 'web_record_frames',
    command: 'web-record-frames',
    description: 'Records frames (default 0.5s/frame) → spritesheet + MP4 + jank. `while` runs actions during the recording; `selector` crops to a component.',
    properties: {
      interval: str('seconds per frame, e.g. 0.5 or 250ms'),
      duration: str('total duration, e.g. 6'),
      while: str('actions during the recording, e.g. "scroll-down 4000 --steps 80"'),
      selector: str('crop to the element (microinteractions)'),
      tail: str('extra seconds after the actions'),
      viewport: str('temporary viewport'),
      format: str('jpeg | png'),
      max_frames: num('safety limit (default 600)'),
      gif: bool('also produce a GIF'),
      no_video: bool('skip the MP4'),
      detach: bool('record in the background'),
      stop: bool('stop the background recording'),
    },
  },
  {
    name: 'web_scrap',
    command: 'web-scrap',
    description: 'A front-end Wappalyzer: likely aesthetic (with its playbook), stack, fonts, exact palette, WCAG contrast, gradients, blur, media, shaders, vitals and network.',
    properties: { max_elements: num('limit of scanned elements (default 4000)'), out: str('JSON file'), full: bool('return the full JSON instead of the summary') },
    toArgv: (input) => toArgv(without(input, 'full'), []),
  },
  {
    name: 'web_motion',
    command: 'web-motion',
    description: 'Dissects motion: most used transitions and easings, @keyframes, GSAP/ScrollTrigger, Lenis, what animates during actions (observe) and fps/jank. Suggests motion tokens.',
    properties: { observe: str('seconds of observation, e.g. 3'), while: str('actions during the observation'), out: str('JSON file') },
  },
  {
    name: 'web_interactions',
    command: 'web-interactions',
    description: 'Tests the microinteractions of every interactive element: hover, :active, visible focus and magnetic effect, with a before/hover/focus sheet.',
    properties: { limit: num('how many elements (default 12)'), selector: str('test only this one'), hold: str('wait for transitions, e.g. 500ms'), no_shots: bool('no crops') },
    image: (d) => (typeof d.sheet === 'string' ? d.sheet : null),
  },
  {
    name: 'web_audit',
    command: 'web-audit',
    description: 'Automatic QA on several viewports: overflow, touch targets, contrast, focus, alt, headings, metas, vitals, weight, console and reduced-motion → a 0–100 score and a verdict.',
    properties: { viewports: str('desktop,tablet,mobile or WxH'), full_page: bool('full-page captures'), focus_steps: num('Tabs to check focus (default 12)') },
  },
  { name: 'web_tokens', command: 'web-tokens', description: 'Exports the page design tokens (color, font, scale, space, radius, shadow, motion) as CSS and JSON.', properties: { out: str('output folder'), no_motion: bool('no motion tokens') } },
  {
    name: 'web_eval',
    command: 'web-eval',
    description: 'Evaluates a JavaScript expression in the page and returns JSON (inspection/debugging).',
    properties: { expression: str('e.g. "getComputedStyle(document.body).fontFamily"') },
    required: ['expression'],
    toArgv: (input) => [String(input.expression)],
  },
  {
    name: 'media_frames',
    command: 'media-frames',
    description: 'Lets the agent "watch" a local video (e.g. a screen recording sent by the user): timestamped frames + numbered contact sheets.',
    properties: { file: str('path to the video'), every: str('seconds between frames'), scenes: num('scene-change threshold 0–1'), from: str('start (s)'), to: str('end (s)'), max: num('frame limit') },
    required: ['file'],
    positional: ['file'],
    image: (d) => (Array.isArray(d.sheets) && typeof d.sheets[0] === 'string' ? d.sheets[0] : null),
  },
  {
    name: 'web_diff',
    command: 'web-diff',
    description: 'Compares two images (before × after, build × reference): SSIM, PSNR, a difference map and side by side.',
    properties: { a: str('image A'), b: str('image B'), out: str('folder') },
    required: ['a', 'b'],
    positional: ['a', 'b'],
    image: (d) => (typeof d.sideBySide === 'string' ? d.sideBySide : null),
  },
  { name: 'web_close', command: 'web-close', description: 'Closes the browser and the session daemon.', properties: {} },
  { name: 'parede_doctor', command: 'doctor', description: 'Installation check (Node, Chromium, FFmpeg, PATH, agents).', properties: {} },
];

async function callTool(ctx: AppContext, name: string, input: Json) {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
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
  // stdout is reserved for the protocol.
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
    if (id === undefined) return; // notification
    const reply = (result: unknown) => write({ jsonrpc: '2.0', id, result });
    switch (method) {
      case 'initialize':
        return reply({
          protocolVersion: (params.protocolVersion as string) ?? '2025-06-18',
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'parede-da-ia', version },
          instructions:
            'Flow: web_url_fetch → web_wait_page_load → web_scrap / web_motion / web_interactions / web_screenshot / web_record_frames → web_audit before delivering. media_frames reads videos sent by the user. Close with web_close.',
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
        write({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not supported: ${method}` } });
    }
  });
  await new Promise<void>((resolve) => rl.on('close', resolve));
}
