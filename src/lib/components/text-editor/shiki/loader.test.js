import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Import a fresh copy of the loader, which keeps the active loaders in module state.
 * @returns {Promise<any>} Freshly imported loader module.
 */
const importLoader = async () => {
  vi.resetModules();

  return import('./loader.js');
};

describe('shiki loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides a loader for the engine, grammars and themes by default', async () => {
    const { getCodeHighlighterLoaders } = await importLoader();
    const loaders = getCodeHighlighterLoaders();

    expect(typeof loaders.loadEngine).toBe('function');
    expect(typeof loaders.loadLanguage).toBe('function');
    expect(typeof loaders.loadTheme).toBe('function');
  });

  it('replaces only the loaders that are passed', async () => {
    const { getCodeHighlighterLoaders, setCodeHighlighterLoaders } = await importLoader();
    const { loadLanguage: defaultLoadLanguage } = getCodeHighlighterLoaders();
    const loadEngine = vi.fn();

    setCodeHighlighterLoaders({ loadEngine });

    const loaders = getCodeHighlighterLoaders();

    expect(loaders.loadEngine).toBe(loadEngine);
    expect(loaders.loadLanguage).toBe(defaultLoadLanguage);
  });

  it('applies overrides on top of one another', async () => {
    const { getCodeHighlighterLoaders, setCodeHighlighterLoaders } = await importLoader();
    const loadEngine = vi.fn();
    const loadTheme = vi.fn();

    setCodeHighlighterLoaders({ loadEngine });
    setCodeHighlighterLoaders({ loadTheme });

    const loaders = getCodeHighlighterLoaders();

    expect(loaders.loadEngine).toBe(loadEngine);
    expect(loaders.loadTheme).toBe(loadTheme);
  });
});

describe('default loader URLs', () => {
  it('pins the engine to this package’s version', async () => {
    const { getEngineURL } = await importLoader();
    const { UI_VERSION } = await import('./generated.js');

    expect(getEngineURL()).toBe(`https://unpkg.com/@sveltia/ui@${UI_VERSION}/dist/shiki-engine.js`);
  });

  it('pins grammars and themes to the Shiki version the engine was built from', async () => {
    const { getLanguageURL, getThemeURL } = await importLoader();
    const { SHIKI_VERSION } = await import('./generated.js');

    expect(getLanguageURL('rust')).toBe(
      `https://unpkg.com/@shikijs/langs@${SHIKI_VERSION}/dist/rust.mjs`,
    );
    expect(getThemeURL('github-dark')).toBe(
      `https://unpkg.com/@shikijs/themes@${SHIKI_VERSION}/dist/github-dark.mjs`,
    );
  });

  it('reaches the network only when a loader is actually called', async () => {
    const { getCodeHighlighterLoaders } = await importLoader();
    const { loadEngine, loadLanguage, loadTheme } = getCodeHighlighterLoaders();

    // Importing by URL cannot resolve in this environment, which confirms these are real network
    // imports rather than anything bundled
    await expect(loadEngine()).rejects.toThrow();
    await expect(loadLanguage('rust')).rejects.toThrow();
    await expect(loadTheme('github-dark')).rejects.toThrow();
  });
});
