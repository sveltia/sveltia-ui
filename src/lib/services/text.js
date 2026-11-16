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

/**
 * Get the visible label of a member of a composite widget, as used for type-ahead: the `data-label`
 * attribute, or else the text of its `.label` element rather than the whole text, which would take
 * in icon ligature names.
 * @internal
 * @param {HTMLElement} element Member element.
 * @param {object} [options] Options.
 * @param {boolean} [options.textFallback] Whether to fall back to the element’s whole text when it
 * has neither. A tree item holds its child items, whose text must not be taken for its own, so the
 * tree turns this off.
 * @returns {string} Label, which is empty if none is found.
 */
export const getItemLabel = (element, { textFallback = true } = {}) =>
  element.dataset.label ??
  element.querySelector('.label')?.textContent ??
  (textFallback ? (element.textContent ?? '') : '');
