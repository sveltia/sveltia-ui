import { describe, expect, it } from 'vitest';
import {
  AUTOLINK_REGEX,
  countBackslashesBefore,
  FOOTNOTE_REFERENCE_REGEX,
  INLINE_HTML_REGEX,
  isWordChar,
  NAMED_CHARACTER_REFERENCE_REGEX,
  SETEXT_UNDERLINE,
  THEMATIC_BREAK,
  UNESCAPED_LOOKBEHIND,
  WHITESPACE_OR_PUNCTUATION_REGEX,
} from './syntax.js';

describe('countBackslashesBefore', () => {
  it('should count the backslashes right before the index', () => {
    expect(countBackslashesBefore('a*', 1)).toBe(0);
    expect(countBackslashesBefore('a\\*', 2)).toBe(1);
    expect(countBackslashesBefore('\\\\*', 2)).toBe(2);
    expect(countBackslashesBefore('\\\\\\', 3)).toBe(3);
    expect(countBackslashesBefore('\\a\\*', 3)).toBe(1);
  });
});

describe('UNESCAPED_LOOKBEHIND', () => {
  it('should match after an even number of backslashes only', () => {
    const regex = new RegExp(`${UNESCAPED_LOOKBEHIND}\\*`);

    expect(regex.test('*')).toBe(true);
    expect(regex.test('\\*')).toBe(false);
    expect(regex.test('\\\\*')).toBe(true);
    expect(regex.test('a\\\\\\*')).toBe(false);
  });
});

describe('isWordChar', () => {
  it('should tell a word character from whitespace, punctuation and symbols', () => {
    expect(isWordChar('a')).toBe(true);
    expect(isWordChar('あ')).toBe(true);
    expect(isWordChar(' ')).toBe(false);
    expect(isWordChar('.')).toBe(false);
    expect(isWordChar('–')).toBe(false);
    expect(isWordChar('$')).toBe(false);
    expect(isWordChar(undefined)).toBe(false);
    expect(isWordChar('')).toBe(false);
    expect(WHITESPACE_OR_PUNCTUATION_REGEX.test('')).toBe(false);
  });
});

describe('block syntax sources', () => {
  it('should match a thematic break of the same character', () => {
    const regex = new RegExp(`^${THEMATIC_BREAK}`);

    expect(['***', '- - -', '___ ', '* * * *'].every((line) => regex.test(line))).toBe(true);
    expect(['**', '*-*', '- - x', '_ _'].some((line) => regex.test(line))).toBe(false);
  });

  it('should match a setext heading underline', () => {
    const regex = new RegExp(`^${SETEXT_UNDERLINE}`);

    expect(['=', '===  ', '-', '---'].every((line) => regex.test(line))).toBe(true);
    expect(['=-', '- -', '== x'].some((line) => regex.test(line))).toBe(false);
  });
});

describe('inline syntax regular expressions', () => {
  it('should match inline HTML that isn’t escaped', () => {
    expect(INLINE_HTML_REGEX.exec('a <b class="x"> c')?.[0]).toBe('<b class="x">');
    expect(INLINE_HTML_REGEX.test('\\<b>')).toBe(false);
    expect(INLINE_HTML_REGEX.test('\\\\<b>')).toBe(true);
    expect(INLINE_HTML_REGEX.test('<1a>')).toBe(false);
  });

  it('should match an autolink, but not one with an unsafe scheme', () => {
    expect(AUTOLINK_REGEX.test('<https://example.com>')).toBe(true);
    expect(AUTOLINK_REGEX.test('<foo@example.com>')).toBe(true);
    expect(AUTOLINK_REGEX.test('<JavaScript:alert(1)>')).toBe(false);
  });

  it('should match a footnote reference and a named character reference', () => {
    expect(FOOTNOTE_REFERENCE_REGEX.test('a[^1]')).toBe(true);
    expect(FOOTNOTE_REFERENCE_REGEX.test('a\\[^1]')).toBe(false);
    expect(NAMED_CHARACTER_REFERENCE_REGEX.test('&copy;')).toBe(true);
    expect(NAMED_CHARACTER_REFERENCE_REGEX.test('\\&copy;')).toBe(false);
  });
});
