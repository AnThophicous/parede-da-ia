/**
 * Portas: o que a aplicação precisa do mundo externo (navegador, encoder de mídia, disco).
 * Implementadas em infrastructure/ e injetadas pelos composition roots (main.ts, daemon.ts).
 * Só existem porque cruzam fronteiras de I/O reais — nada de interface para classe única interna.
 */

/** Sessão de navegador controlada pelo daemon (processo separado, via RPC local). */
export interface BrowserSession {
  /** Garante um daemon vivo, iniciando-o se necessário. */
  ensure(): Promise<void>;
  /** Existe uma sessão registrada (não garante que esteja viva)? */
  active(): boolean;
  /** Executa um caso de uso no daemon. */
  call<T = unknown>(method: string, params?: object): Promise<T>;
  /** Metadados da sessão registrada (para diagnóstico). */
  describe(): { name: string; pid: number; port: number; log: string } | null;
}

export interface MediaInfo {
  durationSec: number;
  width: number;
  height: number;
  fps: number;
  hasAudio: boolean;
}

export interface SpritesheetJob {
  framesDir: string;
  ext: 'png' | 'jpeg';
  frameCount: number;
  outDir: string;
  tileWidth: number;
  columns?: number;
  /** Recorte em pixels do frame (x, y, largura, altura) — foco em um componente. */
  crop?: { x: number; y: number; width: number; height: number };
}

export interface SequenceJob {
  framesDir: string;
  ext: 'png' | 'jpeg';
  fps: number;
  out: string;
  crop?: SpritesheetJob['crop'];
  width?: number;
}

export interface ExtractJob {
  input: string;
  outDir: string;
  /** Um frame a cada N segundos (modo uniforme). */
  everySec?: number;
  /** Limiar de mudança de cena 0–1 (modo cenas). */
  sceneThreshold?: number;
  fromSec?: number;
  toSec?: number;
  maxFrames: number;
  width: number;
}

export interface ExtractedFrame {
  index: number;
  file: string;
  timeSec: number;
}

export interface CompareJob {
  a: string;
  b: string;
  outDir: string;
}

export interface CompareResult {
  ssim: number;
  psnr: number | null;
  diff: string;
  sideBySide: string;
  resized: boolean;
}

/** Codificador de mídia (FFmpeg). Opcional: sem ele, frames continuam sendo salvos. */
export interface MediaEncoder {
  readonly source: string;
  probe(file: string): Promise<MediaInfo>;
  spritesheets(job: SpritesheetJob): Promise<string[]>;
  video(job: SequenceJob): Promise<string>;
  gif(job: SequenceJob): Promise<string>;
  extractFrames(job: ExtractJob): Promise<ExtractedFrame[]>;
  contactSheet(frames: ExtractedFrame[], out: string, columns: number, tileWidth: number): Promise<string>;
  compare(job: CompareJob): Promise<CompareResult>;
}

export type ArtifactKind = 'screenshots' | 'recordings' | 'scrap' | 'motion' | 'interactions' | 'audit' | 'media' | 'diff' | 'tokens';

/** Onde os artefatos (imagens, JSON, vídeos) são gravados para o agente ler depois. */
export interface ArtifactStore {
  root(): string;
  /** Caminho absoluto para um arquivo novo dentro da pasta do tipo (cria a pasta). */
  path(kind: ArtifactKind, file: string): string;
  /** Pasta nova e vazia para um conjunto de artefatos (gravações, auditorias). */
  dir(kind: ArtifactKind, name: string): string;
}

export interface AppContext {
  session: BrowserSession;
  /** Resolvido sob demanda: FFmpeg é dependência opcional. */
  encoder(): MediaEncoder | null;
  artifacts: ArtifactStore;
}
