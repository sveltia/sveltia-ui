/**
 * Copy the web fonts from the Fontsource packages into `src/lib/self-hosted/fonts`, from where
 * `svelte-package` publishes them for `@sveltia/ui/self-hosted`. The files aren’t committed; the
 * package versions are checked against the ones the CDN URLs use, so both serve the same fonts.
 * Each font’s license is copied along with it, as the SIL Open Font License requires the notice
 * and the license text to accompany every redistributed copy.
 */

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';

import { FONTS, getFontFileName } from '../src/lib/components/util/fonts.js';

const outDir = new URL('../src/lib/self-hosted/fonts/', import.meta.url);

mkdirSync(outDir, { recursive: true });

FONTS.forEach((font) => {
  const { packageName, version } = font;
  const packageDir = new URL(`../node_modules/${packageName}/`, import.meta.url);
  const installed = JSON.parse(readFileSync(new URL('package.json', packageDir), 'utf8')).version;

  if (installed !== version) {
    throw new Error(`${packageName}@${installed} doesn’t match the CDN version ${version}.`);
  }

  const fileName = getFontFileName(font);

  copyFileSync(new URL(`files/${fileName}`, packageDir), new URL(fileName, outDir));
  copyFileSync(
    new URL('LICENSE', packageDir),
    new URL(`${packageName.split('/')[1]}.LICENSE.txt`, outDir),
  );
});

// eslint-disable-next-line no-console
console.log(`Copied ${FONTS.length} fonts and their licenses to src/lib/self-hosted/fonts.`);
