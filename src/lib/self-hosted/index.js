import { setCodeHighlighterLoaders } from '../components/text-editor/shiki/loader.js';
import { setFontURLs } from '../components/util/fonts.js';
import { FONT_URLS } from './font-urls.js';
import { LANGUAGE_LOADERS, THEME_LOADERS } from './generated.js';

/**
 * Serve the fonts and the syntax highlighting engine, grammars and themes from the app itself
 * rather than the CDNs, so the components don’t contact any third party. Only the light and dark
 * themes the code editor uses are included; add loaders with `setCodeHighlighterLoaders()` to pass
 * another theme to `highlightCodeToHTML()`. Every file becomes a
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
  setFontURLs(FONT_URLS);

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
