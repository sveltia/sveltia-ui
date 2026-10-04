import { addMessages, init } from '@sveltia/i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initLocales, strings } from './i18n.js';

vi.mock('@sveltia/i18n', () => ({
  addMessages: vi.fn(),
  init: vi.fn(),
}));

describe('initLocales', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers the loaded translations under the _sui namespace by default', () => {
    initLocales();

    expect(strings['en-CA'].cancel).toBe('Cancel');
    expect(strings['en-GB'].cancel).toBe('Cancel');
    expect(strings['en-US'].cancel).toBe('Cancel');
    expect(strings.ja.cancel).toBe('キャンセル');

    const expectedLocales = Object.keys(strings);

    expect(addMessages).toHaveBeenCalledTimes(expectedLocales.length);
    expectedLocales.forEach((locale) => {
      expect(addMessages).toHaveBeenCalledWith(locale, { _sui: strings[locale] });
    });
    expect(init).toHaveBeenCalledWith({ fallbackLocale: 'en-US', initialLocale: 'en-US' });
  });

  it('passes custom locale options to the i18n initializer', () => {
    initLocales({ fallbackLocale: 'en-GB', initialLocale: 'ja' });

    expect(init).toHaveBeenCalledWith({ fallbackLocale: 'en-GB', initialLocale: 'ja' });
  });
});

describe('strings', () => {
  /**
   * Get the dotted paths of all the leaf strings in a locale.
   * @param {Record<string, any>} object Locale strings, or a nested part of them.
   * @param {string} [prefix] Path of the given part.
   * @returns {string[]} Key paths, sorted.
   */
  const getKeyPaths = (object, prefix = '') =>
    Object.entries(object)
      .flatMap(([key, value]) =>
        value && typeof value === 'object'
          ? getKeyPaths(value, `${prefix}${key}.`)
          : [`${prefix}${key}`],
      )
      .sort();

  const referenceKeys = getKeyPaths(strings['en-US']);

  it.each(Object.keys(strings).filter((locale) => locale !== 'en-US'))(
    'has the same keys in %s as in en-US',
    (locale) => {
      expect(getKeyPaths(strings[locale])).toEqual(referenceKeys);
    },
  );
});
