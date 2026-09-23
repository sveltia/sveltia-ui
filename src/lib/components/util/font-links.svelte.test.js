import { afterEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FontLinks from './font-links.svelte';
import {
  FONTS,
  getCDNFontURL,
  getFontFaceDescriptors,
  getFontFileName,
  setFontURLs,
} from './fonts.js';

/**
 * A Fontsource file served by the test server, standing in for a self-hosted font.
 */
const LOCAL_FONT_URL = '/node_modules/@fontsource/noto-mono/files/noto-mono-latin-400-normal.woff2';

/**
 * Get the font faces declared by `@font-face` rules for the given family.
 * @param {string} family Font family.
 * @returns {FontFace[]} Font faces.
 */
const getFontFaces = (family) =>
  // Chrome quotes the family name of a face created with the `FontFace` constructor
  [...document.fonts].filter((face) => face.family.replace(/^"(.*)"$/, '$1') === family);

afterEach(() => {
  setFontURLs({});
});

it('declares the fonts as defined in `fonts.js`', async () => {
  const screen = await render(FontLinks);

  const cssText = [...document.styleSheets]
    .flatMap((sheet) => [...sheet.cssRules])
    .map((rule) => rule.cssText)
    .join('\n');

  FONTS.forEach((font) => {
    const [cssFace] = getFontFaces(font.family);
    // Let the browser normalize the descriptors, e.g. the Unicode range, for comparison
    const expected = new FontFace(font.family, 'url(x)', getFontFaceDescriptors(font));

    expect(cssText).toContain(getCDNFontURL(font));
    expect(cssFace.weight).toBe(expected.weight);
    expect(cssFace.display).toBe(expected.display);
    expect(cssFace.unicodeRange).toBe(expected.unicodeRange);
    // `sizeAdjust` isn’t in the TypeScript DOM types yet
    expect(/** @type {any} */ (cssFace).sizeAdjust).toBe(/** @type {any} */ (expected).sizeAdjust);
  });

  screen.unmount();
});

it('renders with a self-hosted font instead of the CDN one', async () => {
  setFontURLs(Object.fromEntries(FONTS.map((font) => [getFontFileName(font), LOCAL_FONT_URL])));

  const screen = await render(FontLinks);
  const span = Object.assign(document.createElement('span'), { textContent: 'abc' });

  span.style.fontFamily = "'Noto Mono'";
  document.body.append(span);

  const faces = getFontFaces('Noto Mono');

  /**
   * Get the URLs of the font files fetched so far.
   * @returns {string[]} URLs.
   */
  const getFetchedFonts = () =>
    performance
      .getEntriesByType('resource')
      .map(({ name }) => name)
      .filter((name) => name.endsWith('.woff2'));

  // Both the `@font-face` rule and the registered face match, but the browser only loads the
  // latter, which was defined last, to render the text
  expect(faces).toHaveLength(2);
  await expect.poll(() => faces.filter(({ status }) => status === 'loaded')).toHaveLength(1);
  expect(faces.filter(({ status }) => status === 'unloaded')).toHaveLength(1);
  expect(getFetchedFonts()).toEqual([new URL(LOCAL_FONT_URL, window.location.href).href]);
  // A font that isn’t used isn’t loaded either
  expect(getFontFaces('Source Sans 3').map(({ status }) => status)).toEqual([
    'unloaded',
    'unloaded',
  ]);

  span.remove();
  screen.unmount();
});

it('warns when a self-hosted font fails to load', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  // A file that isn’t a font; a missing one would be handed over to SvelteKit, which fails to
  // render a 404 page in the test server
  const url = '/node_modules/@fontsource/noto-mono/package.json';

  setFontURLs({ 'noto-mono-latin-400-normal.woff2': url });

  const screen = await render(FontLinks);
  const span = Object.assign(document.createElement('span'), { textContent: 'abc' });

  span.style.fontFamily = "'Noto Mono'";
  document.body.append(span);

  await expect
    .poll(() => warn.mock.calls)
    .toEqual([
      [`Failed to load the Noto Mono font from ${url}. It’s loaded from the CDN instead.`],
    ]);

  span.remove();
  screen.unmount();
  warn.mockRestore();
});
