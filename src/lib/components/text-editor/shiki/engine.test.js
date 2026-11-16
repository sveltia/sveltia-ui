/* eslint-disable jsdoc/require-jsdoc */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./cache.js', () => ({
  getCachedPayload: vi.fn(async () => undefined),
  cachePayload: vi.fn(async () => undefined),
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
 * Import a fresh copy of the engine, since it keeps the engine in module state.
 * @param {Partial<import('#lib/typedefs.js').CodeHighlighterLoaders>} [loaders] Loader overrides.
 * @returns {Promise<any>} Freshly imported engine module.
 */
const importEngine = async (loaders = {}) => {
  vi.resetModules();

  const { setCodeHighlighterLoaders } = await import('./loader.js');

  setCodeHighlighterLoaders(loaders);

  return import('./engine.js');
};

describe('shiki engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('treats the plain languages as needing no highlighting', async () => {
    const { isPlainLanguage } = await importEngine();

    ['', 'plain', 'plaintext', 'text', 'txt'].forEach((lang) => {
      expect(isPlainLanguage(lang)).toBe(true);
    });

    expect(isPlainLanguage(undefined)).toBe(true);
    expect(isPlainLanguage(null)).toBe(true);
  });

  it('does not treat a language with a grammar as plain', async () => {
    const { isPlainLanguage } = await importEngine();

    // `ansi` is rendered by Shiki, so it still needs the engine
    ['javascript', 'astro', 'ansi'].forEach((lang) => {
      expect(isPlainLanguage(lang)).toBe(false);
    });
  });

  it('resolves language aliases to their canonical ID', async () => {
    const { normalizeCodeLanguage } = await importEngine();

    expect(normalizeCodeLanguage('ts')).toBe('typescript');
    expect(normalizeCodeLanguage('js')).toBe('javascript');
    expect(normalizeCodeLanguage('typescript')).toBe('typescript');
  });

  it('leaves an unknown language untouched', async () => {
    const { normalizeCodeLanguage } = await importEngine();

    expect(normalizeCodeLanguage('nonexistent')).toBe('nonexistent');
  });

  it('loads the engine only once, however many callers ask', async () => {
    const loadEngineMock = vi.fn(async () => createFakeEngine());
    const engine = await importEngine({ loadEngine: loadEngineMock });

    expect(engine.isEngineLoaded()).toBe(false);

    await Promise.all([engine.loadEngine(), engine.loadEngine(), engine.loadEngine()]);

    expect(loadEngineMock).toHaveBeenCalledTimes(1);
    expect(engine.isEngineLoaded()).toBe(true);
    expect(engine.loadEngine()).toBeUndefined();
  });

  it('gives up on the engine after a failure instead of retrying forever', async () => {
    const loadEngineMock = vi.fn(async () => {
      throw new Error('offline');
    });

    const engine = await importEngine({ loadEngine: loadEngineMock });

    await engine.loadEngine();

    expect(engine.isEngineUnavailable()).toBe(true);
    expect(engine.isEngineLoaded()).toBe(false);

    // A second attempt is a no-op rather than another request
    expect(engine.loadEngine()).toBeUndefined();
    expect(loadEngineMock).toHaveBeenCalledTimes(1);
  });

  it('reports no language as loaded until the engine is in place', async () => {
    const engine = await importEngine({
      loadEngine: async () => createFakeEngine(),
    });

    expect(engine.isCodeLanguageLoaded('javascript')).toBe(false);
    expect(engine.isCodeThemeLoaded('github-light')).toBe(false);
    // Grammar loading is a no-op without an engine
    expect(engine.loadCodeLanguage('javascript')).toBeUndefined();
    expect(engine.loadCodeTheme('github-light')).toBeUndefined();
  });

  it('loads a grammar on demand once the engine is ready', async () => {
    const loadLanguage = vi.fn(async () => ({ default: [{ name: 'javascript' }] }));

    const engine = await importEngine({
      loadEngine: async () => createFakeEngine(),
      loadLanguage,
    });

    await engine.loadEngine();

    expect(engine.isCodeLanguageLoaded('javascript')).toBe(false);

    await engine.loadCodeLanguage('javascript');

    expect(loadLanguage).toHaveBeenCalledWith('javascript');
    expect(engine.isCodeLanguageLoaded('javascript')).toBe(true);
  });

  it('requests the wrapped grammar for a diff language', async () => {
    const loadLanguage = vi.fn(async () => ({ default: [{ name: 'javascript' }] }));

    const engine = await importEngine({
      loadEngine: async () => createFakeEngine(),
      loadLanguage,
    });

    await engine.loadEngine();
    await engine.loadCodeLanguage('diff-js');

    expect(loadLanguage).toHaveBeenCalledWith('javascript');
  });

  it('skips languages Shiki handles without a grammar', async () => {
    const loadLanguage = vi.fn();

    const engine = await importEngine({
      loadEngine: async () => createFakeEngine(),
      loadLanguage,
    });

    await engine.loadEngine();

    expect(engine.isCodeLanguageLoaded('plaintext')).toBe(true);
    expect(engine.loadCodeLanguage('plaintext')).toBeUndefined();
    expect(loadLanguage).not.toHaveBeenCalled();
  });

  it('does not request an unsupported language', async () => {
    const loadLanguage = vi.fn();

    const engine = await importEngine({
      loadEngine: async () => createFakeEngine(),
      loadLanguage,
    });

    await engine.loadEngine();

    expect(engine.loadCodeLanguage('nonexistent')).toBeUndefined();
    expect(loadLanguage).not.toHaveBeenCalled();
  });

  it('survives a grammar that fails to download', async () => {
    const engine = await importEngine({
      loadEngine: async () => createFakeEngine(),
      loadLanguage: async () => {
        throw new Error('404');
      },
    });

    await engine.loadEngine();
    await expect(engine.loadCodeLanguage('javascript')).resolves.toBeUndefined();
    expect(engine.isCodeLanguageLoaded('javascript')).toBe(false);
  });

  it('serves a cached grammar without hitting the loader', async () => {
    const { getCachedPayload } = await import('./cache.js');

    vi.mocked(getCachedPayload).mockResolvedValueOnce([{ name: 'rust' }]);

    const loadLanguage = vi.fn();

    const engine = await importEngine({
      loadEngine: async () => createFakeEngine(),
      loadLanguage,
    });

    await engine.loadEngine();
    await engine.loadCodeLanguage('rust');

    expect(loadLanguage).not.toHaveBeenCalled();
    expect(engine.isCodeLanguageLoaded('rust')).toBe(true);
  });

  it('caches a grammar it had to fetch', async () => {
    const { cachePayload, getCachedPayload } = await import('./cache.js');

    vi.mocked(getCachedPayload).mockResolvedValue(undefined);

    const engine = await importEngine({
      loadEngine: async () => createFakeEngine(),
      loadLanguage: async () => ({ default: [{ name: 'rust' }] }),
    });

    await engine.loadEngine();
    await engine.loadCodeLanguage('rust');

    expect(cachePayload).toHaveBeenCalledWith('lang', 'rust', [{ name: 'rust' }]);
  });

  it('fetches a grammar once however many keystrokes ask during the load', async () => {
    const loadLanguage = vi.fn(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });

      return { default: [{ name: 'rust' }] };
    });

    const engine = await importEngine({
      loadEngine: async () => createFakeEngine(),
      loadLanguage,
    });

    await engine.loadEngine();

    // The transform fires per keystroke, so a burst of typing lands here mid-load
    await Promise.all(Array.from({ length: 10 }, () => engine.loadCodeLanguage('rust')));

    expect(loadLanguage).toHaveBeenCalledTimes(1);
    expect(engine.isCodeLanguageLoaded('rust')).toBe(true);
  });

  it('calls a waiting callback once, not once per caller', async () => {
    const engine = await importEngine({
      loadEngine: async () => createFakeEngine(),
      loadLanguage: async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 20);
        });

        return { default: [{ name: 'rust' }] };
      },
    });

    await engine.loadEngine();

    const onLoaded = vi.fn();

    await Promise.all(Array.from({ length: 10 }, () => engine.loadCodeLanguage('rust', onLoaded)));

    expect(onLoaded).toHaveBeenCalledTimes(1);
  });

  it('calls every distinct callback waiting on the same grammar', async () => {
    const engine = await importEngine({
      loadEngine: async () => createFakeEngine(),
      loadLanguage: async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 20);
        });

        return { default: [{ name: 'rust' }] };
      },
    });

    await engine.loadEngine();

    const first = vi.fn();
    const second = vi.fn();

    await Promise.all([
      engine.loadCodeLanguage('rust', first),
      engine.loadCodeLanguage('rust', second),
      engine.loadCodeLanguage('rust', second),
    ]);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('calls the callback even when the engine fails to load', async () => {
    const engine = await importEngine({
      loadEngine: async () => {
        throw new Error('offline');
      },
    });

    const onLoaded = vi.fn();

    await engine.loadEngine(onLoaded);

    expect(onLoaded).toHaveBeenCalledTimes(1);
  });

  it('starts a fresh attempt after an in-flight load has settled', async () => {
    const loadLanguage = vi.fn(async () => ({ default: [{ name: 'rust' }] }));

    const engine = await importEngine({
      loadEngine: async () => createFakeEngine(),
      loadLanguage,
    });

    await engine.loadEngine();
    await engine.loadCodeLanguage('rust');

    // Already loaded, so no second request
    expect(engine.loadCodeLanguage('rust')).toBeUndefined();
    expect(loadLanguage).toHaveBeenCalledTimes(1);
  });

  it('loads nothing when the loader yields no module', async () => {
    const engine = await importEngine({
      loadEngine: async () => createFakeEngine(),
      loadLanguage: async () => undefined,
    });

    await engine.loadEngine();
    await engine.loadCodeLanguage('rust');

    expect(engine.isCodeLanguageLoaded('rust')).toBe(false);
  });

  it('declines to produce markup before the engine has loaded', async () => {
    const engine = await importEngine({ loadEngine: async () => createFakeEngine() });

    // The preview renderer is synchronous, so it must get a definite answer rather than a promise
    expect(engine.highlightCodeToHTML('const a = 1', 'javascript')).toBeUndefined();
  });

  it('declines to produce tokens before the engine has loaded', async () => {
    const engine = await importEngine({ loadEngine: async () => createFakeEngine() });

    expect(engine.highlightCodeToTokens('# Title', 'markdown')).toBeUndefined();
  });

  it('loads a theme on demand and ignores an unknown one', async () => {
    const loadTheme = vi.fn(async () => ({ default: { name: 'github-dark' } }));

    const engine = await importEngine({
      loadEngine: async () => createFakeEngine(),
      loadTheme,
    });

    await engine.loadEngine();
    await engine.loadCodeTheme('github-dark');

    expect(loadTheme).toHaveBeenCalledWith('github-dark');
    expect(engine.isCodeThemeLoaded('github-dark')).toBe(true);

    loadTheme.mockClear();
    expect(engine.loadCodeTheme('nonexistent-theme')).toBeUndefined();
    expect(loadTheme).not.toHaveBeenCalled();
  });

  it('accepts a loader that returns the payload itself rather than a module', async () => {
    const { cachePayload } = await import('./cache.js');
    const payload = { name: 'github-dark' };

    const engine = await importEngine({
      loadEngine: async () => createFakeEngine(),
      // A consumer’s custom loader may hand over a bare registration, without a `default` export
      loadTheme: async () => payload,
    });

    await engine.loadEngine();
    await engine.loadCodeTheme('github-dark');

    expect(engine.isCodeThemeLoaded('github-dark')).toBe(true);
    expect(cachePayload).toHaveBeenCalledWith('theme', 'github-dark', payload);
  });

  it('loads no theme when the loader yields no module', async () => {
    const engine = await importEngine({
      loadEngine: async () => createFakeEngine(),
      loadTheme: async () => undefined,
    });

    await engine.loadEngine();
    await engine.loadCodeTheme('github-dark');

    expect(engine.isCodeThemeLoaded('github-dark')).toBe(false);
  });
});
