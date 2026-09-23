import { setCodeHighlighterLoaders } from '../components/text-editor/shiki/loader.js';
import { setFontURLs } from '../components/util/fonts.js';
import { LANGUAGE_LOADERS, THEME_LOADERS } from './generated.js';

/**
 * Serve the fonts and the syntax highlighting engine, grammars and themes from the app itself
 * rather than the CDNs, so the components don’t contact any third party. Every file becomes a
 * separate asset or chunk of the consumer’s bundle, only loaded when needed. Call this before the
 * `AppShell` component is mounted.
 *
 * ```js
 * import { setupSelfHostedAssets } from '@sveltia/ui/self-hosted';
 *
 * setupSelfHostedAssets();
 * ```
 */
export const setupSelfHostedAssets = () => {
  // Spelled out one by one, as a bundler only picks up a literal `new URL()` as an asset
  setFontURLs({
    'source-sans-3-latin-wght-normal.woff2': new URL(
      './fonts/source-sans-3-latin-wght-normal.woff2',
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
  });

  setCodeHighlighterLoaders({
    // eslint-disable-next-line jsdoc/require-jsdoc
    loadEngine: () =>
      // @ts-ignore The engine is built into `dist` by `scripts/build-shiki-engine.js`, so it can’t
      // be resolved before a build, e.g. when the types are checked in CI
      import('@sveltia/ui/shiki-engine'),
    // eslint-disable-next-line jsdoc/require-jsdoc
    loadLanguage: (id) => LANGUAGE_LOADERS[id]?.(),
    // eslint-disable-next-line jsdoc/require-jsdoc
    loadTheme: (id) => THEME_LOADERS[id]?.(),
  });
};
