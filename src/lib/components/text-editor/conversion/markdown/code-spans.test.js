import { describe, expect, it } from 'vitest';
import { findCodeSpans } from './code-spans.js';

describe('findCodeSpans', () => {
  it('should find the code spans, each closed by a run of as many backticks', () => {
    expect(findCodeSpans('a `b` c ``d ` e`` f')).toEqual([
      { start: 2, end: 5, fenceLength: 1 },
      { start: 8, end: 17, fenceLength: 2 },
    ]);
  });

  it('should not take the closing backtick of a code span as the opening one of another', () => {
    expect(findCodeSpans('| `**a**` | b |\n| `*c*` | d |')).toEqual([
      { start: 2, end: 9, fenceLength: 1 },
      { start: 18, end: 23, fenceLength: 1 },
    ]);
  });

  it('should skip an escaped or unclosed run of backticks', () => {
    expect(findCodeSpans('\\`a` `b')).toEqual([{ start: 3, end: 6, fenceLength: 1 }]);
    expect(findCodeSpans('\\`a')).toEqual([]);
    expect(findCodeSpans('\\\\`a` ``b')).toEqual([{ start: 2, end: 5, fenceLength: 1 }]);
    expect(findCodeSpans('``a` `b`')).toEqual([{ start: 3, end: 6, fenceLength: 1 }]);
  });
});
