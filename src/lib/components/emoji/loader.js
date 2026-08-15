import { version as EMOJILIB_VERSION } from 'emojilib/package.json';

/**
 * @import { EmojiData } from '$lib/typedefs';
 */

const CDN_BASE_URL = 'https://unpkg.com/emojilib';
/**
 * How long to wait for the emoji data, in milliseconds. The suggestions are a convenience, so a
 * slow or unreachable CDN should never leave a request hanging around.
 */
const FETCH_TIMEOUT = 5000;

/**
 * Get the URL of the emoji data.
 *
 * The data is fetched rather than bundled because it’s a few hundred kilobytes that most sessions
 * never need, and a single-file bundle — our main consumer, Sveltia CMS — would otherwise inline it
 * wholesale. The version comes from the installed `emojilib`, so the URL always matches the
 * package this was developed against.
 * @returns {string} URL.
 */
export const getEmojiDataURL = () => `${CDN_BASE_URL}@${EMOJILIB_VERSION}/dist/emoji-en-US.json`;

/**
 * Version of the emoji data, used to scope the cache so a bump invalidates it.
 */
export { EMOJILIB_VERSION };

/**
 * Fetch the emoji data from the CDN.
 * @returns {Promise<EmojiData>} Emoji data, keyed by emoji character.
 * @throws {Error} When the request fails, times out or returns a non-OK response.
 */
const loadEmojiData = async () => {
  const response = await fetch(getEmojiDataURL(), {
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  if (!response.ok) {
    throw new Error(`Failed to load emoji data: ${response.status}`);
  }

  return response.json();
};

/**
 * Loader in effect.
 * @type {() => Promise<EmojiData>}
 */
let loader = loadEmojiData;

/**
 * Override how the emoji suggestions obtain their data.
 *
 * By default the data is fetched from a CDN and cached locally, which keeps it out of the
 * consumer’s bundle. Consumers who would rather bundle it, self-host it, or run without any
 * outbound requests at all can replace the loader.
 *
 * ```js
 * setEmojiDataLoader(async () => (await import('emojilib')).default);
 * ```
 * @param {() => Promise<EmojiData>} newLoader Loader returning the emoji data, keyed by emoji
 * character, with each value listing the name followed by any keywords.
 */
export const setEmojiDataLoader = (newLoader) => {
  loader = newLoader;
};

/**
 * Get the loader currently in effect.
 * @returns {() => Promise<EmojiData>} Active loader.
 */
export const getEmojiDataLoader = () => loader;
