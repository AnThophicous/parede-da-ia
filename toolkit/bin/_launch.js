// Shim comum a todos os binários: localiza o build em dist/ e delega para o CLI.
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const toolkitRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

export async function launch(entry, command, fn = 'main') {
  const file = join(toolkitRoot, 'dist', entry);
  if (!existsSync(file)) {
    console.error(`✖ toolkit não compilado (faltando dist/${entry}).`);
    console.error(`  → rode: cd "${toolkitRoot}" && npm install && npm run build`);
    process.exit(1);
  }
  const mod = await import(pathToFileURL(file).href);
  await mod[fn](command, process.argv.slice(2));
}
