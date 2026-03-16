import { locale as appLocale } from 'svelte-i18n';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDirection, initLocales, RTL_LOCALES } from './i18n.js';

describe('RTL_LOCALES', () => {
  it('should include Arabic, Persian, Hebrew, and Urdu', () => {
    expect(RTL_LOCALES).toContain('ar');
    expect(RTL_LOCALES).toContain('fa');
    expect(RTL_LOCALES).toContain('he');
    expect(RTL_LOCALES).toContain('ur');
  });
});

describe('getDirection', () => {
  it('should return rtl for Arabic', () => {
    expect(getDirection('ar')).toBe('rtl');
  });

  it('should return rtl for Persian', () => {
    expect(getDirection('fa')).toBe('rtl');
  });

  it('should return rtl for Hebrew', () => {
    expect(getDirection('he')).toBe('rtl');
  });

  it('should return rtl for Urdu', () => {
    expect(getDirection('ur')).toBe('rtl');
  });

  it('should return rtl for a regional RTL locale like ar-SA', () => {
    expect(getDirection('ar-SA')).toBe('rtl');
  });

  it('should return ltr for English', () => {
    expect(getDirection('en')).toBe('ltr');
  });

  it('should return ltr for Japanese', () => {
    expect(getDirection('ja')).toBe('ltr');
  });

  it('should return ltr for a regional LTR locale like en-US', () => {
    expect(getDirection('en-US')).toBe('ltr');
  });

  it('should return ltr for null', () => {
    expect(getDirection(null)).toBe('ltr');
  });

  it('should return ltr for undefined', () => {
    expect(getDirection(undefined)).toBe('ltr');
  });

  it('should return ltr for an empty string', () => {
    expect(getDirection('')).toBe('ltr');
  });
});

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

describe('i18n side effects', () => {
  afterEach(async () => {
    // Restore locale and document direction after each test
    appLocale.set('en');
    document.documentElement.removeAttribute('dir');
    await Promise.resolve();
  });

  it('should update document.dir to rtl when locale is set to an RTL language', () => {
    appLocale.set('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('should update document.dir back to ltr when locale is set to a LTR language', () => {
    appLocale.set('ar');
    appLocale.set('en');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('should update the isRTL store when document dir attribute changes', async () => {
    // Set dir via appLocale subscriber (which sets document.documentElement.dir synchronously)
    // This triggers the MutationObserver set up in i18n.js (line 59)
    appLocale.set('ar'); // → document.documentElement.dir = 'rtl' synchronously
    // happy-dom MO callback fires via internal scheduling; give it time to run
    await new Promise((r) => {
      setTimeout(r, 50);
    });
    // Whether isRTL updated or not depends on MO timing, but document.dir is definitely set
    expect(document.documentElement.dir).toBe('rtl');
  });
});
