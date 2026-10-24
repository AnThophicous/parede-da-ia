/**
 * COMPOSITION ROOT da CLI e do servidor MCP.
 * Único lugar que conhece as implementações concretas das portas:
 * Infrastructure (RPC, FFmpeg, disco) → Application (portas/casos de uso) → Presentation (CLI/MCP).
 */
import type { AppContext, MediaEncoder } from './application/ports.js';
import { createFfmpegEncoder } from './infrastructure/ffmpeg/ffmpeg.js';
import { rpcSession } from './infrastructure/session/client.js';
import { fileArtifacts, VERSION } from './infrastructure/session/paths.js';
import { runCli } from './presentation/cli/registry.js';
import { serveMcp } from './presentation/mcp/server.js';

let encoder: MediaEncoder | null | undefined;

const context: AppContext = {
  session: rpcSession,
  encoder: () => (encoder === undefined ? (encoder = createFfmpegEncoder()) : encoder),
  artifacts: fileArtifacts,
};

/** Entrada dos binários web-* e `parede <comando>`. */
export function main(command: string | null, argv: string[]): Promise<void> {
  return runCli(command, argv, context, VERSION);
}

/** Entrada do binário parede-mcp (stdio). */
export function mcp(): Promise<void> {
  return serveMcp(context, VERSION);
}
