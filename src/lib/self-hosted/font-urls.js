/**
 * URLs of the self-hosted font files, keyed with the Fontsource file name, for `setFontURLs()`.
 * Spelled out one by one, as a bundler only picks up a literal `new URL()` as an asset. Kept apart
 * from `index.js` so a test can check the list against `FONTS` without importing the syntax
 * highlighting engine, which only exists after a build.
 * @type {Record<string, string>}
 */
export const FONT_URLS = {
  'source-sans-3-latin-wght-normal.woff2': new URL(
    './fonts/source-sans-3-latin-wght-normal.woff2',
    import.meta.url,
  ).href,
  'source-sans-3-latin-wght-italic.woff2': new URL(
    './fonts/source-sans-3-latin-wght-italic.woff2',
    import.meta.url,
  ).href,
  'noto-mono-latin-400-normal.woff2': new URL(
    './fonts/noto-mono-latin-400-normal.woff2',
    import.meta.url,
  ).href,
  'material-symbols-outlined-latin-wght-normal.woff2': new URL(
    './fonts/material-symbols-outlined-latin-wght-normal.woff2',
    import.meta.url,
  ).href,
};
