import { describe, expect, it } from 'vitest';
import { fold, normalize } from './text.js';

describe('fold', () => {
  it('should strip diacritics and convert to lower case, keeping whitespace', () => {
    expect(fold(' Été ')).toBe(' ete ');
  });
});

describe('normalize', () => {
  it('should trim whitespace', () => {
    expect(normalize('  hello  ')).toBe('hello');
  });

  it('should return empty string for blank input', () => {
    expect(normalize('   ')).toBe('');
    expect(normalize('')).toBe('');
  });

  it('should convert to lower case', () => {
    expect(normalize('HELLO')).toBe('hello');
    expect(normalize('Hello World')).toBe('hello world');
  });

  it('should strip diacritics', () => {
    expect(normalize('café')).toBe('cafe');
    expect(normalize('naïve')).toBe('naive');
    expect(normalize('résumé')).toBe('resume'); // cspell:disable-line
  });

  it('should handle strings without diacritics unchanged (apart from case)', () => {
    expect(normalize('hello world')).toBe('hello world');
  });
});
