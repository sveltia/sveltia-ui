import { IndexedDB } from '@sveltia/utils/storage';
import { SHIKI_VERSION } from './generated.js';

/**
 * Client-side cache for Shiki grammars and themes.
 *
 * Grammars and themes resolve to plain data, so they can be stored and replayed without going back
 * to the network. That saves more than bytes: a grammar references its embedded languages by
 * relative path, so loading Vue or Svelte fans out to several requests, and a cache hit collapses
 * all of them into one read.
 *
 * The engine is deliberately not cached here. It is executable code, so replaying it from storage
 * would mean importing a `blob:` URL, which needs `script-src blob:` in the page’s CSP. It also
 * gains nothing, because it is fetched from a version-immutable URL that the browser’s HTTP cache
 * already keeps.
 */

const DATABASE_NAME = 'sveltia-ui';
const STORE_NAME = 'shiki';
/** @type {IndexedDB | undefined | null} `null` once the store is known to be unusable. */
let database;
/** @type {Promise<void> | undefined} */
let purgePromise;
let enabled = true;

/**
 * Enable or disable the cache.
 *
 * Worth turning off when the grammars are bundled with the app rather than fetched, since reading
 * them back from storage is then slower than the bundled import it replaces.
 * @param {boolean} value Whether to use the cache.
 */
export const setCodeHighlighterCacheEnabled = (value) => {
  enabled = value;
};

/**
 * Build the cache key for a payload.
 * @param {string} kind Payload kind, either `lang` or `theme`.
 * @param {string} id Language or theme ID.
 * @returns {string} Key, scoped to the Shiki version the payload came from.
 */
const getKey = (kind, id) => `${SHIKI_VERSION}/${kind}/${id}`;

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
 * Drop anything cached for a different Shiki version, once per session. A version bump changes
 * every key, so the old payloads would otherwise linger forever.
 * @param {IndexedDB} db Store.
 * @returns {Promise<void>} Nothing.
 */
const purgeStaleVersions = async (db) => {
  purgePromise ??= (async () => {
    const stale = (await db.keys()).filter(
      (key) => typeof key === 'string' && !key.startsWith(`${SHIKI_VERSION}/`),
    );

    if (stale.length) {
      await db.deleteEntries(stale);
    }
  })();

  return purgePromise;
};

/**
 * Read a cached grammar or theme.
 * @param {string} kind Payload kind, either `lang` or `theme`.
 * @param {string} id Language or theme ID.
 * @returns {Promise<any>} Cached payload, or `undefined` when not cached or unreadable.
 */
export const getCachedPayload = async (kind, id) => {
  const db = enabled ? getDatabase() : null;

  if (!db) {
    return undefined;
  }

  try {
    await purgeStaleVersions(db);

    return await db.get(getKey(kind, id));
  } catch {
    // A failed cache read must never stop a code block from highlighting
    return undefined;
  }
};

/**
 * Store a grammar or theme.
 * @param {string} kind Payload kind, either `lang` or `theme`.
 * @param {string} id Language or theme ID.
 * @param {any} payload Payload to store. Must be structured-cloneable, which grammars and themes
 * are, being plain data.
 * @returns {Promise<void>} Nothing.
 */
export const cachePayload = async (kind, id, payload) => {
  const db = enabled ? getDatabase() : null;

  if (!db) {
    return;
  }

  try {
    await db.set(getKey(kind, id), payload);
  } catch {
    // Out of quota, storage blocked, or a payload that won’t clone: not worth failing over
  }
};
