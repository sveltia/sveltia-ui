import { cacheEmojiData, getCachedEmojiData } from './cache.js';
import { getEmojiDataLoader } from './loader.js';

/**
 * @import { EmojiData, EmojiEntry } from '$lib/typedefs';
 */

/**
 * Regular expression that matches an emoji shortcode being typed at the end of a line, like `:smi`.
 * The colon must be at the beginning of the text or preceded by a whitespace or an opening bracket,
 * so a colon in the middle of a word, as in `https://` or `12:34`, doesn’t trigger the suggestions.
 */
export const EMOJI_TRIGGER_REGEX = /(?<=^|[\s([{"'«])(?::)(?<query>[a-zA-Z0-9_+-]{1,32})$/;

/**
 * Maximum number of emoji suggestions offered, matching what Discord shows. The dropdown displays
 * five at a time and scrolls through the rest, so this only bounds how far a query can be explored
 * — a single letter otherwise matches over a thousand emojis, all rendered on every keystroke.
 */
export const MAX_EMOJI_SUGGESTIONS = 50;

/**
 * Cached emoji list. This is `undefined` until {@link loadEmojiList} resolves for the first time.
 * @type {EmojiEntry[] | undefined}
 */
let emojiList;
/**
 * In-flight or completed loader for {@link emojiList}, so the data is only fetched once.
 * @type {Promise<EmojiEntry[]> | undefined}
 */
let loader;

/**
 * Rewrite an emoji name as a shortcode the user can actually type.
 *
 * Most names are already lower case words joined with underscores, but a hundred or so of the newer
 * ones are written with spaces or commas instead, like `heart hands`. A query can contain neither,
 * so those names would be unreachable by their own shortcode and would be shown as something the
 * user can’t type back.
 * @internal
 * @param {string} name Name as published.
 * @returns {string} Name made up of the characters a query can contain.
 */
export const normalizeEmojiName = (name) =>
  name
    .toLowerCase()
    // Runs of anything a query can’t contain become a single separator
    .replace(/[^a-z0-9_+-]+/g, '_')
    .replace(/^_+|_+$/g, '');

/**
 * Convert the raw emoji data into a searchable list.
 * @internal
 * @param {EmojiData} data Emoji data, keyed by emoji character, with each value listing the name
 * followed by any keywords.
 * @returns {EmojiEntry[]} Emoji list.
 */
export const parseEmojiData = (data) =>
  Object.entries(data).map(([emoji, [name, ...aliases]]) => ({
    emoji,
    name: normalizeEmojiName(name),
    // Some of the keywords are capitalized, e.g. `NASA` and `XD`
    aliases: aliases.map((alias) => alias.toLowerCase()),
  }));

/**
 * Load the emoji list, from the local cache if it’s there and from the CDN otherwise.
 *
 * The data is a few hundred kilobytes that most sessions never need, so it’s deliberately kept out
 * of the bundle. A failure here is not worth surfacing: no suggestions are ever shown, and the
 * shortcode the user typed stays as plain text.
 * @returns {Promise<EmojiEntry[]>} Emoji list, or an empty list if the data can’t be obtained.
 */
export const loadEmojiList = async () => {
  loader ??= (async () => {
    try {
      let data = await getCachedEmojiData();

      if (!data) {
        data = await getEmojiDataLoader()();
        // Don’t make the caller wait on the write
        cacheEmojiData(data);
      }

      emojiList = parseEmojiData(data);
    } catch (ex) {
      // Allow a later attempt to retry, so a transient network failure isn’t permanent
      loader = undefined;
      emojiList = [];
      // eslint-disable-next-line no-console
      console.error(ex);
    }

    return /** @type {EmojiEntry[]} */ (emojiList);
  })();

  return loader;
};

/**
 * Rank given when there is no match at all. Higher than any real rank, so an unmatched emoji sorts
 * last and the ranks can still be compared arithmetically.
 */
export const NO_EMOJI_MATCH = 9;

/**
 * Get how well an emoji’s name matches the given query. A lower rank means a better match.
 *
 * A match has to start at a word boundary. The name is matched word by word rather than only as a
 * whole, so a partly typed `:cana` reaches `flag_canada`’s second word just as `:canada` does, and
 * the whole name is tested as well, so a query spanning a word boundary like `:flag_can` still
 * matches. What this rules out is a match starting mid-word, which is nearly always coincidental:
 * `:age` would otherwise turn up `mage`, `bagel`, `baggage`, `pager` and `package`.
 * @internal
 * @param {string} name Canonical emoji name.
 * @param {string} query Lower-cased search query without the leading colon.
 * @returns {number} Rank, or {@link NO_EMOJI_MATCH}.
 */
export const getEmojiNameMatchRank = (name, query) => {
  const words = name.split('_');

  if (name === query) {
    return 0;
  }

  // What the name leads with is what the emoji mostly is, so `heart_hands` is a better `:heart`
  // match than `sparkling_heart`, where the word merely turns up along the way. The whole leading
  // word has to match: `japanese_castle` is not what `:japan` is after, nor `crystal_ball` `:cry`.
  if (name.startsWith(`${query}_`)) {
    return 1;
  }

  if (words.includes(query)) {
    return 2;
  }

  // The whole name is tested too, so a query spanning a word boundary like `:heart_h` still matches
  if (name.startsWith(query) || words.some((word) => word.startsWith(query))) {
    return 4;
  }

  return NO_EMOJI_MATCH;
};

/**
 * Get how well an emoji’s keywords match the given query. A lower rank means a better match. The
 * ranks interleave with {@link getEmojiNameMatchRank}’s: an exact keyword sits between a whole word
 * of the name and a partial one.
 * @internal
 * @param {string[]} aliases Lower-cased alternative keywords.
 * @param {string} query Lower-cased search query without the leading colon.
 * @returns {number} Rank, or {@link NO_EMOJI_MATCH}.
 */
export const getEmojiAliasMatchRank = (aliases, query) => {
  if (aliases.includes(query)) {
    return 3;
  }

  if (aliases.some((alias) => alias.startsWith(query))) {
    return 5;
  }

  return NO_EMOJI_MATCH;
};

/**
 * Get how well an emoji matches the given query, as the best of its name and keyword ranks plus the
 * name rank on its own.
 *
 * The name rank is kept so it can break ties, because the name is what the emoji actually depicts
 * while the keywords are merely associated with it. Many emojis share a keyword — `ca` and `canada`
 * belong to 🍁, 🇨🇦 and 🫎 alike — and the one that also carries the query in its name,
 * `flag_canada`, is the one the user is after.
 * @internal
 * @param {EmojiEntry} entry Emoji entry.
 * @param {string} query Lower-cased search query without the leading colon.
 * @returns {{ rank: number, nameRank: number }} Best rank and name rank, either of which is
 * {@link NO_EMOJI_MATCH} when there is nothing to match.
 */
export const getEmojiMatchRank = ({ name, aliases }, query) => {
  const nameRank = getEmojiNameMatchRank(name, query);
  const aliasRank = getEmojiAliasMatchRank(aliases, query);

  return { rank: Math.min(nameRank, aliasRank), nameRank };
};

/**
 * Get how central a match is to the emoji, to separate emojis that match equally well. A lower
 * number means the query is more of what the emoji is about.
 *
 * For a name match, that’s how much of the name the query accounts for: `red_heart` is more of a
 * `:heart` than `smiling_face_with_heart_eyes` is. For a keyword match, it’s how prominent the
 * keyword is — `emojilib` lists them roughly in order of relevance, so a keyword listed first, in a
 * short list, is what the emoji is really for. `love` is the first of 🫶’s three keywords, while
 * 💏 `kiss` buries it third among nineteen.
 * @internal
 * @param {EmojiEntry} entry Emoji entry.
 * @param {string} query Lower-cased search query without the leading colon.
 * @returns {number} Centrality, comparable only between equally ranked emojis.
 */
const getMatchCentrality = ({ name, aliases }, query) => {
  if (getEmojiNameMatchRank(name, query) < NO_EMOJI_MATCH) {
    return name.split('_').length;
  }

  const index = aliases.findIndex((alias) => alias === query || alias.startsWith(query));

  return (index > -1 ? index : aliases.length) * 100 + aliases.length;
};

/**
 * Search the loaded emoji list for the given query. This returns an empty list unless
 * {@link loadEmojiList} has been resolved beforehand.
 * @param {string} query Search query without the leading colon, e.g. `smi`.
 * @returns {EmojiEntry[]} Matching emojis, best match first, capped at
 * {@link MAX_EMOJI_SUGGESTIONS}.
 */
export const searchEmojis = (query) => {
  const normalizedQuery = query.toLowerCase();

  if (!emojiList || !normalizedQuery) {
    return [];
  }

  return (
    emojiList
      .map((entry) => {
        const { rank, nameRank } = getEmojiMatchRank(entry, normalizedQuery);

        return { entry, rank, nameRank, centrality: getMatchCentrality(entry, normalizedQuery) };
      })
      .filter(({ rank }) => rank < NO_EMOJI_MATCH)
      // Equally ranked emojis are settled by the name, then by how central the match is to the
      // emoji, then by the published order — `Array.prototype.sort()` is stable.
      //
      // That last resort is weak: the published order follows the Unicode categories, not how often
      // an emoji is used, and newer emojis are simply appended. 🫶 `heart_hands` sits at 1826, so
      // without the two keys before it, it loses every tie to whatever happens to be older.
      .sort((a, b) => a.rank - b.rank || a.nameRank - b.nameRank || a.centrality - b.centrality)
      .slice(0, MAX_EMOJI_SUGGESTIONS)
      .map(({ entry }) => entry)
  );
};

/**
 * Get the text to insert in place of a shortcode.
 *
 * A space follows the emoji, so the user can carry straight on typing the next word, the way it
 * works on GitHub, Slack and Discord. It’s left out when the caret is already followed by
 * whitespace, which would otherwise leave a double space behind.
 * @param {string} emoji Emoji character.
 * @param {string} textAfterCaret Text between the caret and the end of the line.
 * @returns {string} Text to insert.
 */
export const getEmojiInsertText = (emoji, textAfterCaret) =>
  /^\s/.test(textAfterCaret) ? emoji : `${emoji} `;

/**
 * Detect an emoji shortcode being typed right before the caret.
 * @param {string} textBeforeCaret Text between the beginning of the current text node and the
 * caret.
 * @returns {string | undefined} Query without the leading colon, or `undefined` if there is no
 * shortcode.
 */
export const detectEmojiTrigger = (textBeforeCaret) =>
  textBeforeCaret.match(EMOJI_TRIGGER_REGEX)?.groups?.query;
