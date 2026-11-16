import { describe, expect, it } from 'vitest';
import { findCodeSpans, mapCodeSpans } from './code-spans.js';

/**
 * @import { CodeSpan } from './code-spans.js';
 */

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

describe('mapCodeSpans', () => {
  /**
   * Convert text to upper case.
   * @param {string} text Text.
   * @returns {string} Converted text.
   */
  const outside = (text) => text.toUpperCase();
  /**
   * Replace a code span with `x`.
   * @returns {string} Replacement.
   */
  const inside = () => 'x';

  it('should process the code spans and the text outside them separately', () => {
    expect(mapCodeSpans('a `b` c ``d`` e', { outside, inside })).toBe('A x C x E');
  });

  it('should give the code span with its position', () => {
    /** @type {[string, CodeSpan][]} */
    const calls = [];

    mapCodeSpans('a ``b`` c', {
      /**
       * Record the call.
       * @param {string} codeSpan Code span.
       * @param {CodeSpan} span Position of the code span.
       * @returns {string} Code span as is.
       */
      inside: (codeSpan, span) => {
        calls.push([codeSpan, span]);

        return codeSpan;
      },
    });

    expect(calls).toEqual([['``b``', { start: 2, end: 7, fenceLength: 2 }]]);
  });

  it('should keep either side as is by default', () => {
    expect(mapCodeSpans('a `b` c', { outside })).toBe('A `b` C');
    expect(mapCodeSpans('a `b` c', { inside })).toBe('a x c');
    expect(mapCodeSpans('\\`a`', { inside })).toBe('\\`a`');
  });
});
