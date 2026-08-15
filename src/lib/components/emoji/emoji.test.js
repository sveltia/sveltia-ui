import emojilib from 'emojilib';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  detectEmojiTrigger,
  getEmojiInsertText,
  getEmojiMatchRank,
  loadEmojiList,
  MAX_EMOJI_SUGGESTIONS,
  NO_EMOJI_MATCH,
  searchEmojis,
} from './emoji.js';
import { setEmojiDataLoader } from './loader.js';

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
    expect(detectEmojiTrigger(':e-mail')).toBe('e-mail');
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
    expect(detectEmojiTrigger(`:${'a'.repeat(33)}`)).toBeUndefined();
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
  const entry = { emoji: '🎉', name: 'party_popper', aliases: ['party', 'tada', 'celebration'] };
  /**
   * Get the best rank for the given query.
   * @param {string} query Search query.
   * @returns {number} Rank.
   */
  const rank = (query) => getEmojiMatchRank(entry, query).rank;

  it('should rank an exact name match first', () => {
    expect(rank('party_popper')).toBe(0);
  });

  it('should rank a whole word of the name above an exact alias match', () => {
    expect(rank('popper')).toBe(1);
    expect(rank('tada')).toBe(2);
  });

  it('should rank an exact alias match above a name prefix match', () => {
    expect(rank('tada')).toBe(2);
    expect(rank('party_p')).toBe(3);
  });

  it('should rank a prefix of any word of the name above an alias prefix match', () => {
    expect(rank('pop')).toBe(3);
    expect(rank('celeb')).toBe(4);
  });

  it('should rank an alias prefix match above a name substring match', () => {
    expect(rank('celeb')).toBe(4);
    expect(rank('arty')).toBe(5);
  });

  it('should report the name rank separately, so it can break ties', () => {
    // The keyword is the better match, but the name matches too and says so
    expect(getEmojiMatchRank(entry, 'party')).toEqual({ rank: 1, nameRank: 1 });
    expect(getEmojiMatchRank(entry, 'tada')).toEqual({ rank: 2, nameRank: NO_EMOJI_MATCH });
  });

  it('should not match an unrelated query', () => {
    expect(rank('rocket')).toBe(NO_EMOJI_MATCH);
  });
});

describe('searchEmojis', () => {
  beforeAll(async () => {
    // Serve the real data locally rather than reaching for the CDN
    setEmojiDataLoader(async () => emojilib);
    await loadEmojiList();
  });

  it('should find an emoji by its name', () => {
    expect(searchEmojis('rocket')[0].emoji).toBe('🚀');
  });

  it('should find an emoji by an alias', () => {
    expect(searchEmojis('tada')[0].emoji).toBe('🎉');
  });

  it('should prefer a name match over emojis that merely share the keyword', () => {
    // 🍁 and 🫎 both carry `canada` as a keyword, but only 🇨🇦 has it in its name
    expect(searchEmojis('canada')[0].emoji).toBe('🇨🇦');
    expect(searchEmojis('japan')[0].name).toContain('japan');
    expect(searchEmojis('moon')[0].name).toContain('moon');
  });

  it('should prefer a name match while the query is still being typed', () => {
    expect(searchEmojis('cana')[0].emoji).toBe('🇨🇦');
    expect(searchEmojis('canad')[0].emoji).toBe('🇨🇦');
    expect(searchEmojis('fran')[0].emoji).toBe('🇫🇷');
  });

  it('should let the name break a tie between equally good keyword matches', () => {
    // `ca` is an exact keyword of both 🍁 and 🇨🇦, but only 🇨🇦 has it in its name as well
    expect(searchEmojis('ca')[0].emoji).toBe('🇨🇦');
    expect(searchEmojis('cry')[0].name).toContain('cry');
    expect(searchEmojis('music')[0].name).toContain('music');
  });

  it('should find an emoji by a prefix', () => {
    expect(searchEmojis('thumbs_u')[0].emoji).toBe('👍');
  });

  it('should be case insensitive', () => {
    expect(searchEmojis('ROCKET')[0].emoji).toBe('🚀');
  });

  it('should cap the number of results', () => {
    expect(searchEmojis('a').length).toBe(MAX_EMOJI_SUGGESTIONS);
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

    return { ...(await import('./emoji.js')), loader: await import('./loader.js') };
  };

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should load the data once, however many callers ask for it', async () => {
    const emoji = await loadModule();
    const load = vi.fn(async () => emojilib);

    emoji.loader.setEmojiDataLoader(load);
    await Promise.all([emoji.loadEmojiList(), emoji.loadEmojiList(), emoji.loadEmojiList()]);

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('should serve the cached data without going to the loader', async () => {
    const cached = { '\u{1F389}': ['party_popper', 'tada'] };

    vi.doMock('./cache.js', () => ({
      getCachedEmojiData: vi.fn(async () => cached),
      cacheEmojiData: vi.fn(async () => undefined),
    }));

    const emoji = await loadModule();
    const load = vi.fn(async () => emojilib);

    emoji.loader.setEmojiDataLoader(load);

    expect(await emoji.loadEmojiList()).toEqual([
      { emoji: '\u{1F389}', name: 'party_popper', aliases: ['tada'] },
    ]);
    expect(load).not.toHaveBeenCalled();
    vi.doUnmock('./cache.js');
  });

  it('should give back an empty list when the data can’t be obtained', async () => {
    const emoji = await loadModule();

    emoji.loader.setEmojiDataLoader(async () => {
      throw new Error('offline');
    });

    // No suggestions are ever shown; nothing is thrown at the caller
    expect(await emoji.loadEmojiList()).toEqual([]);
    expect(emoji.searchEmojis('tada')).toEqual([]);
    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenCalled();
  });

  it('should retry after a failure, so an outage isn’t permanent', async () => {
    const emoji = await loadModule();
    let online = false;

    emoji.loader.setEmojiDataLoader(async () => {
      if (!online) {
        throw new Error('offline');
      }

      return emojilib;
    });

    expect(await emoji.loadEmojiList()).toEqual([]);

    online = true;

    expect((await emoji.loadEmojiList()).length).toBeGreaterThan(0);
    expect(emoji.searchEmojis('tada')[0].emoji).toBe('🎉');
  });
});
