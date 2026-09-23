/**
 * @import { FontDefinition } from '../../typedefs';
 */

/**
 * Base URL of the Fontsource files on jsDelivr, from which the fonts are loaded by default.
 * @see https://fontsource.org/docs/getting-started/cdn
 */
export const FONT_CDN_BASE_URL = 'https://cdn.jsdelivr.net/fontsource/fonts';

/**
 * Get the Unicode range of the Latin subset, which is the only one we use. It varies slightly by
 * font, as Fontsource only lists the code points a font covers.
 * @param {string[]} [extra] Extra code points covered by the font.
 * @returns {string} Unicode range.
 */
const getLatinUnicodeRange = (extra = []) =>
  [
    'U+0000-00FF',
    'U+0131',
    'U+0152-0153',
    'U+02BB-02BC',
    'U+02C6',
    'U+02DA',
    'U+02DC',
    'U+0304',
    'U+0308',
    'U+0329',
    'U+2000-206F',
    ...extra,
    'U+20AC',
    'U+2122',
    'U+2191',
    'U+2193',
    'U+2212',
    'U+2215',
    'U+FEFF',
    'U+FFFD',
  ].join(', ');

/**
 * Web fonts used by the components. Each version is kept in sync with the Fontsource package in
 * `devDependencies` by `scripts/copy-fonts.js`, which also copies the file for self-hosting.
 * @type {FontDefinition[]}
 */
export const FONTS = [
  {
    family: 'Source Sans 3',
    packageName: '@fontsource-variable/source-sans-3',
    version: '5.3.0',
    cdnId: 'source-sans-3:vf',
    subset: 'latin-wght-normal',
    format: 'woff2-variations',
    weight: '200 900',
    display: 'swap',
    unicodeRange: getLatinUnicodeRange(),
    sizeAdjust: '110%',
  },
  {
    family: 'Noto Mono',
    packageName: '@fontsource/noto-mono',
    version: '5.3.0',
    cdnId: 'noto-mono',
    subset: 'latin-400-normal',
    format: 'woff2',
    weight: '400',
    display: 'swap',
  },
  {
    family: 'Material Symbols Outlined',
    packageName: '@fontsource-variable/material-symbols-outlined',
    version: '5.3.7',
    cdnId: 'material-symbols-outlined:vf',
    subset: 'latin-wght-normal',
    format: 'woff2-variations',
    weight: '400',
    display: 'block',
    unicodeRange: getLatinUnicodeRange(['U+2074']),
  },
];

/**
 * Get the name of a font file, as published in the Fontsource package, e.g.
 * `source-sans-3-latin-wght-normal.woff2`.
 * @param {FontDefinition} font Font.
 * @returns {string} File name.
 */
export const getFontFileName = ({ packageName, subset }) =>
  `${packageName.split('/')[1]}-${subset}.woff2`;

/**
 * Get the URL of a font file on the CDN.
 * @param {FontDefinition} font Font.
 * @returns {string} URL.
 */
export const getCDNFontURL = ({ cdnId, version, subset }) =>
  `${FONT_CDN_BASE_URL}/${cdnId}@${version}/${subset}.woff2`;

/**
 * Font faces registered with {@link setFontURLs}, removed again when the URLs are replaced.
 * @type {FontFace[]}
 */
let registeredFontFaces = [];

/**
 * Get the descriptors of a font, as `@font-face` in `font-links.svelte` declares them for the CDN.
 * A registered font face only takes over from the CDN one if they match.
 * @param {FontDefinition} font Font.
 * @returns {FontFaceDescriptors} Descriptors.
 */
export const getFontFaceDescriptors = ({ weight, display, unicodeRange, sizeAdjust }) => ({
  style: 'normal',
  weight,
  display: /** @type {FontDisplay} */ (display),
  ...(unicodeRange ? { unicodeRange } : {}),
  ...(sizeAdjust ? { sizeAdjust } : {}),
});

/**
 * Load the fonts from the given URLs instead of the CDN, so they can be self-hosted. The
 * `setupSelfHostedAssets()` function of `@sveltia/ui/self-hosted` calls this with the fonts
 * bundled with the package.
 *
 * The fonts are registered with the CSS Font Loading API, which is subject to the `font-src`
 * directive of a Content Security Policy but not `style-src`. A font face added to the document’s
 * font set takes precedence over the `@font-face` rule for the CDN with the same descriptors, so
 * the CDN file is never fetched. This only works in the browser: in a
 * server-rendered app, the first paint happens with the CDN fonts before the app is hydrated.
 * Call it before the `AppShell` component is mounted, so no font is fetched from the CDN first.
 * @param {Record<string, string>} urls URLs keyed with the Fontsource file name, e.g.
 * `source-sans-3-latin-wght-normal.woff2`. Any font omitted, or whose file fails to load, is still
 * loaded from the CDN; a failure is reported in the console.
 */
export const setFontURLs = (urls) => {
  if (typeof document === 'undefined' || !document.fonts) {
    return;
  }

  registeredFontFaces.forEach((fontFace) => document.fonts.delete(fontFace));

  registeredFontFaces = FONTS.flatMap((font) => {
    const url = urls[getFontFileName(font)];

    if (!url) {
      return [];
    }

    const fontFace = new FontFace(
      font.family,
      `url(${JSON.stringify(url)}) format('${font.format}')`,
      getFontFaceDescriptors(font),
    );

    document.fonts.add(fontFace);

    // The browser falls back to the `@font-face` rule for the CDN if the file can’t be loaded,
    // which goes unnoticed otherwise. `loaded` settles once the font is used, without forcing a
    // download
    fontFace.loaded.catch(() => {
      // eslint-disable-next-line no-console
      console.warn(
        `Failed to load the ${font.family} font from ${url}. It’s loaded from the CDN instead.`,
      );
    });

    return [fontFace];
  });
};
