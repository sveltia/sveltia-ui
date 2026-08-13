/* eslint-disable jsdoc/require-jsdoc */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const nodeState = vi.hoisted(() => ({ isCodeNode: false, /** @type {any} */ node: null }));

vi.mock('@lexical/code-core', () => ({
  $isCodeNode: vi.fn(() => nodeState.isCodeNode),
  $createCodeHighlightNode: vi.fn(),
}));

vi.mock('./cache.js', () => ({
  getCachedPayload: vi.fn(async () => undefined),
  cachePayload: vi.fn(async () => undefined),
}));

vi.mock('lexical', () => ({
  $createLineBreakNode: vi.fn(),
  $createTabNode: vi.fn(),
  $getNodeByKey: vi.fn(() => nodeState.node),
  HISTORY_MERGE_TAG: 'history-merge',
  tokenizeRawText: vi.fn(),
}));

/**
 * Build a fake Shiki engine module.
 * @param {object} [options] Options.
 * @param {string[]} [options.loadedLanguages] Languages the highlighter reports as loaded.
 * @returns {any} Fake engine module.
 */
const createFakeEngine = ({ loadedLanguages = [] } = {}) => {
  const languages = [...loadedLanguages];
  const themes = /** @type {string[]} */ ([]);

  return {
    createJavaScriptRegexEngine: vi.fn(() => ({})),
    createHighlighterCoreSync: vi.fn(() => ({
      getLoadedLanguages: () => languages,
      getLoadedThemes: () => themes,
      // A real grammar module is an array of registrations: the language plus its embedded ones
      loadLanguage: vi.fn(async (grammar) => {
        [grammar].flat().forEach(({ name }) => languages.push(name));
      }),
      loadTheme: vi.fn(async (theme) => {
        themes.push(theme.name);
      }),
      codeToTokens: vi.fn(() => ({ tokens: [] })),
    })),
    isSpecialLang: vi.fn((id) => ['plaintext', 'ansi'].includes(id)),
    isSpecialTheme: vi.fn((id) => id === 'none'),
    stringifyTokenStyle: vi.fn(() => ''),
    getTokenStyleObject: vi.fn(() => ({})),
  };
};

/**
 * Import a fresh copy of the facade, since it keeps the engine in module state.
 * @param {Partial<import('$lib/typedefs').CodeHighlighterLoaders>} [loaders] Loader overrides.
 * @returns {Promise<any>} Freshly imported facade module.
 */
const importFacade = async (loaders = {}) => {
  vi.resetModules();

  const { setCodeHighlighterLoaders } = await import('./loader.js');

  setCodeHighlighterLoaders(loaders);

  return import('./facade.js');
};

/**
 * Build a fake code node.
 * @param {object} [options] Options.
 * @param {string} [options.language] Current language.
 * @param {boolean} [options.supported] Whether syntax highlighting is already flagged supported.
 * @returns {any} Fake node.
 */
const createCodeNode = ({ language = 'rust', supported = false } = {}) => {
  let isSupported = supported;

  return {
    getLanguage: () => language,
    getIsSyntaxHighlightSupported: () => isSupported,
    setIsSyntaxHighlightSupported: vi.fn((value) => {
      isSupported = value;
    }),
    markDirty: vi.fn(),
  };
};

/**
 * Build a fake editor that runs its update callback synchronously.
 * @returns {any} Fake editor.
 */
const createEditor = () => ({ update: vi.fn((callback) => callback()) });

describe('shiki facade', () => {
  beforeEach(() => {
    nodeState.isCodeNode = false;
    nodeState.node = null;
    vi.clearAllMocks();
  });

  it('treats the plain languages as needing no highlighting', async () => {
    const { isPlainLanguage } = await importFacade();

    ['', 'plain', 'plaintext', 'text', 'txt'].forEach((lang) => {
      expect(isPlainLanguage(lang)).toBe(true);
    });

    expect(isPlainLanguage(undefined)).toBe(true);
    expect(isPlainLanguage(null)).toBe(true);
  });

  it('does not treat a language with a grammar as plain', async () => {
    const { isPlainLanguage } = await importFacade();

    // `ansi` is rendered by Shiki, so it still needs the engine
    ['javascript', 'astro', 'ansi'].forEach((lang) => {
      expect(isPlainLanguage(lang)).toBe(false);
    });
  });

  it('resolves language aliases to their canonical ID', async () => {
    const { normalizeCodeLanguage } = await importFacade();

    expect(normalizeCodeLanguage('ts')).toBe('typescript');
    expect(normalizeCodeLanguage('js')).toBe('javascript');
    expect(normalizeCodeLanguage('typescript')).toBe('typescript');
  });

  it('leaves an unknown language untouched', async () => {
    const { normalizeCodeLanguage } = await importFacade();

    expect(normalizeCodeLanguage('nonexistent')).toBe('nonexistent');
  });

  it('loads the engine only once, however many callers ask', async () => {
    const loadEngineMock = vi.fn(async () => createFakeEngine());
    const facade = await importFacade({ loadEngine: loadEngineMock });

    expect(facade.isEngineLoaded()).toBe(false);

    await Promise.all([facade.loadEngine(), facade.loadEngine(), facade.loadEngine()]);

    expect(loadEngineMock).toHaveBeenCalledTimes(1);
    expect(facade.isEngineLoaded()).toBe(true);
    expect(facade.loadEngine()).toBeUndefined();
  });

  it('gives up on the engine after a failure instead of retrying forever', async () => {
    const loadEngineMock = vi.fn(async () => {
      throw new Error('offline');
    });

    const facade = await importFacade({ loadEngine: loadEngineMock });

    await facade.loadEngine();

    expect(facade.isEngineUnavailable()).toBe(true);
    expect(facade.isEngineLoaded()).toBe(false);

    // A second attempt is a no-op rather than another request
    expect(facade.loadEngine()).toBeUndefined();
    expect(loadEngineMock).toHaveBeenCalledTimes(1);
  });

  it('reports no language as loaded until the engine is in place', async () => {
    const facade = await importFacade({
      loadEngine: async () => createFakeEngine(),
    });

    expect(facade.isCodeLanguageLoaded('javascript')).toBe(false);
    expect(facade.isCodeThemeLoaded('github-light')).toBe(false);
    // Grammar loading is a no-op without an engine
    expect(facade.loadCodeLanguage('javascript')).toBeUndefined();
    expect(facade.loadCodeTheme('github-light')).toBeUndefined();
  });

  it('loads a grammar on demand once the engine is ready', async () => {
    const loadLanguage = vi.fn(async () => ({ default: [{ name: 'javascript' }] }));

    const facade = await importFacade({
      loadEngine: async () => createFakeEngine(),
      loadLanguage,
    });

    await facade.loadEngine();

    expect(facade.isCodeLanguageLoaded('javascript')).toBe(false);

    await facade.loadCodeLanguage('javascript');

    expect(loadLanguage).toHaveBeenCalledWith('javascript');
    expect(facade.isCodeLanguageLoaded('javascript')).toBe(true);
  });

  it('requests the wrapped grammar for a diff language', async () => {
    const loadLanguage = vi.fn(async () => ({ default: [{ name: 'javascript' }] }));

    const facade = await importFacade({
      loadEngine: async () => createFakeEngine(),
      loadLanguage,
    });

    await facade.loadEngine();
    await facade.loadCodeLanguage('diff-js');

    expect(loadLanguage).toHaveBeenCalledWith('javascript');
  });

  it('skips languages Shiki handles without a grammar', async () => {
    const loadLanguage = vi.fn();

    const facade = await importFacade({
      loadEngine: async () => createFakeEngine(),
      loadLanguage,
    });

    await facade.loadEngine();

    expect(facade.isCodeLanguageLoaded('plaintext')).toBe(true);
    expect(facade.loadCodeLanguage('plaintext')).toBeUndefined();
    expect(loadLanguage).not.toHaveBeenCalled();
  });

  it('does not request an unsupported language', async () => {
    const loadLanguage = vi.fn();

    const facade = await importFacade({
      loadEngine: async () => createFakeEngine(),
      loadLanguage,
    });

    await facade.loadEngine();

    expect(facade.loadCodeLanguage('nonexistent')).toBeUndefined();
    expect(loadLanguage).not.toHaveBeenCalled();
  });

  it('survives a grammar that fails to download', async () => {
    const facade = await importFacade({
      loadEngine: async () => createFakeEngine(),
      loadLanguage: async () => {
        throw new Error('404');
      },
    });

    await facade.loadEngine();
    await expect(facade.loadCodeLanguage('javascript')).resolves.toBeUndefined();
    expect(facade.isCodeLanguageLoaded('javascript')).toBe(false);
  });

  it('serves a cached grammar without hitting the loader', async () => {
    const { getCachedPayload } = await import('./cache.js');

    vi.mocked(getCachedPayload).mockResolvedValueOnce([{ name: 'rust' }]);

    const loadLanguage = vi.fn();

    const facade = await importFacade({
      loadEngine: async () => createFakeEngine(),
      loadLanguage,
    });

    await facade.loadEngine();
    await facade.loadCodeLanguage('rust');

    expect(loadLanguage).not.toHaveBeenCalled();
    expect(facade.isCodeLanguageLoaded('rust')).toBe(true);
  });

  it('caches a grammar it had to fetch', async () => {
    const { cachePayload, getCachedPayload } = await import('./cache.js');

    vi.mocked(getCachedPayload).mockResolvedValue(undefined);

    const facade = await importFacade({
      loadEngine: async () => createFakeEngine(),
      loadLanguage: async () => ({ default: [{ name: 'rust' }] }),
    });

    await facade.loadEngine();
    await facade.loadCodeLanguage('rust');

    expect(cachePayload).toHaveBeenCalledWith('lang', 'rust', [{ name: 'rust' }]);
  });

  it('fetches a grammar once however many keystrokes ask during the load', async () => {
    const loadLanguage = vi.fn(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });

      return { default: [{ name: 'rust' }] };
    });

    const facade = await importFacade({
      loadEngine: async () => createFakeEngine(),
      loadLanguage,
    });

    await facade.loadEngine();

    // The transform fires per keystroke, so a burst of typing lands here mid-load
    await Promise.all(Array.from({ length: 10 }, () => facade.loadCodeLanguage('rust')));

    expect(loadLanguage).toHaveBeenCalledTimes(1);
    expect(facade.isCodeLanguageLoaded('rust')).toBe(true);
  });

  it('refreshes a waiting code node once, not once per caller', async () => {
    const facade = await importFacade({
      loadEngine: async () => createFakeEngine(),
      loadLanguage: async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 20);
        });

        return { default: [{ name: 'rust' }] };
      },
    });

    await facade.loadEngine();

    const editor = /** @type {any} */ ({ update: vi.fn() });

    await Promise.all(
      Array.from({ length: 10 }, () => facade.loadCodeLanguage('rust', editor, 'node-1')),
    );

    // A single update, rather than the flood that would starve the final re-highlight
    expect(editor.update).toHaveBeenCalledTimes(1);
  });

  it('refreshes every distinct code node waiting on the same grammar', async () => {
    const facade = await importFacade({
      loadEngine: async () => createFakeEngine(),
      loadLanguage: async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 20);
        });

        return { default: [{ name: 'rust' }] };
      },
    });

    await facade.loadEngine();

    const editor = /** @type {any} */ ({ update: vi.fn() });

    await Promise.all([
      facade.loadCodeLanguage('rust', editor, 'node-1'),
      facade.loadCodeLanguage('rust', editor, 'node-2'),
      facade.loadCodeLanguage('rust', editor, 'node-2'),
    ]);

    expect(editor.update).toHaveBeenCalledTimes(2);
  });

  it('starts a fresh attempt after an in-flight load has settled', async () => {
    const loadLanguage = vi.fn(async () => ({ default: [{ name: 'rust' }] }));

    const facade = await importFacade({
      loadEngine: async () => createFakeEngine(),
      loadLanguage,
    });

    await facade.loadEngine();
    await facade.loadCodeLanguage('rust');

    // Already loaded, so no second request
    expect(facade.loadCodeLanguage('rust')).toBeUndefined();
    expect(loadLanguage).toHaveBeenCalledTimes(1);
  });

  it('flags a waiting node as ready to highlight and redraws it', async () => {
    const facade = await importFacade({
      loadEngine: async () => createFakeEngine(),
      loadLanguage: async () => ({ default: [{ name: 'rust' }] }),
    });

    await facade.loadEngine();

    const node = createCodeNode();

    nodeState.isCodeNode = true;
    nodeState.node = node;

    await facade.loadCodeLanguage('rust', createEditor(), 'node-1');

    expect(node.setIsSyntaxHighlightSupported).toHaveBeenCalledWith(true);
    expect(node.markDirty).toHaveBeenCalled();
  });

  it('leaves the flag alone when the node is already marked ready', async () => {
    const facade = await importFacade({
      loadEngine: async () => createFakeEngine(),
      loadLanguage: async () => ({ default: [{ name: 'rust' }] }),
    });

    await facade.loadEngine();

    const node = createCodeNode({ supported: true });

    nodeState.isCodeNode = true;
    nodeState.node = node;

    await facade.loadCodeLanguage('rust', createEditor(), 'node-1');

    expect(node.setIsSyntaxHighlightSupported).not.toHaveBeenCalled();
    expect(node.markDirty).toHaveBeenCalled();
  });

  it('skips a key that no longer points at a code node', async () => {
    const facade = await importFacade({
      loadEngine: async () => createFakeEngine(),
      loadLanguage: async () => ({ default: [{ name: 'rust' }] }),
    });

    await facade.loadEngine();

    const node = createCodeNode();

    nodeState.isCodeNode = false;
    nodeState.node = node;

    await facade.loadCodeLanguage('rust', createEditor(), 'node-1');

    expect(node.markDirty).not.toHaveBeenCalled();
  });

  it('loads nothing when the loader yields no module', async () => {
    const facade = await importFacade({
      loadEngine: async () => createFakeEngine(),
      loadLanguage: async () => undefined,
    });

    await facade.loadEngine();
    await facade.loadCodeLanguage('rust');

    expect(facade.isCodeLanguageLoaded('rust')).toBe(false);
  });

  it('loads a theme on demand and ignores an unknown one', async () => {
    const loadTheme = vi.fn(async () => ({ default: { name: 'github-dark' } }));

    const facade = await importFacade({
      loadEngine: async () => createFakeEngine(),
      loadTheme,
    });

    await facade.loadEngine();
    await facade.loadCodeTheme('github-dark');

    expect(loadTheme).toHaveBeenCalledWith('github-dark');
    expect(facade.isCodeThemeLoaded('github-dark')).toBe(true);

    loadTheme.mockClear();
    expect(facade.loadCodeTheme('nonexistent-theme')).toBeUndefined();
    expect(loadTheme).not.toHaveBeenCalled();
  });
});
