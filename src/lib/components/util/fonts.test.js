import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Import a fresh copy of the module, which keeps the font URLs in module state.
 * @returns {Promise<typeof import('./fonts.js')>} Freshly imported module.
 */
const importFonts = async () => {
  vi.resetModules();

  return import('./fonts.js');
};

/**
 * Replace `document.fonts` and `FontFace` with stubs that record what is registered.
 * @param {object} [options] Options.
 * @param {() => Promise<any>} [options.getLoaded] Get the promise a font face settles when it’s
 * used. The font is never used by default.
 * @returns {{ add: import('vitest').Mock, delete: import('vitest').Mock }} Stubbed font set.
 */
const stubFontLoadingAPI = ({ getLoaded = () => new Promise(() => {}) } = {}) => {
  const fonts = { add: vi.fn(), delete: vi.fn() };

  vi.stubGlobal(
    'FontFace',
    /**
     * Stub of `FontFace`.
     */
    class {
      /**
       * Record the arguments.
       * @param {string} family Family.
       * @param {string} source Source.
       * @param {object} descriptors Descriptors.
       */
      constructor(family, source, descriptors) {
        Object.assign(this, { family, source, descriptors, loaded: getLoaded() });
      }
    },
  );
  Object.defineProperty(document, 'fonts', { value: fonts, configurable: true });

  return fonts;
};

describe('fonts', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    // @ts-ignore
    delete document.fonts;
  });

  it('names each file as the Fontsource package does', async () => {
    const { FONTS, getFontFileName } = await importFonts();

    expect(FONTS.map(getFontFileName)).toEqual([
      'source-sans-3-latin-wght-normal.woff2',
      'noto-mono-latin-400-normal.woff2',
      'material-symbols-outlined-latin-wght-normal.woff2',
    ]);
  });

  it('builds the CDN URL of each file', async () => {
    const { FONTS, getCDNFontURL } = await importFonts();
    // The versions are updated by `scripts/copy-fonts.js`
    const [sans, mono, symbols] = FONTS.map(({ version }) => version);

    expect(FONTS.map(getCDNFontURL)).toEqual([
      `https://cdn.jsdelivr.net/fontsource/fonts/source-sans-3:vf@${sans}/latin-wght-normal.woff2`,
      `https://cdn.jsdelivr.net/fontsource/fonts/noto-mono@${mono}/latin-400-normal.woff2`,
      `https://cdn.jsdelivr.net/fontsource/fonts/material-symbols-outlined:vf@${symbols}/latin-wght-normal.woff2`,
    ]);
  });

  it('includes only the descriptors a font has', async () => {
    const { FONTS, getFontFaceDescriptors } = await importFonts();

    expect(getFontFaceDescriptors(FONTS[0])).toEqual({
      style: 'normal',
      weight: '200 900',
      display: 'swap',
      unicodeRange: expect.stringContaining('U+2000-206F, U+20AC'),
      sizeAdjust: '110%',
    });
    expect(getFontFaceDescriptors(FONTS[1])).toEqual({
      style: 'normal',
      weight: '400',
      display: 'swap',
    });
    expect(getFontFaceDescriptors(FONTS[2]).unicodeRange).toContain('U+2000-206F, U+2074, U+20AC');
  });

  it('registers a font face for each font given a URL', async () => {
    const fonts = stubFontLoadingAPI();
    const { setFontURLs } = await importFonts();

    setFontURLs({ 'noto-mono-latin-400-normal.woff2': '/fonts/mono.woff2' });

    expect(fonts.add).toHaveBeenCalledOnce();
    expect(fonts.add.mock.calls[0][0]).toMatchObject({
      family: 'Noto Mono',
      source: 'url("/fonts/mono.woff2") format(\'woff2\')',
      descriptors: { style: 'normal', weight: '400', display: 'swap' },
    });
  });

  it('warns when a font fails to load, as the CDN is used instead', async () => {
    // eslint-disable-next-line jsdoc/require-jsdoc
    stubFontLoadingAPI({ getLoaded: () => Promise.reject(new Error('NetworkError')) });

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { setFontURLs } = await importFonts();

    setFontURLs({ 'noto-mono-latin-400-normal.woff2': '/missing.woff2' });
    await vi.waitFor(() => expect(warn).toHaveBeenCalledOnce());

    expect(warn).toHaveBeenCalledWith(
      'Failed to load the Noto Mono font from /missing.woff2. It’s loaded from the CDN instead.',
    );
  });

  it('replaces the font faces registered before', async () => {
    const fonts = stubFontLoadingAPI();
    const { FONTS, getFontFileName, setFontURLs } = await importFonts();

    setFontURLs({ 'noto-mono-latin-400-normal.woff2': '/a.woff2' });

    const [[previous]] = fonts.add.mock.calls;

    setFontURLs(Object.fromEntries(FONTS.map((font) => [getFontFileName(font), '/b.woff2'])));

    expect(fonts.delete).toHaveBeenCalledExactlyOnceWith(previous);
    expect(fonts.add).toHaveBeenCalledTimes(4);
  });

  it('does nothing without the CSS Font Loading API, e.g. on the server', async () => {
    const { setFontURLs } = await importFonts();

    expect(() => setFontURLs({ 'noto-mono-latin-400-normal.woff2': '/a.woff2' })).not.toThrow();
  });
});
