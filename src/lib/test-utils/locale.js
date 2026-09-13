/**
 * Helpers for testing locale-dependent behavior.
 */

import { locale } from '@sveltia/i18n';

/**
 * Switch the UI to a right-to-left locale, or back to the default left-to-right one. Tests that
 * switch should switch back in an `afterEach` hook, so the following tests start out in the
 * default locale.
 * @param {boolean} rtl Whether to use a right-to-left locale.
 */
export const setRTL = (rtl) => {
  locale.set(rtl ? 'ar' : 'en-US');
};
