/**
 * COMPOSITION ROOT of the CLI and the MCP server.
 * The only place that knows the ports' concrete implementations:
 * Infrastructure (RPC, FFmpeg, disk) → Application (ports/use cases) → Presentation (CLI/MCP).
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

/** Entry of the web-* binaries and `parede <command>`. */
export function main(command: string | null, argv: string[]): Promise<void> {
  return runCli(command, argv, context, VERSION);
}

/** Entry of the parede-mcp binary (stdio). */
export function mcp(): Promise<void> {
  return serveMcp(context, VERSION);
}
