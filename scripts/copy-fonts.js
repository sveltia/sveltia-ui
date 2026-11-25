/**
 * Copy the web fonts from the Fontsource packages into `src/lib/self-hosted/fonts`, from where
 * `svelte-package` publishes them for `@sveltia/ui/self-hosted`. The files aren’t committed.
 * Each font’s license is copied along with it, as the SIL Open Font License requires the notice
 * and the license text to accompany every redistributed copy.
 *
 * The CDN serves the same files, so the version in the CDN URLs must match the installed package.
 * It’s written in `fonts.js` and in the static `@font-face` rules of `font-links.svelte`, which
 * can’t read it at runtime, so both are updated here after the packages are, and must be committed.
 */

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import { FONTS, getFontFileName } from '../src/lib/components/util/fonts.js';

const fontsModuleURL = new URL('../src/lib/components/util/fonts.js', import.meta.url);
const fontLinksURL = new URL('../src/lib/components/util/font-links.svelte', import.meta.url);
const outDir = new URL('../src/lib/self-hosted/fonts/', import.meta.url);
/**
 * Escape a string for use in a regular expression.
 * @param {string} str String.
 * @returns {string} Escaped string.
 */
const escape = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Replace every occurrence of a version in a file’s source, failing if there isn’t the expected
 * number of them, so the sync can’t silently miss a version once the source has changed shape.
 * @param {string} source Source.
 * @param {RegExp} pattern Pattern with the version in the second of three groups.
 * @param {string} version New version.
 * @param {number} count Expected number of occurrences: one for each file of the package.
 * @param {string} fileName File name, for the error message.
 * @returns {string} Updated source.
 * @throws {Error} If the pattern doesn’t match the expected number of times.
 */
const replaceVersion = (source, pattern, version, count, fileName) => {
  const globalPattern = new RegExp(pattern.source, 'g');

  if ((source.match(globalPattern) ?? []).length !== count) {
    throw new Error(`Expected ${count} match(es) for ${pattern} in ${fileName}.`);
  }

  return source.replace(globalPattern, `$1${version}$3`);
};

let fontsModule = readFileSync(fontsModuleURL, 'utf8');
let fontLinks = readFileSync(fontLinksURL, 'utf8');
/** @type {string[]} */
const updates = [];

mkdirSync(outDir, { recursive: true });

// A package can provide more than one file, e.g. the upright and italic styles of a font
Object.entries(Object.groupBy(FONTS, ({ packageName }) => packageName)).forEach(
  ([packageName, fonts = []]) => {
    const [{ version, cdnId }] = fonts;
    const packageDir = new URL(`../node_modules/${packageName}/`, import.meta.url);

    const { version: installed } = JSON.parse(
      readFileSync(new URL('package.json', packageDir), 'utf8'),
    );

    if (installed !== version) {
      fontsModule = replaceVersion(
        fontsModule,
        new RegExp(`(packageName: '${escape(packageName)}',\\s+version: ')(${escape(version)})(')`),
        installed,
        fonts.length,
        'fonts.js',
      );
      fontLinks = replaceVersion(
        fontLinks,
        new RegExp(`(/fontsource/fonts/${escape(cdnId)}@)(${escape(version)})(/)`),
        installed,
        fonts.length,
        'font-links.svelte',
      );
      updates.push(`${packageName} ${version} → ${installed}`);
    }

    fonts.forEach((font) => {
      const fileName = getFontFileName(font);

      copyFileSync(new URL(`files/${fileName}`, packageDir), new URL(fileName, outDir));
    });

    copyFileSync(
      new URL('LICENSE', packageDir),
      new URL(`${packageName.split('/')[1]}.LICENSE.txt`, outDir),
    );
  },
);

if (updates.length) {
  writeFileSync(fontsModuleURL, fontsModule);
  writeFileSync(fontLinksURL, fontLinks);

  // eslint-disable-next-line no-console
  console.log(`Updated the font versions: ${updates.join(', ')}.`);
}

// eslint-disable-next-line no-console
console.log(`Copied ${FONTS.length} font files and their licenses to src/lib/self-hosted/fonts.`);
