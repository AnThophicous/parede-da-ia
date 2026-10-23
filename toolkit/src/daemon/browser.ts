import { chromium, devices, type Browser, type BrowserContext, type Page, type Response } from 'playwright';
import { ParedeError } from '../core/errors.js';
import type { Viewport } from '../core/units.js';
import { installHooks } from '../inject/hooks.js';

export interface OpenOptions {
  url: string;
  viewport?: Viewport;
  dpr?: number;
  mobile?: boolean;
  headful?: boolean;
  userAgent?: string;
  colorScheme?: 'light' | 'dark' | 'no-preference';
  reducedMotion?: boolean;
  /** Escuta o console inteiro via CDP. Desligado por padrão: alguns sites detectam e degradam o render. */
  fullConsole?: boolean;
  hooks?: boolean;
  waitUntil?: 'commit' | 'domcontentloaded' | 'load' | 'networkidle';
  timeoutMs?: number;
}

export interface NetworkEntry {
  url: string;
  method: string;
  status: number | null;
  type: string;
  mime: string | null;
  bytes: number | null;
  fromCache: boolean;
  failure?: string;
}

export interface ConsoleEntry {
  type: string;
  text: string;
  at: number;
}

const MAX_NETWORK = 5000;
const MAX_CSS_BODIES = 60;
const MAX_CONSOLE = 300;

/** Dono único do Chromium da sessão: navegador, contexto, página e telemetria. */
export class BrowserManager {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  options?: OpenOptions;
  mouse = { x: 0, y: 0, known: false };
  network: NetworkEntry[] = [];
  cssBodies = new Map<string, string>();
  consoleLog: ConsoleEntry[] = [];
  documentHeaders: Record<string, string> = {};
  openedAt = 0;
  private launchKey = '';
  private contextKey = '';

  requirePage(): Page {
    if (!this.page || this.page.isClosed()) {
      throw new ParedeError('NO_PAGE', 'Nenhuma página aberta nesta sessão.', 'Rode `web-url-fetch <url>` primeiro.');
    }
    return this.page;
  }

  async open(o: OpenOptions) {
    const mobile = Boolean(o.mobile);
    const viewport = o.viewport ?? (mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });
    const dpr = o.dpr ?? (mobile ? 3 : 2);

    const launchKey = JSON.stringify({ headful: Boolean(o.headful) });
    if (!this.browser || !this.browser.isConnected() || launchKey !== this.launchKey) {
      await this.browser?.close().catch(() => undefined);
      this.browser = await chromium.launch({
        headless: !o.headful,
        // GPU real (D3D/Metal/GL) em vez de SwiftShader: WebGL pesado roda ~4× mais rápido em headless.
        args: process.env.PAREDE_GPU === '0' ? [] : ['--enable-gpu', '--ignore-gpu-blocklist', ...(process.platform === 'win32' ? ['--use-angle=d3d11'] : [])],
      });
      this.launchKey = launchKey;
      this.contextKey = '';
    }

    const contextKey = JSON.stringify({ viewport, dpr, mobile, ua: o.userAgent, cs: o.colorScheme, rm: o.reducedMotion, hooks: o.hooks !== false, fc: Boolean(o.fullConsole) });
    if (!this.context || contextKey !== this.contextKey) {
      await this.context?.close().catch(() => undefined);
      this.context = await this.browser.newContext({
        viewport,
        deviceScaleFactor: dpr,
        isMobile: mobile,
        hasTouch: mobile,
        userAgent: o.userAgent ?? (mobile ? devices['iPhone 13'].userAgent : undefined),
        colorScheme: o.colorScheme,
        reducedMotion: o.reducedMotion ? 'reduce' : 'no-preference',
        ignoreHTTPSErrors: true,
        acceptDownloads: false,
      });
      if (o.hooks !== false) await this.context.addInitScript(installHooks);
      this.page = await this.context.newPage();
      this.attach(this.page, Boolean(o.fullConsole));
      this.contextKey = contextKey;
      this.mouse = { x: 0, y: 0, known: false };
    }

    this.network = [];
    this.cssBodies.clear();
    this.consoleLog = [];
    this.documentHeaders = {};
    this.options = { ...o, viewport, dpr, mobile };
    this.openedAt = Date.now();

    const page = this.requirePage();
    const started = Date.now();
    const response = await page.goto(o.url, { waitUntil: o.waitUntil ?? 'domcontentloaded', timeout: o.timeoutMs ?? 45_000 });
    return {
      url: page.url(),
      status: response?.status() ?? null,
      title: await page.title().catch(() => ''),
      viewport,
      dpr,
      mobile,
      headful: Boolean(o.headful),
      hooks: o.hooks !== false,
      ms: Date.now() - started,
    };
  }

  private attach(page: Page, fullConsole: boolean) {
    page.on('response', (response) => void this.recordResponse(response));
    page.on('requestfailed', (request) => {
      if (this.network.length >= MAX_NETWORK) return;
      this.network.push({
        url: request.url(),
        method: request.method(),
        status: null,
        type: request.resourceType(),
        mime: null,
        bytes: null,
        fromCache: false,
        failure: request.failure()?.errorText ?? 'falhou',
      });
    });
    if (fullConsole) page.on('console', (msg) => this.pushConsole(msg.type(), msg.text()));
    page.on('pageerror', (err) => this.pushConsole('pageerror', err.message));
    page.on('dialog', (dialog) => void dialog.dismiss().catch(() => undefined));
  }

  private pushConsole(type: string, text: string) {
    this.consoleLog.push({ type, text: text.slice(0, 600), at: Date.now() - this.openedAt });
    if (this.consoleLog.length > MAX_CONSOLE) this.consoleLog.shift();
  }

  private async recordResponse(response: Response) {
    if (this.network.length >= MAX_NETWORK) return;
    const request = response.request();
    const headers = response.headers();
    const entry: NetworkEntry = {
      url: response.url(),
      method: request.method(),
      status: response.status(),
      type: request.resourceType(),
      mime: headers['content-type']?.split(';')[0] ?? null,
      bytes: headers['content-length'] ? Number(headers['content-length']) : null,
      fromCache: response.fromServiceWorker() || response.status() === 304,
    };
    this.network.push(entry);

    try {
      if (request.isNavigationRequest() && response.frame() === this.page?.mainFrame()) {
        this.documentHeaders = await response.allHeaders();
      }
      await response.finished();
      const sizes = await request.sizes();
      if (sizes.responseBodySize > 0) entry.bytes = sizes.responseBodySize;
      if ((entry.type === 'stylesheet' || entry.mime === 'text/css') && this.cssBodies.size < MAX_CSS_BODIES) {
        const body = await response.text();
        this.cssBodies.set(entry.url, body.slice(0, 3_000_000));
      }
    } catch {
      // respostas canceladas/redirecionadas não têm corpo
    }
  }

  /** Erros de console desde um instante (ms relativos à abertura). */
  /** pageerror (CDP) + console.error/warn capturados pelos hooks (ou console completo com fullConsole). */
  async consoleEntries(): Promise<ConsoleEntry[]> {
    if (this.options?.fullConsole || !this.page || this.page.isClosed()) return [...this.consoleLog];
    const inPage = await this.page
      .evaluate(() => ((window as unknown as { __PAREDE__?: { console: ConsoleEntry[] } }).__PAREDE__?.console ?? []).slice())
      .catch(() => [] as ConsoleEntry[]);
    return [...this.consoleLog, ...inPage.map((e) => ({ ...e, at: e.at - this.openedAt }))].sort((a, b) => a.at - b.at);
  }

  async consoleErrorsSince(sinceMs: number) {
    return (await this.consoleEntries()).filter((c) => c.at >= sinceMs && (c.type === 'error' || c.type === 'pageerror'));
  }

  sinceOpen() {
    return Date.now() - this.openedAt;
  }

  async state() {
    const page = this.requirePage();
    const view = await page.evaluate(() => ({
      url: location.href,
      title: document.title,
      scrollX: Math.round(window.scrollX),
      scrollY: Math.round(window.scrollY),
      scrollHeight: document.documentElement.scrollHeight,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      activeElement: document.activeElement && document.activeElement !== document.body
        ? `${document.activeElement.tagName.toLowerCase()}${document.activeElement.id ? `#${document.activeElement.id}` : ''}`
        : null,
    }));
    return { ...view, pages: this.context?.pages().length ?? 0, mouse: this.mouse.known ? { x: this.mouse.x, y: this.mouse.y } : null };
  }

  async close() {
    await this.browser?.close().catch(() => undefined);
    this.browser = undefined;
    this.context = undefined;
    this.page = undefined;
  }
}
