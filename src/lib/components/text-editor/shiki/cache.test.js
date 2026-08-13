/* eslint-disable jsdoc/require-description */
/* eslint-disable jsdoc/require-jsdoc */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SHIKI_VERSION } from './generated.js';

const store = vi.hoisted(() => ({
  /** @type {Map<any, any>} */ data: new Map(),
  /** @type {any} */ instance: null,
  constructorArgs: /** @type {any[]} */ ([]),
  failOn: /** @type {string | null} */ (null),
}));

vi.mock('@sveltia/utils/storage', () => ({
  IndexedDB: class {
    /**
     * @param {string} databaseName Database name.
     * @param {string} storeName Store name.
     */
    constructor(databaseName, storeName) {
      store.constructorArgs.push([databaseName, storeName]);
      store.instance = this;
    }

    /**
     * @param {any} key Key.
     * @returns {Promise<any>} Value.
     */
    async get(key) {
      if (store.failOn === 'get') {
        throw new Error('storage blocked');
      }

      return store.data.get(key);
    }

    /**
     * @param {any} key Key.
     * @param {any} value Value.
     * @returns {Promise<any>} Key.
     */
    async set(key, value) {
      if (store.failOn === 'set') {
        throw new Error('quota exceeded');
      }

      store.data.set(key, value);

      return key;
    }

    /**
     * @returns {Promise<any[]>} Keys.
     */
    async keys() {
      return [...store.data.keys()];
    }

    /**
     * @param {any[]} keys Keys.
     * @returns {Promise<void>} Nothing.
     */
    async deleteEntries(keys) {
      keys.forEach((key) => store.data.delete(key));
    }
  },
}));

/**
 * Import a fresh copy of the cache, which keeps the store in module state.
 * @returns {Promise<any>} Freshly imported cache module.
 */
const importCache = async () => {
  vi.resetModules();

  return import('./cache.js');
};

describe('shiki cache', () => {
  beforeEach(() => {
    store.data.clear();
    store.constructorArgs = [];
    store.failOn = null;
    vi.unstubAllGlobals();
    vi.stubGlobal('indexedDB', {});
  });

  it('scopes keys by Shiki version, kind and ID', async () => {
    const { cachePayload } = await importCache();

    await cachePayload('lang', 'rust', [{ name: 'rust' }]);

    expect([...store.data.keys()]).toEqual([`${SHIKI_VERSION}/lang/rust`]);
  });

  it('round-trips a payload', async () => {
    const { cachePayload, getCachedPayload } = await importCache();
    const grammar = [{ name: 'rust', patterns: [] }];

    await cachePayload('lang', 'rust', grammar);

    expect(await getCachedPayload('lang', 'rust')).toEqual(grammar);
  });

  it('keeps grammars and themes with the same ID apart', async () => {
    const { cachePayload, getCachedPayload } = await importCache();

    await cachePayload('lang', 'x', 'grammar');
    await cachePayload('theme', 'x', 'theme');

    expect(await getCachedPayload('lang', 'x')).toBe('grammar');
    expect(await getCachedPayload('theme', 'x')).toBe('theme');
  });

  it('misses for something never cached', async () => {
    const { getCachedPayload } = await importCache();

    expect(await getCachedPayload('lang', 'rust')).toBeUndefined();
  });

  it('drops payloads left over from another Shiki version', async () => {
    store.data.set('0.0.1/lang/rust', ['stale']);
    store.data.set('0.0.1/theme/github-light', ['stale']);
    store.data.set(`${SHIKI_VERSION}/lang/go`, ['current']);

    const { getCachedPayload } = await importCache();

    await getCachedPayload('lang', 'go');

    expect([...store.data.keys()]).toEqual([`${SHIKI_VERSION}/lang/go`]);
  });

  it('purges only once per session', async () => {
    const { getCachedPayload } = await importCache();

    await getCachedPayload('lang', 'a');
    store.data.set('0.0.1/lang/stale', ['stale']);
    await getCachedPayload('lang', 'b');

    // The second read does not re-run the purge, so the newly added stale key survives
    expect(store.data.has('0.0.1/lang/stale')).toBe(true);
  });

  it('opens a single database and store', async () => {
    const { cachePayload, getCachedPayload } = await importCache();

    await cachePayload('lang', 'a', 1);
    await getCachedPayload('lang', 'a');

    expect(store.constructorArgs).toHaveLength(1);
    expect(store.constructorArgs[0]).toEqual(['sveltia-ui', 'shiki']);
  });

  it('degrades to a miss where IndexedDB is unavailable', async () => {
    vi.stubGlobal('indexedDB', undefined);

    const { cachePayload, getCachedPayload } = await importCache();

    await expect(cachePayload('lang', 'rust', ['x'])).resolves.toBeUndefined();
    expect(await getCachedPayload('lang', 'rust')).toBeUndefined();
    expect(store.constructorArgs).toHaveLength(0);
  });

  it('degrades to a miss when reading throws', async () => {
    const { getCachedPayload } = await importCache();

    store.failOn = 'get';

    expect(await getCachedPayload('lang', 'rust')).toBeUndefined();
  });

  it('swallows a failed write', async () => {
    const { cachePayload } = await importCache();

    store.failOn = 'set';

    await expect(cachePayload('lang', 'rust', ['x'])).resolves.toBeUndefined();
  });

  it('bypasses storage entirely once disabled', async () => {
    const { cachePayload, getCachedPayload, setCodeHighlighterCacheEnabled } = await importCache();

    setCodeHighlighterCacheEnabled(false);

    await cachePayload('lang', 'rust', ['x']);

    expect(store.data.size).toBe(0);
    expect(await getCachedPayload('lang', 'rust')).toBeUndefined();
    expect(store.constructorArgs).toHaveLength(0);
  });
});
