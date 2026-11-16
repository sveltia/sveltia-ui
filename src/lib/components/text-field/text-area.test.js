import { describe, expect, it, vi } from 'vitest';
import { getHighlightedTokens } from './text-area.js';

/**
 * Tokenize each line as a single coloured token.
 * @param {string} value Value.
 * @returns {import('#lib/typedefs.js').HighlightedToken[][]} Tokens.
 */
const highlightLines = (value) =>
  value.split('\n').map((line) => (line ? [{ content: line, color: 'red' }] : []));

describe('getHighlightedTokens', () => {
  it('should return `undefined` without a `highlight` function', () => {
    expect(getHighlightedTokens('foo', undefined)).toBeUndefined();
  });

  it('should return `undefined` when the `highlight` function returns no tokens', () => {
    const highlight = vi.fn(() => undefined);

    expect(getHighlightedTokens('foo', highlight)).toBeUndefined();
    expect(highlight).toHaveBeenCalledWith('foo');
  });

  it('should flatten the lines with line breaks in between plus a trailing one', () => {
    expect(getHighlightedTokens('foo\n\nbar', highlightLines)).toEqual([
      { content: 'foo', color: 'red' },
      { content: '\n' },
      { content: '\n' },
      { content: 'bar', color: 'red' },
      { content: '\n' },
    ]);
  });

  it('should handle an empty value', () => {
    expect(getHighlightedTokens('', highlightLines)).toEqual([{ content: '\n' }]);
  });

  it('should return `undefined` when the tokens don’t add up to the value', () => {
    expect(getHighlightedTokens('foo bar', () => [[{ content: 'foo' }]])).toBeUndefined();
    expect(getHighlightedTokens('foo', () => [[{ content: 'foo' }], []])).toBeUndefined();
  });

  it('should tokenize an empty string for an `undefined` value', () => {
    const highlight = vi.fn(() => [[]]);

    expect(getHighlightedTokens(undefined, highlight)).toBeUndefined();
    expect(highlight).toHaveBeenCalledWith('');
  });
});
