// A shim shared by every binary: finds the build in dist/ and delegates to the CLI.
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const toolkitRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

export async function launch(entry, command, fn = 'main') {
  const file = join(toolkitRoot, 'dist', entry);
  if (!existsSync(file)) {
    console.error(`✖ toolkit not built (missing dist/${entry}).`);
    console.error(`  → run: cd "${toolkitRoot}" && npm install && npm run build`);
    process.exit(1);
  }
  const mod = await import(pathToFileURL(file).href);
  await mod[fn](command, process.argv.slice(2));
}
