import { describe, expect, it, vi } from 'vitest';
import { initLocales } from './i18n.js';

describe('initLocales', () => {
  it('should not throw when called with default options', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() => initLocales()).not.toThrow();
    warnSpy.mockRestore();
  });

  it('should not throw when called with custom locale options', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() => initLocales({ fallbackLocale: 'en', initialLocale: 'ja' })).not.toThrow();
    warnSpy.mockRestore();
  });
});
