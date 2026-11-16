/**
 * Thin wrapper around a Shiki highlighter instance, independent of any editor. The Lexical glue
 * that turns tokens into nodes and refreshes code blocks lives in `lexical.js`.
 *
 * Adapted from Lexical’s `FacadeShiki.ts` (MIT licensed). Two things differ from upstream, both to
 * keep Shiki out of the consumer’s bundle. First, the engine is loaded on demand rather than
 * imported at module scope, so a page that never shows a code block never pays for it. Second,
 * grammar and theme metadata comes from `generated.js` rather than `shiki/langs` and
 * `shiki/themes`, whose lazy `import()` thunks would drag the whole grammar set into a bundle.
 * @see https://github.com/facebook/lexical/tree/v0.50.0/packages/lexical-code-shiki
 * @see https://github.com/sveltia/sveltia-cms/issues/587
 */

import { cachePayload, getCachedPayload } from './cache.js';
import { LANGUAGES, THEMES } from './generated.js';
import { getCodeHighlighterLoaders } from './loader.js';
import { getCodeTheme } from './theme.js';

/**
 * @import { HighlightedToken } from '#lib/typedefs.js';
 */

/**
 * Languages that need no grammar and no engine: the content is shown verbatim. Shiki treats these
 * as special languages internally; we short-circuit them so that a plain code block — the default
 * for a new block — costs no network request at all.
 *
 * `ansi` is deliberately excluded: Shiki does render it, so it still needs the engine.
 */
const PLAIN_LANGUAGES = ['', 'plain', 'plaintext', 'text', 'txt'];
const DIFF_LANGUAGE_REGEX = /^diff-([\w-]+)/i;
/**
 * Loaded engine module, once `loadEngine()` has resolved.
 * @type {any}
 */
let engine = null;
/**
 * Highlighter instance built from the loaded engine.
 * @type {any}
 */
let highlighter = null;
/** Set when the engine could not be fetched, so we stop retrying on every keystroke. */
let engineUnavailable = false;
/**
 * Get the language a `diff-*` language wraps, if any.
 * @param {string} language Language identifier.
 * @returns {string | null} Wrapped language, or `null` when this is not a diff language.
 */
const getDiffedLanguage = (language) => DIFF_LANGUAGE_REGEX.exec(language)?.[1] ?? null;

/**
 * Whether the given language is rendered as plain text without any highlighting.
 * @param {string | null | undefined} language Language identifier.
 * @returns {boolean} Result.
 */
export const isPlainLanguage = (language) => PLAIN_LANGUAGES.includes(language ?? '');

/**
 * Whether the syntax highlighting engine is loaded and ready to tokenize.
 * @returns {boolean} Result.
 */
export const isEngineLoaded = () => !!highlighter;

/**
 * Whether the engine failed to load. Code blocks fall back to plain text in that case instead of
 * waiting forever.
 * @returns {boolean} Result.
 */
export const isEngineUnavailable = () => engineUnavailable;

/**
 * Whether the grammar for the given language is loaded.
 * @param {string} language Language identifier, like `scss` or `diff-js`.
 * @returns {boolean} Result.
 */
export const isCodeLanguageLoaded = (language) => {
  if (!highlighter) {
    return false;
  }

  const id = getDiffedLanguage(language) ?? language;

  // Shiki handles a handful of languages without a grammar
  if (engine.isSpecialLang(id)) {
    return true;
  }

  // `getLoadedLanguages()` also returns aliases
  return highlighter.getLoadedLanguages().includes(id);
};

/**
 * In-flight loads, keyed by what is being loaded.
 * @type {Map<string, { promise: Promise<void>, callbacks: Set<() => void> }>}
 */
const pendingLoads = new Map();

/**
 * Run an asynchronous load once, however many callers ask for it while it is in flight, and call
 * each distinct callback exactly once when it completes.
 *
 * The editor transform fires on every keystroke, so without this a burst of typing during a load
 * would start a download per keystroke and then flood the editor with one update each. That storm
 * is enough to starve the final re-highlight, leaving a block tokenized as of an earlier keystroke.
 * Callers that want a single notification for repeated requests should therefore pass the same
 * callback each time.
 * @param {string} key Cache key identifying the load.
 * @param {() => Promise<void>} run Work to perform on the first call.
 * @param {() => void} [onLoaded] Function to call once the load completes.
 * @returns {Promise<void>} Promise resolving when the load has completed.
 */
const loadOnce = (key, run, onLoaded) => {
  let entry = pendingLoads.get(key);

  if (!entry) {
    /** @type {Set<() => void>} */
    const callbacks = new Set();

    const promise = (async () => {
      try {
        await run();
      } catch {
        // Leave the block unhighlighted; the transform falls back to plain text
      }

      pendingLoads.delete(key);
      callbacks.forEach((callback) => callback());
    })();

    entry = { promise, callbacks };
    pendingLoads.set(key, entry);
  }

  if (onLoaded) {
    entry.callbacks.add(onLoaded);
  }

  return entry.promise;
};

/**
 * Load the syntax highlighting engine, then call the given function.
 *
 * Tokenizing is synchronous because it runs inside a Lexical node transform, so the engine has to
 * be resident before any highlighting can happen. The transform bails out while this is in flight
 * and is re-run by the callback, the same mechanism upstream already uses for grammars.
 * @param {() => void} [onLoaded] Function to call once the load has completed, whether or not it
 * succeeded.
 * @returns {Promise<void> | undefined} Promise resolving when the engine is ready, or `undefined`
 * when it is already loaded or known to be unavailable.
 */
export const loadEngine = (onLoaded) => {
  if (highlighter || engineUnavailable) {
    return undefined;
  }

  return loadOnce(
    'engine',
    async () => {
      try {
        engine = await getCodeHighlighterLoaders().loadEngine();

        highlighter = engine.createHighlighterCoreSync({
          engine: engine.createJavaScriptRegexEngine(),
          langs: [],
          themes: [],
        });
      } catch {
        engineUnavailable = true;
      }
    },
    onLoaded,
  );
};

/**
 * Get a grammar or theme, from the cache when possible, otherwise through the configured loader.
 *
 * Shiki normalizes a registration in place while loading it, so the payload is cached before it is
 * handed over. Caching is best-effort and never blocks: a write that fails just means the next
 * session fetches again.
 * @param {string} kind Payload kind, either `lang` or `theme`.
 * @param {string} id Language or theme ID.
 * @param {() => Promise<any>} load Loader to call on a cache miss.
 * @returns {Promise<any>} Payload, or a falsy value when unavailable.
 */
const resolvePayload = async (kind, id, load) => {
  const cached = await getCachedPayload(kind, id);

  if (cached) {
    return cached;
  }

  const module = await load();

  if (!module) {
    return undefined;
  }

  const payload = module.default ?? module;

  await cachePayload(kind, id, payload);

  return payload;
};

/**
 * Load a grammar or theme into the highlighter once, then call the given function. The configured
 * loader and the highlighter share the method name for each kind.
 * @param {'lang' | 'theme'} kind Payload kind.
 * @param {string} id Language or theme ID.
 * @param {() => void} [onLoaded] Function to call once the load has completed.
 * @returns {Promise<void>} Promise resolving when the payload is loaded.
 */
const loadAsset = (kind, id, onLoaded) => {
  const method = kind === 'lang' ? 'loadLanguage' : 'loadTheme';

  return loadOnce(
    `${kind}/${id}`,
    async () => {
      const payload = await resolvePayload(kind, id, () => getCodeHighlighterLoaders()[method](id));

      if (payload) {
        await highlighter[method](payload);
      }
    },
    onLoaded,
  );
};

/**
 * Find the metadata of the given language.
 * @param {string} language Language identifier or alias, like `ts`.
 * @returns {(typeof LANGUAGES)[number] | undefined} Language metadata, or `undefined` when the
 * language is unknown.
 */
const findLanguage = (language) =>
  LANGUAGES.find(({ id, aliases }) => id === language || aliases?.includes(language));

/**
 * Resolve a language alias to its canonical identifier.
 * @param {string} language Language identifier or alias, like `ts`.
 * @returns {string} Canonical identifier, like `typescript`. Returns the input unchanged when the
 * language is unknown.
 */
export const normalizeCodeLanguage = (language) => findLanguage(language)?.id ?? language;

/**
 * Load the grammar for the given language, then call the given function.
 * @param {string} language Language identifier, like `scss` or `diff-js`.
 * @param {() => void} [onLoaded] Function to call once the load has completed.
 * @returns {Promise<void> | undefined} Promise resolving when the grammar is ready, or `undefined`
 * when it is already loaded or the language is not supported.
 */
export const loadCodeLanguage = (language, onLoaded) => {
  const id = getDiffedLanguage(language) ?? language;

  if (!highlighter || isCodeLanguageLoaded(id)) {
    return undefined;
  }

  const info = findLanguage(id);

  if (!info) {
    return undefined;
  }

  return loadAsset('lang', info.id, onLoaded);
};

/**
 * Whether the given theme is loaded.
 * @param {string} theme Theme identifier, like `github-light`.
 * @returns {boolean} Result.
 */
export const isCodeThemeLoaded = (theme) => {
  if (!highlighter) {
    return false;
  }

  return engine.isSpecialTheme(theme) || highlighter.getLoadedThemes().includes(theme);
};

/**
 * Load the given theme, then call the given function.
 * @param {string} theme Theme identifier, like `github-light`.
 * @param {() => void} [onLoaded] Function to call once the load has completed.
 * @returns {Promise<void> | undefined} Promise resolving when the theme is ready, or `undefined`
 * when it is already loaded or unknown.
 */
export const loadCodeTheme = (theme, onLoaded) => {
  if (!highlighter || isCodeThemeLoaded(theme)) {
    return undefined;
  }

  if (!THEMES.some(({ id }) => id === theme)) {
    return undefined;
  }

  return loadAsset('theme', theme, onLoaded);
};

/**
 * Tokenize a snippet of code with the raw Shiki tokens, for building editor nodes. The engine, the
 * grammar and the theme must all be loaded.
 * @param {string} code Code to tokenize.
 * @param {string} language Language identifier, like `scss` or `diff-js`.
 * @param {string} [theme] Shiki theme ID.
 * @returns {{ tokens: any[][], diff: boolean }} Tokens, one array per line, and whether the
 * language is a `diff-*` language, in which case the code is tokenized with the language it wraps.
 */
export const tokenizeCode = (code, language, theme) => {
  const diffedLanguage = getDiffedLanguage(language);
  const { tokens } = highlighter.codeToTokens(code, { lang: diffedLanguage ?? language, theme });

  return { tokens, diff: !!diffedLanguage };
};

/**
 * Get the inline style of a Shiki token, preferring its own inline style over the derived one.
 * @param {any} token Token returned by {@link tokenizeCode}.
 * @returns {string} CSS declarations.
 */
export const getTokenStyle = (token) =>
  engine.stringifyTokenStyle(token.htmlStyle || engine.getTokenStyleObject(token));

/**
 * Get the theme to highlight a snippet of code with, if it can be highlighted synchronously: the
 * engine, the grammar of the given language and the theme are all loaded.
 * @param {string} id Canonical language identifier.
 * @param {string} [theme] Shiki theme ID. Defaults to the one matching the app’s appearance.
 * @returns {string | undefined} Theme ID, or `undefined` when the code cannot be highlighted yet.
 */
const getHighlightTheme = (id, theme) => {
  if (!highlighter || isPlainLanguage(id) || !isCodeLanguageLoaded(id)) {
    return undefined;
  }

  // Resolved only once the cheap checks pass, so bailing out early costs nothing
  const resolvedTheme = theme ?? getCodeTheme();

  return isCodeThemeLoaded(resolvedTheme) ? resolvedTheme : undefined;
};

/**
 * Highlight a snippet of code as an HTML string.
 *
 * Unlike the editor, which builds Lexical nodes, this returns markup for rendering elsewhere, such
 * as a Markdown preview. It is synchronous, so it can be called from a renderer that cannot await:
 * when the engine, grammar or theme is not loaded yet, it returns `undefined` rather than blocking,
 * and the caller can render the code unhighlighted. Call {@link loadCodeHighlighter} first and
 * render again once it resolves to get the highlighted result.
 * @param {string} code Code to highlight.
 * @param {string} language Language identifier or alias, like `ts` or `diff-js`.
 * @param {object} [options] Options.
 * @param {string} [options.theme] Shiki theme ID. Defaults to the one matching the app’s
 * appearance.
 * @returns {string | undefined} HTML string, or `undefined` when the code cannot be highlighted
 * yet.
 */
export const highlightCodeToHTML = (code, language, { theme } = {}) => {
  // Unlike tokens, the HTML is highlighted with the language a `diff-*` language wraps
  const id = normalizeCodeLanguage(getDiffedLanguage(language) ?? language);
  const resolvedTheme = getHighlightTheme(id, theme);

  if (resolvedTheme === undefined) {
    return undefined;
  }

  return highlighter.codeToHtml(code, { lang: id, theme: resolvedTheme });
};

/**
 * Highlight a snippet of code as plain tokens.
 *
 * Meant for painting the highlighting behind a `<textarea>`, where the highlighted text has to line
 * up with the editable text glyph by glyph. Only the styles that don’t change the text width are
 * kept: colours, bold, which is rendered as a stroke rather than with a bolder font, underline and
 * strikethrough. Italic is dropped. Tokens in the theme’s default foreground colour have no colour,
 * so they can follow the app’s theme instead. Like {@link highlightCodeToHTML}, this is synchronous
 * and returns `undefined` when the engine, grammar or theme is not loaded yet.
 * @param {string} code Code to highlight.
 * @param {string} language Language identifier or alias, like `md`.
 * @param {object} [options] Options.
 * @param {string} [options.theme] Shiki theme ID. Defaults to the one matching the app’s
 * appearance.
 * @returns {HighlightedToken[][] | undefined} Tokens, one array per line, or `undefined` when the
 * code cannot be highlighted yet.
 */
export const highlightCodeToTokens = (code, language, { theme } = {}) => {
  const id = normalizeCodeLanguage(language);
  const resolvedTheme = getHighlightTheme(id, theme);

  if (resolvedTheme === undefined) {
    return undefined;
  }

  const { tokens, fg = '' } = highlighter.codeToTokens(code, { lang: id, theme: resolvedTheme });

  return tokens.map((/** @type {any[]} */ line) =>
    line.map(({ content, color, fontStyle = 0 }) => {
      /** @type {HighlightedToken} */
      const token = { content };

      if (color && color.toLowerCase() !== fg.toLowerCase()) {
        token.color = color;
      }

      /* eslint-disable no-bitwise */
      // Shiki’s `FontStyle` flags
      if (fontStyle & 2) {
        token.bold = true;
      }

      if (fontStyle & 4) {
        token.underline = true;
      }

      if (fontStyle & 8) {
        token.strikethrough = true;
      }
      /* eslint-enable no-bitwise */

      return token;
    }),
  );
};
