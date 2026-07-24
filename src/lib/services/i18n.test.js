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
