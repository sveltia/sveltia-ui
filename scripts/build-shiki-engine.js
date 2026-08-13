/**
 * Build the standalone Shiki engine chunk that the code editor fetches on demand.
 *
 * Bundling Shiki’s engine into the library would add ~53 KB gzipped to every consumer, including
 * the vast majority who never open a code block. Instead we ship it as one self-contained ESM
 * file, loaded the first time a code block is highlighted. It must have no bare imports left,
 * since it is loaded straight from a CDN by URL, where bare specifiers cannot be resolved.
 * @see https://github.com/sveltia/sveltia-cms/issues/587
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'rolldown';

// Rolldown rather than esbuild: Vite already depends on it, so it costs no extra download, whereas
// esbuild is only an optional peer that nothing else here needs.
const outfile = fileURLToPath(new URL('../dist/shiki-engine.js', import.meta.url));

await build({
  input: fileURLToPath(
    new URL('../src/lib/components/text-editor/shiki/engine-entry.js', import.meta.url),
  ),
  platform: 'browser',
  output: {
    file: outfile,
    format: 'esm',
    minify: true,
    comments: { legal: false },
  },
});

const code = readFileSync(outfile, 'utf8');
const leftover = code.match(/(?:from|import\()\s*["'][^."'][^"']*["']/g);

if (leftover) {
  throw new Error(
    `Shiki engine chunk still has unresolved bare imports: ${[...new Set(leftover)].join(', ')}`,
  );
}

// eslint-disable-next-line no-console
console.log(`Built dist/shiki-engine.js (${(code.length / 1024).toFixed(1)} KB minified).`);
