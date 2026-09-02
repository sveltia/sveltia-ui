import { SHIKI_VERSION } from './generated.js';
import { UI_VERSION } from './version.js';

/**
 * @import { CodeHighlighterLoaders } from '$lib/typedefs';
 */

const SHIKI_CDN_BASE_URL = 'https://unpkg.com/@shikijs';
const UI_CDN_BASE_URL = 'https://unpkg.com/@sveltia/ui';

/**
 * Get the URL of the prebuilt syntax highlighting engine.
 *
 * The engine is a single self-contained chunk published with this package, so its version is this
 * package’s. Loading `@shikijs/core` from a CDN directly would instead fan out to some 50 requests,
 * because its dependency graph is preserved module by module.
 * @returns {string} URL.
 */
export const getEngineURL = () => `${UI_CDN_BASE_URL}@${UI_VERSION}/dist/shiki-engine.js`;

/**
 * Get the URL of a syntax highlighting grammar.
 *
 * Grammars reference their embedded languages by relative path, so importing one grammar URL pulls
 * in whatever else it needs without any manifest of ours. The version must match the engine’s,
 * which `generated.js` guarantees by recording the Shiki version the engine was built from.
 * @param {string} id Canonical language ID.
 * @returns {string} URL.
 */
export const getLanguageURL = (id) => `${SHIKI_CDN_BASE_URL}/langs@${SHIKI_VERSION}/dist/${id}.mjs`;

/**
 * Get the URL of a syntax highlighting theme.
 * @param {string} id Theme ID.
 * @returns {string} URL.
 */
export const getThemeURL = (id) => `${SHIKI_CDN_BASE_URL}/themes@${SHIKI_VERSION}/dist/${id}.mjs`;

/**
 * Load the prebuilt syntax highlighting engine.
 * @returns {Promise<any>} Loaded module.
 */
const loadEngine = async () =>
  // eslint-disable-next-line jsdoc/no-bad-blocks
  import(/* @vite-ignore */ getEngineURL());

/**
 * Load a syntax highlighting grammar.
 * @param {string} id Canonical language ID.
 * @returns {Promise<any>} Loaded module.
 */
const loadLanguage = async (id) =>
  // eslint-disable-next-line jsdoc/no-bad-blocks
  import(/* @vite-ignore */ getLanguageURL(id));

/**
 * Load a syntax highlighting theme.
 * @param {string} id Theme ID.
 * @returns {Promise<any>} Loaded module.
 */
const loadTheme = async (id) =>
  // eslint-disable-next-line jsdoc/no-bad-blocks
  import(/* @vite-ignore */ getThemeURL(id));

/**
 * Loaders in effect. Everything is fetched from a CDN on demand by default, so that nothing
 * Shiki-related ends up in the consumer’s bundle.
 * @type {CodeHighlighterLoaders}
 */
let loaders = { loadEngine, loadLanguage, loadTheme };

/**
 * Override how the code editor obtains the Shiki engine, grammars and themes.
 *
 * By default these are fetched from a CDN on demand, which keeps them out of the bundle entirely.
 * Consumers who would rather bundle them, self-host them, or ship only a handful of languages can
 * replace any of the loaders. Note that a bundler cannot resolve a dynamic import with a variable
 * bare specifier, so bundling grammars needs a map of static imports.
 *
 * ```js
 * setCodeHighlighterLoaders({
 *   loadLanguage: (id) =>
 *     ({
 *       astro: () => import('@shikijs/langs/astro'),
 *       typescript: () => import('@shikijs/langs/typescript'),
 *     })[id]?.(),
 * });
 * ```
 *
 * A loader may return a falsy value for an unsupported language or theme, in which case the code
 * block is rendered as plain text.
 * @param {Partial<CodeHighlighterLoaders>} overrides Loaders to replace. Any omitted loader keeps
 * its current implementation.
 */
export const setCodeHighlighterLoaders = (overrides) => {
  loaders = { ...loaders, ...overrides };
};

/**
 * Get the loaders currently in effect.
 * @returns {CodeHighlighterLoaders} Active loaders.
 */
export const getCodeHighlighterLoaders = () => loaders;
