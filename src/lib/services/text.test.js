import { describe, expect, it } from 'vitest';
import { fold, getItemLabel, normalize } from './text.js';

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

describe('getItemLabel', () => {
  /**
   * Create an element.
   * @param {string} html Inner HTML.
   * @returns {HTMLElement} Element.
   */
  const create = (html) => {
    const element = document.createElement('div');

    element.innerHTML = html;

    return element;
  };

  it('should prefer the `data-label` attribute', () => {
    const element = create('<span class="label">Shown</span>');

    element.dataset.label = 'Data';
    expect(getItemLabel(element)).toBe('Data');
  });

  it('should fall back to the `.label` element', () => {
    expect(
      getItemLabel(create('<span class="icon">home</span><span class="label">Home</span>')),
    ).toBe('Home');
  });

  it('should fall back to the whole text unless told not to', () => {
    const element = create('<span>Whole</span> text');

    expect(getItemLabel(element)).toBe('Whole text');
    expect(getItemLabel(element, { textFallback: false })).toBe('');
  });
});
