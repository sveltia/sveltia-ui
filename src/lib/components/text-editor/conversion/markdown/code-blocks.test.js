import { describe, expect, it } from 'vitest';
import { findCodeBlocks, mapLinesOutsideCodeBlocks, mapOutsideCodeBlocks } from './code-blocks.js';

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
