import { EMOJI_DATA } from './generated.js';

/**
 * @import { EmojiEntry } from '$lib/typedefs';
 */

/**
 * Regular expression that matches an emoji shortcode being typed at the end of a line, like `:smi`.
 * The colon must be at the beginning of the text or preceded by a whitespace or an opening bracket,
 * so a colon in the middle of a word, as in `https://` or `12:34`, doesn’t trigger the suggestions.
 * The query is bounded to keep a runaway line from being searched for, at a length that still
 * accommodates the longest published shortcode.
 */
export const EMOJI_TRIGGER_REGEX = /(?<=^|[\s([{"'«])(?::)(?<query>[a-zA-Z0-9_+-]{1,64})$/;

/**
 * Maximum number of emoji suggestions offered, matching what Discord shows. The dropdown displays
 * five at a time and scrolls through the rest, so this only bounds how far a query can be explored
 * — a single letter otherwise matches over a thousand emojis, all rendered on every keystroke.
 */
export const MAX_EMOJI_SUGGESTIONS = 50;

/**
 * Separator between the words of a shortcode. Most use an underscore, as in `party_popper`, but the
 * flags and the compound people use a hyphen, as in `flag-ca` and `man-woman-girl`.
 */
const WORD_SEPARATOR_REGEX = /[-_]/;
/**
 * Emoji list, parsed out of the data the first time it’s searched. This is `undefined` until then,
 * so a page that never sees a shortcode never pays for it.
 * @type {EmojiEntry[] | undefined}
 */
let emojiList;

/**
 * Convert the generated emoji data into a searchable list.
 * @internal
 * @param {string} data Emoji data, one line per emoji. See `generated.js` for the format.
 * @returns {EmojiEntry[]} Emoji list.
 */
export const parseEmojiData = (data) =>
  data.split('\n').map((line) => {
    const [emoji, shortcodes, keywords = ''] = line.split('\t');
    const [name, ...otherShortcodes] = shortcodes.split(' ');

    return {
      emoji,
      name,
      // The alternative shortcodes come first, because they’re what the user might type, while the
      // keywords merely describe the emoji
      aliases: [...otherShortcodes, ...(keywords ? keywords.split(' ') : [])],
    };
  });

/**
 * Rank given when there is no match at all. Higher than any real rank, so an unmatched emoji sorts
 * last and the ranks can still be compared arithmetically.
 */
export const NO_EMOJI_MATCH = 9;

/**
 * Get how well an emoji’s canonical shortcode matches the given query. A lower rank means a better
 * match.
 *
 * A match has to start at a word boundary. The shortcode is matched word by word rather than only
 * as a whole, so a partly typed `:polar` reaches `polar_bear` just as `:polar_bear` does, and the
 * whole shortcode is tested as well, so a query spanning a word boundary like `:polar_b` still
 * matches. What this rules out is a match starting mid-word, which is nearly always coincidental:
 * `:age` would otherwise turn up `mage`, `bagel`, `baggage`, `pager` and `package`.
 * @internal
 * @param {string} name Canonical shortcode.
 * @param {string} query Lower-cased search query without the leading colon.
 * @returns {number} Rank, or {@link NO_EMOJI_MATCH}.
 */
export const getEmojiNameMatchRank = (name, query) => {
  const words = name.split(WORD_SEPARATOR_REGEX);

  if (name === query) {
    return 0;
  }

  // What the shortcode leads with is what the emoji mostly is, so `heart_eyes` is a better `:heart`
  // match than `sparkling_heart`, where the word merely turns up along the way. The whole leading
  // word has to match: `japanese_castle` is not what `:japan` is after, nor `crystal_ball` `:cry`.
  if (name.startsWith(query) && WORD_SEPARATOR_REGEX.test(name.charAt(query.length))) {
    return 1;
  }

  if (words.includes(query)) {
    return 2;
  }

  // The whole shortcode is tested too, so a query spanning a word boundary like `:polar_b` matches
  if (name.startsWith(query) || words.some((word) => word.startsWith(query))) {
    return 4;
  }

  return NO_EMOJI_MATCH;
};

/**
 * Get how well an emoji’s alternative shortcodes and keywords match the given query. A lower rank
 * means a better match. The ranks interleave with {@link getEmojiNameMatchRank}’s: an exact keyword
 * sits between a whole word of the shortcode and a partial one.
 * @internal
 * @param {string[]} aliases Lower-cased alternative shortcodes and keywords.
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
 * Get how well an emoji matches the given query, as the best of its shortcode and keyword ranks
 * plus the shortcode rank on its own.
 *
 * The shortcode rank is kept so it can break ties, because the shortcode is what the emoji is
 * called while the keywords are merely associated with it. Many emojis share a keyword — `canada`
 * belongs to 🇨🇦 and 🍁 alike — and the one that also carries the query in its shortcode,
 * `flag-ca`, is the one the user is after.
 * @internal
 * @param {EmojiEntry} entry Emoji entry.
 * @param {string} query Lower-cased search query without the leading colon.
 * @returns {{ rank: number, nameRank: number }} Best rank and shortcode rank, either of which is
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
 * For a shortcode match, that’s how much of the shortcode the query accounts for: `red_heart` is
 * more of a `:heart` than `smiling_face_with_heart_eyes` is. For a keyword match, it’s how early
 * the keyword comes — the alternative shortcodes are listed first, then the words of the Unicode
 * name in the order it spells them out, which is roughly most to least defining.
 * @internal
 * @param {EmojiEntry} entry Emoji entry.
 * @param {string} query Lower-cased search query without the leading colon.
 * @returns {number} Centrality, comparable only between equally ranked emojis.
 */
const getMatchCentrality = ({ name, aliases }, query) => {
  if (getEmojiNameMatchRank(name, query) < NO_EMOJI_MATCH) {
    return name.split(WORD_SEPARATOR_REGEX).length;
  }

  const index = aliases.findIndex((alias) => alias === query || alias.startsWith(query));

  return (index > -1 ? index : aliases.length) * 100 + aliases.length;
};

/**
 * Search the emoji list for the given query.
 * @param {string} query Search query without the leading colon, e.g. `smi`.
 * @returns {EmojiEntry[]} Matching emojis, best match first, capped at
 * {@link MAX_EMOJI_SUGGESTIONS}.
 */
export const searchEmojis = (query) => {
  const normalizedQuery = query.toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  emojiList ??= parseEmojiData(EMOJI_DATA);

  return (
    emojiList
      .map((entry) => {
        const { rank, nameRank } = getEmojiMatchRank(entry, normalizedQuery);

        return { entry, rank, nameRank, centrality: getMatchCentrality(entry, normalizedQuery) };
      })
      .filter(({ rank }) => rank < NO_EMOJI_MATCH)
      // Equally ranked emojis are settled by the shortcode, then by how central the match is to the
      // emoji, then by the published order, which is the Unicode order — `Array.prototype.sort()`
      // is stable. That last resort roughly groups the like with the like, so a tie between two
      // country flags or two smileys at least comes out in a familiar order.
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
