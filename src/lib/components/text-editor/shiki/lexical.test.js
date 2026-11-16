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

// The editor stubs have no root element to check the focus against
vi.mock('../background-update.js', () => ({
  getBackgroundUpdateTags: vi.fn((_editor, tags = []) => tags),
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
 * Import fresh copies of the engine and the Lexical glue, since the engine keeps its state in the
 * module.
 * @param {Partial<import('#lib/typedefs.js').CodeHighlighterLoaders>} [loaders] Loader overrides.
 * @returns {Promise<{ engine: any, lexical: any }>} Freshly imported modules.
 */
const importModules = async (loaders = {}) => {
  vi.resetModules();

  const { setCodeHighlighterLoaders } = await import('./loader.js');

  setCodeHighlighterLoaders(loaders);

  return { engine: await import('./engine.js'), lexical: await import('./lexical.js') };
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

describe('shiki Lexical glue', () => {
  beforeEach(() => {
    nodeState.isCodeNode = false;
    nodeState.node = null;
    vi.clearAllMocks();
  });

  it('returns the same refresher for the same editor and node', async () => {
    const { lexical } = await importModules();
    const editor = createEditor();

    expect(lexical.getCodeNodeRefresher(editor, 'node-1')).toBe(
      lexical.getCodeNodeRefresher(editor, 'node-1'),
    );
    expect(lexical.getCodeNodeRefresher(editor, 'node-1')).not.toBe(
      lexical.getCodeNodeRefresher(editor, 'node-2'),
    );
    expect(lexical.getCodeNodeRefresher(editor, 'node-1')).not.toBe(
      lexical.getCodeNodeRefresher(createEditor(), 'node-1'),
    );
  });

  it('refreshes a waiting code node once, not once per caller', async () => {
    const { engine, lexical } = await importModules({
      loadEngine: async () => createFakeEngine(),
      loadLanguage: async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 20);
        });

        return { default: [{ name: 'rust' }] };
      },
    });

    await engine.loadEngine();

    const editor = /** @type {any} */ ({ update: vi.fn() });

    await Promise.all(
      Array.from({ length: 10 }, () =>
        engine.loadCodeLanguage('rust', lexical.getCodeNodeRefresher(editor, 'node-1')),
      ),
    );

    // A single update, rather than the flood that would starve the final re-highlight
    expect(editor.update).toHaveBeenCalledTimes(1);
  });

  it('refreshes every distinct code node waiting on the same grammar', async () => {
    const { engine, lexical } = await importModules({
      loadEngine: async () => createFakeEngine(),
      loadLanguage: async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 20);
        });

        return { default: [{ name: 'rust' }] };
      },
    });

    await engine.loadEngine();

    const editor = /** @type {any} */ ({ update: vi.fn() });

    await Promise.all([
      engine.loadCodeLanguage('rust', lexical.getCodeNodeRefresher(editor, 'node-1')),
      engine.loadCodeLanguage('rust', lexical.getCodeNodeRefresher(editor, 'node-2')),
      engine.loadCodeLanguage('rust', lexical.getCodeNodeRefresher(editor, 'node-2')),
    ]);

    expect(editor.update).toHaveBeenCalledTimes(2);
  });

  it('flags a waiting node as ready to highlight and redraws it', async () => {
    const { engine, lexical } = await importModules({
      loadEngine: async () => createFakeEngine(),
      loadLanguage: async () => ({ default: [{ name: 'rust' }] }),
    });

    await engine.loadEngine();

    const node = createCodeNode();

    nodeState.isCodeNode = true;
    nodeState.node = node;

    await engine.loadCodeLanguage('rust', lexical.getCodeNodeRefresher(createEditor(), 'node-1'));

    expect(node.setIsSyntaxHighlightSupported).toHaveBeenCalledWith(true);
    expect(node.markDirty).toHaveBeenCalled();
  });

  it('leaves the flag alone when the node is already marked ready', async () => {
    const { engine, lexical } = await importModules({
      loadEngine: async () => createFakeEngine(),
      loadLanguage: async () => ({ default: [{ name: 'rust' }] }),
    });

    await engine.loadEngine();

    const node = createCodeNode({ supported: true });

    nodeState.isCodeNode = true;
    nodeState.node = node;

    await engine.loadCodeLanguage('rust', lexical.getCodeNodeRefresher(createEditor(), 'node-1'));

    expect(node.setIsSyntaxHighlightSupported).not.toHaveBeenCalled();
    expect(node.markDirty).toHaveBeenCalled();
  });

  it('skips a key that no longer points at a code node', async () => {
    const { engine, lexical } = await importModules({
      loadEngine: async () => createFakeEngine(),
      loadLanguage: async () => ({ default: [{ name: 'rust' }] }),
    });

    await engine.loadEngine();

    const node = createCodeNode();

    nodeState.isCodeNode = false;
    nodeState.node = node;

    await engine.loadCodeLanguage('rust', lexical.getCodeNodeRefresher(createEditor(), 'node-1'));

    expect(node.markDirty).not.toHaveBeenCalled();
  });
});
