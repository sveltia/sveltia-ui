import { addMessages, init } from '@sveltia/i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initLocales, resources } from './i18n.js';

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

    expect(resources.en.cancel).toBe('Cancel');
    expect(resources.ja.cancel).toBe('キャンセル');
    expect(addMessages).toHaveBeenCalledTimes(2);
    expect(addMessages).toHaveBeenCalledWith('en', { _sui: resources.en });
    expect(addMessages).toHaveBeenCalledWith('ja', { _sui: resources.ja });
    expect(init).toHaveBeenCalledWith({ fallbackLocale: 'en', initialLocale: 'en' });
  });

  it('passes custom locale options to the i18n initializer', () => {
    initLocales({ fallbackLocale: 'en', initialLocale: 'ja' });

    expect(init).toHaveBeenCalledWith({ fallbackLocale: 'en', initialLocale: 'ja' });
  });
});
