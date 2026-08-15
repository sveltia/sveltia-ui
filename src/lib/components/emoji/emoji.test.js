import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  detectEmojiTrigger,
  getEmojiInsertText,
  getEmojiMatchRank,
  loadEmojiList,
  MAX_EMOJI_SUGGESTIONS,
  NO_EMOJI_MATCH,
  parseEmojiData,
  searchEmojis,
} from './emoji.js';
import { EMOJI_DATA } from './generated.js';

describe('detectEmojiTrigger', () => {
  it('should detect a shortcode at the beginning of the text', () => {
    expect(detectEmojiTrigger(':smi')).toBe('smi');
  });

  it('should detect a shortcode after a whitespace', () => {
    expect(detectEmojiTrigger('Hello :wav')).toBe('wav');
  });

  it('should detect a shortcode after an opening bracket', () => {
    expect(detectEmojiTrigger('(:tad')).toBe('tad');
  });

  it('should accept the characters used in shortcodes', () => {
    expect(detectEmojiTrigger(':thumbs_up')).toBe('thumbs_up');
    expect(detectEmojiTrigger(':+1')).toBe('+1');
    expect(detectEmojiTrigger(':flag-ca')).toBe('flag-ca');
  });

  it('should not detect a colon in the middle of a word', () => {
    expect(detectEmojiTrigger('https://exa')).toBeUndefined();
    expect(detectEmojiTrigger('12:30')).toBeUndefined();
  });

  it('should not detect a colon without a query', () => {
    expect(detectEmojiTrigger('Note: ')).toBeUndefined();
    expect(detectEmojiTrigger('Note:')).toBeUndefined();
  });

  it('should not detect a shortcode that is not right before the caret', () => {
    expect(detectEmojiTrigger(':smile is done')).toBeUndefined();
  });

  it('should not detect an emoticon', () => {
    expect(detectEmojiTrigger(':)')).toBeUndefined();
    expect(detectEmojiTrigger(':-(')).toBeUndefined();
  });

  it('should not detect an overly long query', () => {
    expect(detectEmojiTrigger(`:${'a'.repeat(65)}`)).toBeUndefined();
  });
});

describe('parseEmojiData', () => {
  it('should read the shortcode and the keywords out of a line', () => {
    expect(parseEmojiData('🎉\ttada\tparty popper')).toEqual([
      { emoji: '🎉', name: 'tada', aliases: ['party', 'popper'] },
    ]);
  });

  it('should list any alternative shortcodes ahead of the keywords', () => {
    // The alternatives are what the user might type; the keywords merely describe the emoji
    expect(parseEmojiData('👍\t+1 thumbsup\tsign')).toEqual([
      { emoji: '👍', name: '+1', aliases: ['thumbsup', 'sign'] },
    ]);
  });

  it('should accept a line without any keywords', () => {
    expect(parseEmojiData('🙏\tpray')).toEqual([{ emoji: '🙏', name: 'pray', aliases: [] }]);
  });

  it('should read every line', () => {
    expect(parseEmojiData('🎉\ttada\n🚀\trocket').map(({ emoji }) => emoji)).toEqual(['🎉', '🚀']);
  });
});

describe('EMOJI_DATA', () => {
  const entries = parseEmojiData(EMOJI_DATA);

  it('should carry the whole published set', () => {
    expect(entries.length).toBeGreaterThan(1800);
  });

  it('should only use shortcodes the user can type', () => {
    // A shortcode that doesn’t survive `EMOJI_TRIGGER_REGEX` could never be searched for, and
    // would be shown as something the user can’t type back
    const invalid = entries.filter(({ name }) => !detectEmojiTrigger(`:${name}`));

    expect(invalid).toEqual([]);
  });

  it('should not give two emojis the same shortcode', () => {
    const names = entries.map(({ name }) => name);

    expect(new Set(names).size).toBe(names.length);
  });

  it('should not repeat a shortcode among its own keywords', () => {
    const repeated = entries.filter(({ name, aliases }) => aliases.includes(name));

    expect(repeated).toEqual([]);
  });
});

describe('getEmojiInsertText', () => {
  it('should append a space, so the user can carry straight on typing', () => {
    expect(getEmojiInsertText('🎉', '')).toBe('🎉 ');
    expect(getEmojiInsertText('🎉', 'and more')).toBe('🎉 ');
  });

  it('should not append a space when the caret is already followed by one', () => {
    expect(getEmojiInsertText('🎉', ' and more')).toBe('🎉');
    expect(getEmojiInsertText('🎉', '\nnext line')).toBe('🎉');
  });
});

describe('getEmojiMatchRank', () => {
  /** @type {import('$lib/typedefs').EmojiEntry} */
  const entry = { emoji: '🎉', name: 'party_popper', aliases: ['tada', 'celebration'] };
  /**
   * Get the best rank for the given query.
   * @param {string} query Search query.
   * @returns {number} Rank.
   */
  const rank = (query) => getEmojiMatchRank(entry, query).rank;

  it('should rank an exact shortcode match first', () => {
    expect(rank('party_popper')).toBe(0);
  });

  it('should rank the leading word of the shortcode above any other word', () => {
    expect(rank('party')).toBe(1);
    expect(rank('popper')).toBe(2);
  });

  it('should rank the leading word of a hyphenated shortcode too', () => {
    // The flags and the compound people use a hyphen rather than an underscore
    expect(getEmojiMatchRank({ emoji: '🇨🇦', name: 'flag-ca', aliases: [] }, 'flag').rank).toBe(1);
  });

  it('should rank a whole word of the shortcode above an exact keyword match', () => {
    expect(rank('popper')).toBe(2);
    expect(rank('tada')).toBe(3);
  });

  it('should rank an exact keyword match above a prefix match', () => {
    expect(rank('tada')).toBe(3);
    expect(rank('party_p')).toBe(4);
    expect(rank('pop')).toBe(4);
  });

  it('should rank a shortcode prefix match above a keyword prefix match', () => {
    expect(rank('pop')).toBe(4);
    expect(rank('celeb')).toBe(5);
  });

  it('should not match part-way into a word', () => {
    // `arty` sits inside `party`, but a match has to start at a word boundary
    expect(rank('arty')).toBe(NO_EMOJI_MATCH);
    expect(rank('_popper')).toBe(NO_EMOJI_MATCH);
  });

  it('should report the shortcode rank separately, so it can break ties', () => {
    // The keyword is the better match, but the shortcode matches too and says so
    expect(getEmojiMatchRank(entry, 'party')).toEqual({ rank: 1, nameRank: 1 });
    expect(getEmojiMatchRank(entry, 'tada')).toEqual({ rank: 3, nameRank: NO_EMOJI_MATCH });
  });

  it('should not match an unrelated query', () => {
    expect(rank('rocket')).toBe(NO_EMOJI_MATCH);
  });
});

describe('searchEmojis', () => {
  beforeAll(async () => {
    await loadEmojiList();
  });

  it('should find an emoji by its shortcode', () => {
    expect(searchEmojis('rocket')[0].emoji).toBe('🚀');
    expect(searchEmojis('tada')[0].emoji).toBe('🎉');
  });

  it('should lead with the shortcode everyone else uses', () => {
    // The whole point of the `emoji-data` set: `:pray:` means here what it means on Slack
    expect(searchEmojis('pray')[0].emoji).toBe('🙏');
    expect(searchEmojis('heart')[0].emoji).toBe('❤️');
    expect(searchEmojis('smile')[0].emoji).toBe('😄');
    expect(searchEmojis('100')[0].emoji).toBe('💯');
    expect(searchEmojis('sob')[0].emoji).toBe('😭');
  });

  it('should find an emoji by an alternative shortcode', () => {
    // 👍 is published as `+1`, with `thumbsup` alongside it
    expect(searchEmojis('thumbsup')[0].emoji).toBe('👍');
    expect(searchEmojis('thumbsup')[0].name).toBe('+1');
    expect(searchEmojis('+1')[0].emoji).toBe('👍');
  });

  it('should find an emoji by a keyword taken from its Unicode name', () => {
    // 🇨🇦 is only published as `flag-ca`; `Canada Flag` is what says which country that is
    expect(searchEmojis('canada')[0].emoji).toBe('🇨🇦');
    expect(searchEmojis('france')[0].emoji).toBe('🇫🇷');
    expect(searchEmojis('moyai')[0].emoji).toBe('🗿');
  });

  it('should prefer a shortcode match over emojis that merely share the keyword', () => {
    // 🍁 carries `canada` as a keyword too, but only 🇨🇦 has `ca` in its shortcode
    expect(searchEmojis('cana')[0].emoji).toBe('🇨🇦');
    expect(searchEmojis('ca')[0].emoji).toBe('🇨🇦');
    expect(searchEmojis('cry')[0].emoji).toBe('😢');
  });

  it('should prefer the emoji whose shortcode leads with the query', () => {
    // ❤️ `heart` is exact, and the rest lead with the word before those that merely contain it
    expect(
      searchEmojis('heart')
        .slice(0, 4)
        .map(({ name }) => name),
    ).toEqual(['heart', 'heart_eyes', 'heart_decoration', 'heart_hands']);
    // …but only on a whole word: `crystal_ball` is not what `:cry` is after
    expect(searchEmojis('cry')[0].name).toBe('cry');
  });

  it('should not turn up coincidental matches from the middle of a word', () => {
    // `ant` sits inside `elephant` and `eggplant`, `ray` inside `crayon` and `prayer_beads`
    expect(searchEmojis('ant')[0].emoji).toBe('🐜');
    expect(searchEmojis('ant').map(({ emoji }) => emoji)).not.toContain('🐘');
    expect(searchEmojis('ray').map(({ emoji }) => emoji)).not.toContain('🖍️');
  });

  it('should find an emoji by a prefix', () => {
    expect(searchEmojis('polar')[0].emoji).toBe('🐻‍❄️');
    expect(searchEmojis('heart_h')[0].emoji).toBe('🫶');
  });

  it('should be case insensitive', () => {
    expect(searchEmojis('ROCKET')[0].emoji).toBe('🚀');
  });

  it('should cap the number of results', () => {
    // A single letter matches over a thousand emojis; the dropdown scrolls through the first few
    expect(searchEmojis('a').length).toBe(MAX_EMOJI_SUGGESTIONS);
    expect(searchEmojis('c').length).toBe(MAX_EMOJI_SUGGESTIONS);
  });

  it('should return nothing for an empty or unknown query', () => {
    expect(searchEmojis('')).toEqual([]);
    expect(searchEmojis('zzzzzzzz')).toEqual([]);
  });
});

describe('loadEmojiList', () => {
  /**
   * Load a fresh copy of the module, since it memoizes the list and the in-flight load.
   * @returns {Promise<any>} Module exports.
   */
  const loadModule = async () => {
    vi.resetModules();

    return import('./emoji.js');
  };

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.doUnmock('./generated.js');
    vi.restoreAllMocks();
  });

  it('should parse the data once, however many callers ask for it', async () => {
    const emoji = await loadModule();

    const [first, ...rest] = await Promise.all([
      emoji.loadEmojiList(),
      emoji.loadEmojiList(),
      emoji.loadEmojiList(),
    ]);

    rest.forEach((list) => expect(list).toBe(first));
  });

  it('should give back an empty list when the data can’t be obtained', async () => {
    vi.doMock('./generated.js', () => {
      throw new Error('chunk load failure');
    });

    const emoji = await loadModule();

    // No suggestions are ever shown; nothing is thrown at the caller
    expect(await emoji.loadEmojiList()).toEqual([]);
    expect(emoji.searchEmojis('tada')).toEqual([]);
    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenCalled();
  });

  it('should retry after a failure, so a hiccup isn’t permanent', async () => {
    let online = false;

    vi.doMock('./generated.js', () => {
      if (!online) {
        throw new Error('chunk load failure');
      }

      return { EMOJI_DATA: '🎉\ttada' };
    });

    const emoji = await loadModule();

    expect(await emoji.loadEmojiList()).toEqual([]);

    online = true;

    expect(await emoji.loadEmojiList()).toEqual([{ emoji: '🎉', name: 'tada', aliases: [] }]);
    expect(emoji.searchEmojis('tada')[0].emoji).toBe('🎉');
  });
});
