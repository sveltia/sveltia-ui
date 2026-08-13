/**
 * Thin wrapper around a Shiki highlighter instance.
 *
 * Adapted from Lexical’s `FacadeShiki.ts` (MIT licensed). Two things differ from upstream, both to
 * keep Shiki out of the consumer’s bundle. First, the engine is loaded on demand rather than
 * imported at module scope, so a page that never shows a code block never pays for it. Second,
 * grammar and theme metadata comes from `generated.js` rather than `shiki/langs` and
 * `shiki/themes`, whose lazy `import()` thunks would drag the whole grammar set into a bundle.
 * @see https://github.com/facebook/lexical/tree/v0.49.0/packages/lexical-code-shiki
 * @see https://github.com/sveltia/sveltia-cms/issues/587
 */

import {
  $isCodeNode as isCodeNode,
  $createCodeHighlightNode as createCodeHighlightNode,
} from '@lexical/code-core';
import {
  $createLineBreakNode as createLineBreakNode,
  $createTabNode as createTabNode,
  $getNodeByKey as getNodeByKey,
  HISTORY_MERGE_TAG,
  tokenizeRawText,
} from 'lexical';
import { cachePayload, getCachedPayload } from './cache.js';
import { LANGUAGES, THEMES } from './generated.js';
import { getCodeHighlighterLoaders } from './loader.js';

/**
 * @import { CodeNode } from '@lexical/code-core';
 * @import { LexicalEditor, LexicalNode, NodeKey } from 'lexical';
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
 * Mark a code node dirty so the highlighting transform runs again once an async load has completed.
 * @param {LexicalEditor} editor Editor instance.
 * @param {NodeKey} codeNodeKey Key of the code node to refresh.
 */
const refreshCodeNode = (editor, codeNodeKey) => {
  editor.update(
    () => {
      const codeNode = getNodeByKey(codeNodeKey);

      if (!isCodeNode(codeNode)) {
        return;
      }

      const language = codeNode.getLanguage();

      if (language && isCodeLanguageLoaded(language) && !codeNode.getIsSyntaxHighlightSupported()) {
        codeNode.setIsSyntaxHighlightSupported(true);
      }

      codeNode.markDirty();
    },
    { tag: HISTORY_MERGE_TAG },
  );
};

/**
 * In-flight loads, keyed by what is being loaded.
 * @type {Map<string, { promise: Promise<void>, targets: Map<NodeKey, LexicalEditor> }>}
 */
const pendingLoads = new Map();

/**
 * Run an asynchronous load once, however many callers ask for it while it is in flight, and refresh
 * each waiting code node exactly once when it completes.
 *
 * The transform fires on every keystroke, so without this a burst of typing during a load would
 * start a download per keystroke and then flood the editor with one update each. That storm is
 * enough to starve the final re-highlight, leaving a block tokenized as of an earlier keystroke.
 * @param {string} key Cache key identifying the load.
 * @param {() => Promise<void>} run Work to perform on the first call.
 * @param {LexicalEditor} [editor] Editor instance to refresh once the load completes.
 * @param {NodeKey} [codeNodeKey] Key of the code node to refresh.
 * @returns {Promise<void>} Promise resolving when the load has completed.
 */
const loadOnce = (key, run, editor, codeNodeKey) => {
  let entry = pendingLoads.get(key);

  if (!entry) {
    /** @type {Map<NodeKey, LexicalEditor>} */
    const targets = new Map();

    const promise = (async () => {
      try {
        await run();
      } catch {
        // Leave the block unhighlighted; the transform falls back to plain text
      }

      pendingLoads.delete(key);
      targets.forEach((target, nodeKey) => refreshCodeNode(target, nodeKey));
    })();

    entry = { promise, targets };
    pendingLoads.set(key, entry);
  }

  if (editor && codeNodeKey) {
    entry.targets.set(codeNodeKey, editor);
  }

  return entry.promise;
};

/**
 * Load the syntax highlighting engine, then refresh the given code node.
 *
 * Tokenizing is synchronous because it runs inside a Lexical node transform, so the engine has to
 * be resident before any highlighting can happen. The transform bails out while this is in flight
 * and is re-run by `refreshCodeNode()`, the same mechanism upstream already uses for grammars.
 * @param {LexicalEditor} [editor] Editor instance to refresh once the engine is ready.
 * @param {NodeKey} [codeNodeKey] Key of the code node to refresh.
 * @returns {Promise<void> | undefined} Promise resolving when the engine is ready, or `undefined`
 * when it is already loaded or known to be unavailable.
 */
export const loadEngine = (editor, codeNodeKey) => {
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
    editor,
    codeNodeKey,
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
 * Resolve a language alias to its canonical identifier.
 * @param {string} language Language identifier or alias, like `ts`.
 * @returns {string} Canonical identifier, like `typescript`. Returns the input unchanged when the
 * language is unknown.
 */
export const normalizeCodeLanguage = (language) =>
  LANGUAGES.find(({ id, aliases }) => id === language || aliases?.includes(language))?.id ??
  language;

/**
 * Load the grammar for the given language, then refresh the given code node.
 * @param {string} language Language identifier, like `scss` or `diff-js`.
 * @param {LexicalEditor} [editor] Editor instance to refresh once the grammar is ready.
 * @param {NodeKey} [codeNodeKey] Key of the code node to refresh.
 * @returns {Promise<void> | undefined} Promise resolving when the grammar is ready, or `undefined`
 * when it is already loaded or the language is not supported.
 */
export const loadCodeLanguage = (language, editor, codeNodeKey) => {
  const id = getDiffedLanguage(language) ?? language;

  if (!highlighter || isCodeLanguageLoaded(id)) {
    return undefined;
  }

  const info = LANGUAGES.find(({ id: langId, aliases }) => langId === id || aliases?.includes(id));

  if (!info) {
    return undefined;
  }

  return loadOnce(
    `lang/${info.id}`,
    async () => {
      const payload = await resolvePayload('lang', info.id, () =>
        getCodeHighlighterLoaders().loadLanguage(info.id),
      );

      if (payload) {
        await highlighter.loadLanguage(payload);
      }
    },
    editor,
    codeNodeKey,
  );
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
 * Load the given theme, then refresh the given code node.
 * @param {string} theme Theme identifier, like `github-light`.
 * @param {LexicalEditor} [editor] Editor instance to refresh once the theme is ready.
 * @param {NodeKey} [codeNodeKey] Key of the code node to refresh.
 * @returns {Promise<void> | undefined} Promise resolving when the theme is ready, or `undefined`
 * when it is already loaded or unknown.
 */
export const loadCodeTheme = (theme, editor, codeNodeKey) => {
  if (!highlighter || isCodeThemeLoaded(theme)) {
    return undefined;
  }

  if (!THEMES.some(({ id }) => id === theme)) {
    return undefined;
  }

  return loadOnce(
    `theme/${theme}`,
    async () => {
      const payload = await resolvePayload('theme', theme, () =>
        getCodeHighlighterLoaders().loadTheme(theme),
      );

      if (payload) {
        await highlighter.loadTheme(payload);
      }
    },
    editor,
    codeNodeKey,
  );
};

/**
 * Convert Shiki tokens to Lexical nodes.
 * @param {any[][]} tokens Tokens, one array per line.
 * @param {boolean} diff Whether the language is a `diff-*` language.
 * @returns {LexicalNode[]} Lexical nodes.
 */
const mapTokensToLexicalStructure = (tokens, diff) => {
  /** @type {LexicalNode[]} */
  const nodes = [];

  tokens.forEach((line, lineIndex) => {
    if (lineIndex) {
      nodes.push(createLineBreakNode());
    }

    line.forEach((token, tokenIndex) => {
      let { content: text } = token;

      // Implement `diff-*` languages
      if (diff && tokenIndex === 0 && text.length > 0) {
        const prefixes = ['+', '-', '>', '<', ' '];
        const prefixTypes = ['inserted', 'deleted', 'inserted', 'deleted', 'unchanged'];
        const prefixIndex = prefixes.indexOf(text[0]);

        if (prefixIndex !== -1) {
          nodes.push(createCodeHighlightNode(prefixes[prefixIndex], prefixTypes[prefixIndex]));
          text = text.slice(1);
        }
      }

      const style = engine.stringifyTokenStyle(
        token.htmlStyle || engine.getTokenStyleObject(token),
      );

      tokenizeRawText(text, {
        /**
         * Append a line break node.
         * @returns {number} New node count.
         */
        linebreak: () => nodes.push(createLineBreakNode()),
        /**
         * Append a tab node.
         * @returns {number} New node count.
         */
        tab: () => nodes.push(createTabNode()),
        /**
         * Create a highlight node carrying the token’s colour.
         * @param {string} part Text fragment.
         */
        text: (part) => {
          const node = createCodeHighlightNode(part);

          node.setStyle(style);
          nodes.push(node);
        },
      });
    });
  });

  return nodes;
};

/**
 * Tokenize a code node’s content into Lexical nodes.
 *
 * Unlike upstream, the theme’s background and foreground colours are not copied onto the code node.
 * The block’s own colours come from `--sui-code-background-color` so that plain and highlighted
 * blocks look alike and follow the app’s theme rather than Shiki’s; only the per-token colours are
 * taken from the theme.
 * @param {CodeNode} codeNode Code node to tokenize.
 * @param {string} language Language identifier.
 * @returns {LexicalNode[]} Lexical nodes.
 */
export const getHighlightNodes = (codeNode, language) => {
  const diffedLanguage = getDiffedLanguage(language);

  const { tokens } = highlighter.codeToTokens(codeNode.getTextContent(), {
    lang: diffedLanguage ?? language,
    theme: codeNode.getTheme(),
  });

  return mapTokensToLexicalStructure(tokens, !!diffedLanguage);
};
