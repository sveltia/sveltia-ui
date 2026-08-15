import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Stand-in for `@sveltia/utils/storage`’s `IndexedDB`, backed by a plain map. The real one is a
 * thin wrapper over the browser API, which the test environment doesn’t provide.
 */
class FakeIndexedDB {
  /**
   * Everything written to the store.
   * @type {Map<any, any>}
   */
  static store = new Map();

  /**
   * Every operation performed, in order.
   * @type {string[]}
   */
  static calls = [];

  /**
   * Error thrown by every operation, when the test has asked for one.
   * @type {Error | undefined}
   */
  static failure = undefined;

  /**
   * Reset the shared state between tests.
   */
  static reset() {
    FakeIndexedDB.store = new Map();
    FakeIndexedDB.calls = [];
    FakeIndexedDB.failure = undefined;
  }

  /**
   * Record the database and store the cache asked for.
   * @param {string} databaseName Database name.
   * @param {string} storeName Store name.
   */
  constructor(databaseName, storeName) {
    FakeIndexedDB.calls.push(`new:${databaseName}/${storeName}`);
  }

  /**
   * Fail when the test has asked every operation to fail.
   * @throws {Error} The configured failure.
   */
  #check() {
    if (FakeIndexedDB.failure) {
      throw FakeIndexedDB.failure;
    }
  }

  /**
   * Read an entry.
   * @param {any} key Key.
   * @returns {Promise<any>} Value.
   */
  async get(key) {
    FakeIndexedDB.calls.push(`get:${key}`);
    this.#check();

    return FakeIndexedDB.store.get(key);
  }

  /**
   * Write an entry.
   * @param {any} key Key.
   * @param {any} value Value.
   * @returns {Promise<void>} Nothing.
   */
  async set(key, value) {
    FakeIndexedDB.calls.push(`set:${key}`);
    this.#check();
    FakeIndexedDB.store.set(key, value);
  }

  /**
   * List every key.
   * @returns {Promise<any[]>} Keys.
   */
  async keys() {
    FakeIndexedDB.calls.push('keys');
    this.#check();

    return [...FakeIndexedDB.store.keys()];
  }

  /**
   * Delete entries.
   * @param {any[]} keys Keys to delete.
   * @returns {Promise<void>} Nothing.
   */
  async deleteEntries(keys) {
    FakeIndexedDB.calls.push(`deleteEntries:${keys.join(',')}`);
    this.#check();
    keys.forEach((key) => FakeIndexedDB.store.delete(key));
  }
}

vi.mock('@sveltia/utils/storage', () => ({ IndexedDB: FakeIndexedDB }));

/**
 * Load a fresh copy of the module, since it memoizes both the store and the purge.
 * @returns {Promise<any>} Module exports, plus the version the cache is keyed by.
 */
const loadCache = async () => {
  vi.resetModules();

  const cache = await import('./cache.js');
  const { EMOJILIB_VERSION } = await import('./loader.js');

  return { ...cache, key: `${EMOJILIB_VERSION}/data` };
};

describe('emoji cache', () => {
  beforeEach(() => {
    FakeIndexedDB.reset();
    // The test environment has no IndexedDB, so the cache would otherwise disable itself
    vi.stubGlobal('indexedDB', {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should round-trip the data through its own store', async () => {
    const { cacheEmojiData, getCachedEmojiData, key } = await loadCache();
    const data = { '🎉': ['party_popper'] };

    await cacheEmojiData(data);

    expect(FakeIndexedDB.calls).toContain('new:sveltia-ui/emoji');
    expect(FakeIndexedDB.store.get(key)).toBe(data);
    expect(await getCachedEmojiData()).toBe(data);
  });

  it('should report nothing when the data has not been cached', async () => {
    const { getCachedEmojiData } = await loadCache();

    expect(await getCachedEmojiData()).toBeUndefined();
  });

  it('should drop entries left over from another version', async () => {
    const { getCachedEmojiData, key } = await loadCache();

    FakeIndexedDB.store.set('0.0.1/data', { stale: true });
    FakeIndexedDB.store.set(key, { current: true });

    expect(await getCachedEmojiData()).toEqual({ current: true });
    expect([...FakeIndexedDB.store.keys()]).toEqual([key]);
  });

  it('should only purge once per session, however often it reads', async () => {
    const { getCachedEmojiData } = await loadCache();

    await getCachedEmojiData();
    await getCachedEmojiData();
    await getCachedEmojiData();

    expect(FakeIndexedDB.calls.filter((call) => call === 'keys')).toHaveLength(1);
  });

  it('should report nothing rather than throw when the store is unreadable', async () => {
    const { getCachedEmojiData } = await loadCache();

    FakeIndexedDB.failure = new Error('storage blocked');

    expect(await getCachedEmojiData()).toBeUndefined();
  });

  it('should swallow a failed write, since the data is already in hand', async () => {
    const { cacheEmojiData } = await loadCache();

    FakeIndexedDB.failure = new Error('quota exceeded');

    await expect(cacheEmojiData({ '🎉': ['party_popper'] })).resolves.toBeUndefined();
  });

  it('should do nothing at all where IndexedDB is unavailable, as in a server-side render', async () => {
    vi.stubGlobal('indexedDB', undefined);

    const { cacheEmojiData, getCachedEmojiData } = await loadCache();

    await cacheEmojiData({ '🎉': ['party_popper'] });

    expect(await getCachedEmojiData()).toBeUndefined();
    expect(FakeIndexedDB.calls).toEqual([]);
  });
});
