/**
 * Contratos dos relatórios que atravessam o RPC (daemon → CLI/MCP).
 * Vivem no domínio para que infraestrutura (produtora) e apresentação (consumidora)
 * dependam ambas para dentro.
 */

export interface Ranked {
  value: string;
  share: number;
}

export interface ContrastIssue {
  selector: string;
  text: string;
  fg: string;
  bg: string;
  ratio: number;
  required: number;
  uncertain: boolean;
}

export interface TypeStyle {
  size: string;
  family: string;
  weight: string;
  lineHeight: string;
  letterSpacing: string;
  transform: string;
  tag: string;
  sample: string;
}

export interface StackItem {
  name: string;
  category: string;
  version?: string;
  source?: string;
}

export interface AestheticGuess {
  primary: string;
  /** Segunda família quando também pontua alto (sites ambiciosos costumam misturar). */
  secondary: string | null;
  confidence: number;
  scores: Record<string, number>;
  signals: string[];
  playbook: string;
}

// ─────────────────────────────── scrap ───────────────────────────────

export interface ScrapReport {
  tool: string;
  generatedAt: string;
  page: {
    url: string;
    title: string;
    lang: string | null;
    viewport: { width: number; height: number; dpr: number };
    document: { width: number; height: number };
    domNodes: number;
    scannedElements: number;
    truncated: boolean;
    headings: { tag: string; text: string }[];
  };
  meta: Record<string, string | number | null>;
  hosting: string[];
  stack: StackItem[];
  colors: {
    background: Ranked[];
    text: Ranked[];
    accent: Ranked[];
    borders: Ranked[];
    svg: Ranked[];
    gradients: Ranked[];
    interactive: Ranked[];
    cssVariables: { name: string; value: string; hex: string; selector: string }[];
    cssVariablesTotal: number;
    otherVariables: { name: string; value: string }[];
    isMonochrome: boolean;
    chromaticColors: string[];
  };
  contrast: { checked: number; failures: number; issues: ContrastIssue[] };
  fonts: {
    providers: string[];
    families: { family: string; weights: string[]; styles: string[]; sources: string[]; usedShare: number }[];
    files: { url: string; format: string; bytes: number | null; provider: string }[];
    used: { family: string; weight: string; share: number }[];
    scale: TypeStyle[];
  };
  icons: { libraries: string[]; inlineSvg: number; spriteUses: number; topViewBoxes: Ranked[] };
  media: {
    images: { src: string; alt: string | null; format: string; natural: string; rendered: string; loading: string; inViewport: boolean; oversized: boolean; missingAlt: boolean }[];
    imageFormats: Record<string, number>;
    imagesMissingAlt: number;
    imagesOversized: number;
    backgroundImages: string[];
    videos: unknown[];
    canvases: { selector: string; size: string; css: string; context: string; fixed: boolean; fullscreen: boolean }[];
    webglContexts: Record<string, number> | null;
    shaders: { type: string; length: number; hash: string; source: string }[];
    iframes: string[];
    customElements: string[];
  };
  effects: {
    backdropFilter: number;
    mixBlendMode: number;
    filter: number;
    transform3d: number;
    perspective: number;
    clipPath: number;
    mask: number;
    willChange: number;
    sticky: number;
    fixed: number;
    transitions: number;
    scrollSnap: number;
    scrollDrivenAnimations: number;
    viewTransitions: number;
    grainOverlays: number;
    customCursor: boolean;
    grid: number;
    flex: number;
    blurFilters: number;
    largeBlurs: number;
    backdropBlurs: number;
    rotated: number;
    draggable: number;
    cssAnimations: string[];
    keyframes: string[];
    runningAnimations: number;
    waapiCalls: number;
    rafPerSecond: number;
    shadows: string[];
  };
  gradients: { value: string; type: string; count: number }[];
  motion: { durations: Ranked[]; easings: Ranked[]; properties: Ranked[] };
  layout: { spacingScale: Ranked[]; spacingOn4pxGrid: number | null; radii: Ranked[]; maxContentWidth: number | null };
  architecture: Record<string, unknown>;
  network: {
    requests: number;
    totalBytes: number;
    byType: Record<string, { count: number; bytes: number }>;
    domains: { host: string; count: number; thirdParty: boolean }[];
    failed: unknown[];
    largest: unknown[];
    assets3d: string[];
    wasm: string[];
    resources: unknown[];
  };
  perf: PerfSnapshot;
  console: { errors: { type: string; text: string; at: number }[]; warnings: number };
  aesthetic: AestheticGuess;
}

export interface PerfSnapshot {
  cls: number | null;
  lcpMs: number | null;
  lcpElement: string | null;
  longTasks: number;
  longTaskMs: number;
}

// ─────────────────────────────── motion ───────────────────────────────

export interface AnimationItem {
  kind: string;
  name: string;
  target: string;
  durationMs: number | null;
  delayMs: number;
  easing: string;
  iterations: number | string;
  playState: string;
  properties: string[];
}

export interface GsapTween {
  targets: string;
  durationS: number;
  ease: string;
  props: string[];
  delayS: number;
  repeat: number;
  stagger: boolean;
  scrollTrigger: boolean;
}

export interface ScrollTriggerInfo {
  trigger: string;
  start: string;
  end: string;
  scrub: string | boolean | number | null;
  pin: boolean;
  toggleActions: string | null;
}

export interface ObservedElement {
  selector: string;
  changes: number;
  props: Record<string, { first: string; last: string; samples: number }>;
}

export interface FrameStats {
  frames: number;
  fps: number;
  p95FrameMs: number;
  worstFrameMs: number;
  longFrames: number;
}

export interface MotionReport {
  url: string;
  libraries: string[];
  running: { total: number; byKind: Record<string, number>; items: AnimationItem[] };
  transitions: { elements: number; durations: Ranked[]; easings: Ranked[]; properties: Ranked[] };
  keyframes: { name: string; css: string }[];
  gsap: { version: string | null; global: boolean; tweens: GsapTween[]; scrollTriggers: ScrollTriggerInfo[] } | null;
  smoothScroll: { library: string | null; options: Record<string, unknown> | null };
  observed: { durationMs: number; mutations: number; elements: ObservedElement[]; properties: Ranked[] } | null;
  frames: FrameStats | null;
  reducedMotion: { rulesFound: number; respected: boolean };
  scrollDriven: number;
  viewTransitions: number;
  tokens: { durations: string[]; easings: string[]; css: string };
}

// ─────────────────────────────── interactions ───────────────────────────────

export interface StyleChange {
  target: 'self' | '::before' | '::after' | 'child';
  property: string;
  from: string;
  to: string;
}

export interface InteractionItem {
  selector: string;
  tag: string;
  label: string;
  cursor: string;
  hover: { changes: StyleChange[]; transition: string; magnetic: boolean };
  focus: { changes: StyleChange[]; visible: boolean };
  press: { changes: StyleChange[] };
  shots: { before: string | null; hover: string | null; focus: string | null };
  verdict: string[];
}

export interface InteractionsReport {
  url: string;
  tested: number;
  items: InteractionItem[];
  sheet: string | null;
  withoutHoverFeedback: number;
  withoutFocusIndicator: number;
  magnetic: number;
}

// ─────────────────────────────── audit ───────────────────────────────

export type Severity = 'erro' | 'aviso' | 'info';

export interface AuditIssue {
  id: string;
  category: 'acessibilidade' | 'responsivo' | 'performance' | 'conteudo' | 'seo' | 'console' | 'movimento';
  severity: Severity;
  message: string;
  viewport: string;
  targets: string[];
}

export interface ViewportAudit {
  name: string;
  width: number;
  height: number;
  screenshot: string | null;
  overflowX: number;
  issues: AuditIssue[];
}

export interface AuditReport {
  url: string;
  generatedAt: string;
  viewports: ViewportAudit[];
  issues: AuditIssue[];
  scores: Record<string, number>;
  overall: number;
  verdict: 'aprovado' | 'reprovado';
  perf: PerfSnapshot & { requests: number; totalBytes: number; jsBytes: number; fontFiles: number };
  reportFile: string | null;
}
