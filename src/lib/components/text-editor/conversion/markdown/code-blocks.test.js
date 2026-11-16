import { describe, expect, it } from 'vitest';
import {
  findCodeBlocks,
  getCodeBlocks,
  mapLinesOutsideCodeBlocks,
  mapOutsideCodeBlocks,
  parseOpeningFence,
  splitLines,
  withLineCache,
} from './code-blocks.js';

describe('findCodeBlocks', () => {
  it('should find the fenced code blocks, closed by a bare fence at least as long', () => {
    expect(findCodeBlocks(['a', '````js', '```', '````', '~~~', 'b'])).toEqual([
      { start: 1, end: 3, fence: '````', closed: true },
      { start: 4, end: 5, fence: '~~~', closed: false },
    ]);
  });

  it('should find a code block in a list item, closed by a fence indented to its content', () => {
    expect(findCodeBlocks(['- ```', '  x', '  ```', '```', 'y', '```'])).toEqual([
      { start: 0, end: 2, fence: '```', closed: true },
      { start: 3, end: 5, fence: '```', closed: true },
    ]);
    expect(findCodeBlocks(['1. ~~~js', '   x', '', '   ~~~'])).toEqual([
      { start: 0, end: 3, fence: '~~~', closed: true },
    ]);
  });

  it('should end a code block in a list item with the item', () => {
    expect(findCodeBlocks(['- ```', '  x', '```', 'y'])).toEqual([
      { start: 0, end: 1, fence: '```', closed: false },
      { start: 2, end: 3, fence: '```', closed: false },
    ]);
  });

  it('should not take a backtick fence followed by a backtick as a code block', () => {
    expect(findCodeBlocks(['```a`', 'b'])).toEqual([]);
  });
});

describe('getCodeBlocks', () => {
  it('should find the code blocks once for the same array of lines', () => {
    const lines = ['```', 'a', '```'];
    const blocks = getCodeBlocks(lines);

    expect(blocks).toEqual(findCodeBlocks(lines));
    expect(getCodeBlocks(lines)).toBe(blocks);
    expect(getCodeBlocks([...lines])).not.toBe(blocks);
  });
});

describe('withLineCache', () => {
  it('splits the same string into the same lines only while it runs', () => {
    const value = 'a\n```\nb\n```';

    // Not cached outside
    expect(splitLines(value)).not.toBe(splitLines(value));

    const result = withLineCache(() => {
      const lines = splitLines(value);

      expect(splitLines(value)).toBe(lines);
      // Nested calls share the cache, which is kept until the outermost one is done
      expect(withLineCache(() => splitLines(value))).toBe(lines);
      expect(splitLines(value)).toBe(lines);

      return 'done';
    });

    expect(result).toBe('done');
    // Cleared afterwards, so the last document isn’t held in memory
    expect(splitLines(value)).not.toBe(splitLines(value));
  });

  it('clears the cache when a step throws', () => {
    const value = 'a\nb';

    expect(() =>
      withLineCache(() => {
        splitLines(value);
        throw new Error('failed');
      }),
    ).toThrow('failed');
    expect(splitLines(value)).not.toBe(splitLines(value));
  });
});

describe('parseOpeningFence', () => {
  it('should parse the fence, the language and the metadata', () => {
    expect(parseOpeningFence('  ```js title="a b"  ')).toMatchObject({
      indent: '  ',
      fence: '```',
      info: 'js title="a b"  ',
      language: 'js',
      meta: 'title="a b"',
    });
    expect(parseOpeningFence('~~~~ c++ {1,3}')).toMatchObject({
      indent: '',
      fence: '~~~~',
      info: ' c++ {1,3}',
      language: 'c++',
      meta: '{1,3}',
    });
  });

  it('should read the language up to whitespace or a backtick', () => {
    expect(parseOpeningFence('~~~c#`x`')).toMatchObject({ language: 'c#', meta: '`x`' });
  });

  it('should leave out the language and the metadata if the info string isn’t a word', () => {
    expect(parseOpeningFence('``` {.js}')).toMatchObject({ language: undefined, meta: '' });
    expect(parseOpeningFence('```')).toMatchObject({ info: '', language: undefined, meta: '' });
  });

  it('should give a match Lexical’s code block transformer can take', () => {
    const match = parseOpeningFence('\t```js  x')?.match;

    expect([match?.[0], match?.[1], match?.[2], match?.index]).toEqual([
      '\t```js  ',
      '\t```',
      'js',
      0,
    ]);
  });

  it('should not parse a line that doesn’t start with a fence', () => {
    expect(parseOpeningFence('``')).toBeUndefined();
    expect(parseOpeningFence('- ```js')).toBeUndefined();
    expect(parseOpeningFence('```js`')).toBeUndefined();
  });
});

describe('mapOutsideCodeBlocks', () => {
  it('should process the parts outside code blocks, with the line breaks around them', () => {
    /** @type {string[]} */
    const parts = [];

    expect(
      mapOutsideCodeBlocks('a\n```\nb\n```\nc', (part) => {
        parts.push(part);

        return part.toUpperCase();
      }),
    ).toBe('A\n```\nb\n```\nC');
    expect(parts).toEqual(['a\n', '\nc']);
  });
});

describe('mapLinesOutsideCodeBlocks', () => {
  it('should process each line outside code blocks', () => {
    expect(mapLinesOutsideCodeBlocks('a\n~~~\nb\n~~~\nc', (line) => `${line}!`)).toBe(
      'a!\n~~~\nb\n~~~\nc!',
    );
  });
});
