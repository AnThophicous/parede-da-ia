/**
 * Ports: what the application needs from the outside world (browser, media encoder, disk).
 * Implemented in infrastructure/ and injected by the composition roots (main.ts, daemon.ts).
 * They exist only because they cross real I/O boundaries — no interface for a single internal class.
 */

/** A browser session controlled by the daemon (a separate process, over local RPC). */
export interface BrowserSession {
  /** Ensures a live daemon, starting it if needed. */
  ensure(): Promise<void>;
  /** Is there a registered session (doesn't guarantee it is alive)? */
  active(): boolean;
  /** Runs a use case in the daemon. */
  call<T = unknown>(method: string, params?: object): Promise<T>;
  /** Metadata of the registered session (for diagnostics). */
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
  /** A crop in frame pixels (x, y, width, height) — focus on a component. */
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
  /** One frame every N seconds (uniform mode). */
  everySec?: number;
  /** Scene-change threshold 0–1 (scenes mode). */
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

/** Media encoder (FFmpeg). Optional: without it, frames are still saved. */
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

/** Where artifacts (images, JSON, videos) are written for the agent to read later. */
export interface ArtifactStore {
  root(): string;
  /** Absolute path to a new file inside the kind's folder (creates the folder). */
  path(kind: ArtifactKind, file: string): string;
  /** A new, empty folder for a set of artifacts (recordings, audits). */
  dir(kind: ArtifactKind, name: string): string;
}

export interface AppContext {
  session: BrowserSession;
  /** Resolved on demand: FFmpeg is an optional dependency. */
  encoder(): MediaEncoder | null;
  artifacts: ArtifactStore;
}
