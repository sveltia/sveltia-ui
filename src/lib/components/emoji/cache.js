import { IndexedDB } from '@sveltia/utils/storage';
import { EMOJILIB_VERSION } from './loader.js';

/**
 * @import { EmojiData } from '$lib/typedefs';
 */

/**
 * Client-side cache for the emoji data.
 *
 * The data is a few hundred kilobytes fetched from a CDN, and it never changes for a given version,
 * so it’s worth keeping locally rather than going back to the network on every page load. IndexedDB
 * is used rather than local storage because the payload is large enough to matter against the local
 * storage quota, and because writing it there would block the main thread.
 */

const DATABASE_NAME = 'sveltia-ui';
const STORE_NAME = 'emoji';
/** Key of the sole entry, scoped to the version the data came from. */
const KEY = `${EMOJILIB_VERSION}/data`;
/** @type {IndexedDB | undefined | null} `null` once the store is known to be unusable. */
let database;
/** @type {Promise<void> | undefined} */
let purgePromise;

/**
 * Get the store, or `null` when IndexedDB is unavailable, as in a server-side render or with
 * storage blocked.
 * @returns {IndexedDB | null} Store.
 */
const getDatabase = () => {
  if (database === undefined) {
    database = typeof indexedDB === 'undefined' ? null : new IndexedDB(DATABASE_NAME, STORE_NAME);
  }

  return database;
};

/**
 * Drop anything cached for a different version, once per session. A version bump changes the key,
 * so the old payload would otherwise linger forever.
 * @param {IndexedDB} db Store.
 * @returns {Promise<void>} Nothing.
 */
const purgeStaleVersions = async (db) => {
  purgePromise ??= (async () => {
    const stale = (await db.keys()).filter((key) => key !== KEY);

    if (stale.length) {
      await db.deleteEntries(stale);
    }
  })();

  return purgePromise;
};

/**
 * Read the cached emoji data.
 * @returns {Promise<EmojiData | undefined>} Cached data, or `undefined` when not cached or
 * unreadable.
 */
export const getCachedEmojiData = async () => {
  const db = getDatabase();

  if (!db) {
    return undefined;
  }

  try {
    await purgeStaleVersions(db);

    return await db.get(KEY);
  } catch {
    // A failed cache read just means fetching again
    return undefined;
  }
};

/**
 * Store the emoji data.
 * @param {EmojiData} data Emoji data.
 * @returns {Promise<void>} Nothing.
 */
export const cacheEmojiData = async (data) => {
  const db = getDatabase();

  if (!db) {
    return;
  }

  try {
    await db.set(KEY, data);
  } catch {
    // Out of quota or storage blocked: not worth failing over, the data is already in hand
  }
};
