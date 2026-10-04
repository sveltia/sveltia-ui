/**
 * Text normalization shared by search filtering and type-ahead.
 */

/**
 * Diacritic characters regex for normalization. We use a regex instead of `Intl` APIs for better
 * performance, since `transliterate` is slow and we only need basic normalization.
 */
const DIACRITIC_RE = /\p{Diacritic}/gu;

/**
 * Fold the given string for comparison: strip diacritics and convert to lower case, keeping
 * whitespace as is.
 * @internal
 * @param {string} value Original value.
 * @returns {string} Folded value.
 */
export const fold = (value) => value.normalize('NFD').replace(DIACRITIC_RE, '').toLocaleLowerCase();

/**
 * Normalize the given string for search value comparison. Since `transliterate` is slow, we only
 * apply basic normalization.
 * @internal
 * @param {string} value Original value.
 * @returns {string} Normalized value.
 * @todo Move this to `@sveltia/utils`.
 */
export const normalize = (value) => fold(value.trim());
