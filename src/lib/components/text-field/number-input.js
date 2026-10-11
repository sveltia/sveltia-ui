/**
 * Logic behind `<NumberInput>`, kept apart from the component so the number handling can be tested
 * without rendering anything.
 */

/**
 * Step value that turns stepping off: the spin buttons are hidden and the arrow keys are ignored.
 */
export const STEP_DISABLED = -1;

/**
 * Get the step to use, falling back to `1` for a value that isn’t a positive number, like `0`,
 * `null` or `NaN`, which would leave the spin buttons and the arrow keys with nowhere to go.
 * @param {number | null | undefined} step Step value.
 * @returns {number} Positive step.
 */
export const normalizeStep = (step) =>
  typeof step === 'number' && Number.isFinite(step) && step > 0 ? step : 1;

/**
 * Get the number of fraction digits a value should be formatted with, so stepping by `0.1` yields
 * `0.3` rather than `0.30000000000000004`.
 * @param {number} step Step value.
 * @returns {number} Number of fraction digits, `0` for an integer step.
 */
export const getMaximumFractionDigits = (step) => {
  // A small step like `0.0000001` is stringified in exponent notation as `1e-7`
  const [mantissa, exponent = '0'] = String(step).toLowerCase().split('e');
  const digits = (mantissa.split('.')[1]?.length ?? 0) - Number(exponent);

  return Math.max(digits, 0);
};

/**
 * Get the `inputmode` attribute for the field. The numeric and decimal keypads on iOS have no minus
 * key, so a field that accepts a negative number gets the full keyboard instead.
 * @param {object} options Options.
 * @param {boolean} options.fractional Whether the number can have a fraction.
 * @param {number} [options.min] Minimum allowed value.
 * @returns {'text' | 'decimal' | 'numeric'} Input mode.
 */
export const getInputMode = ({ fractional, min }) => {
  if (!(typeof min === 'number' && min >= 0)) {
    return 'text';
  }

  return fractional ? 'decimal' : 'numeric';
};

/**
 * Decimal separators of the locales looked up, keyed by locale. The separator is read on every
 * keystroke, while creating an `Intl.NumberFormat` is comparatively expensive.
 * @type {Map<string, string>}
 */
const decimalSeparatorCache = new Map();

/**
 * Get the decimal separator of the given locale, like `,` in German.
 * @param {string | undefined} locale Locale, like `de`. If omitted, the browser’s default locale is
 * used.
 * @returns {string} Decimal separator. `.` if the locale is invalid.
 */
export const getDecimalSeparator = (locale) => {
  const key = locale || '';
  let separator = decimalSeparatorCache.get(key);

  if (separator === undefined) {
    try {
      separator = /** @type {Intl.NumberFormatPart} */ (
        new Intl.NumberFormat(locale || undefined)
          .formatToParts(1.5)
          .find(({ type }) => type === 'decimal')
      ).value;
    } catch {
      separator = '.';
    }

    decimalSeparatorCache.set(key, separator);
  }

  return separator;
};

/**
 * Normalize the text entered in the field, so a number typed with the locale’s decimal separator,
 * like `1,5` in German, can be parsed as `1.5`. A period is always accepted as the decimal
 * separator, as a value set from outside is shown with one, so the text is left as is if it has
 * one, or more than one decimal separator of the locale. Thousands separators are not supported:
 * `1,500` in English, whose decimal separator is a period, remains no number.
 * @param {string} inputValue Text in the field.
 * @param {string | undefined} locale Locale of the field.
 * @returns {string} Normalized text.
 */
export const normalizeNumber = (inputValue, locale) => {
  const separator = getDecimalSeparator(locale);

  if (!inputValue || separator === '.' || inputValue.includes('.')) {
    return inputValue;
  }

  const parts = inputValue.split(separator);

  return parts.length === 2 ? parts.join('.') : inputValue;
};

/**
 * Parse the text entered in the field.
 * @param {string} inputValue Text in the field.
 * @returns {number | undefined} Number, or `undefined` if the field is empty or holds no number.
 */
export const parseNumber = (inputValue) => {
  const value = inputValue.trim() ? Number(inputValue) : NaN;

  return Number.isNaN(value) ? undefined : value;
};

/**
 * Get the number the field currently represents for range checks: an empty field counts as zero,
 * so the spin buttons and the arrow keys have something to step from.
 * @param {string} inputValue Text in the field.
 * @returns {number} Number, possibly `NaN`.
 */
const toNumber = (inputValue) => Number(inputValue || 0);

/**
 * Whether the field is at or below the minimum, if any.
 * @param {string} inputValue Text in the field.
 * @param {number | undefined} min Minimum allowed value.
 * @returns {boolean} Result.
 */
export const isAtMin = (inputValue, min) => typeof min === 'number' && toNumber(inputValue) <= min;

/**
 * Whether the field is at or above the maximum, if any.
 * @param {string} inputValue Text in the field.
 * @param {number | undefined} max Maximum allowed value.
 * @returns {boolean} Result.
 */
export const isAtMax = (inputValue, max) => typeof max === 'number' && toNumber(inputValue) >= max;

/**
 * Step the number in the field up or down.
 * @param {string} inputValue Text in the field.
 * @param {object} options Options.
 * @param {number} options.step Amount to add or subtract.
 * @param {1 | -1} options.direction `1` to increase, `-1` to decrease.
 * @param {number} [options.min] Minimum allowed value.
 * @param {number} [options.max] Maximum allowed value.
 * @returns {string | undefined} New text for the field, clamped to the range, or `undefined` if
 * the field holds no number or is already at the limit in that direction, in which case it’s left
 * as is.
 */
export const stepNumber = (inputValue, { step, direction, min, max }) => {
  if (Number.isNaN(Number(inputValue))) {
    return undefined;
  }

  if (direction > 0 ? isAtMax(inputValue, max) : isAtMin(inputValue, min)) {
    return undefined;
  }

  const maximumFractionDigits = getMaximumFractionDigits(step);
  const newValue = Number((toNumber(inputValue) + step * direction).toFixed(maximumFractionDigits));

  // Stop at the limit rather than stepping past it, as the native `<input type="number">` does
  if (typeof max === 'number' && newValue > max) {
    return String(max);
  }

  if (typeof min === 'number' && newValue < min) {
    return String(min);
  }

  return newValue.toFixed(maximumFractionDigits);
};

/**
 * Check whether the field content is invalid.
 * @param {string} inputValue Text in the field.
 * @param {object} options Options.
 * @param {boolean} [options.required] Whether a value is required.
 * @param {number} [options.min] Minimum allowed value.
 * @param {number} [options.max] Maximum allowed value.
 * @returns {boolean} `true` if the field is empty while required, holds something other than a
 * number, or holds a number outside the allowed range.
 */
export const isInvalidNumber = (inputValue, { required = false, min, max } = {}) => {
  if (required && (parseNumber(inputValue) === undefined || inputValue === '')) {
    return true;
  }

  if (inputValue === undefined || inputValue === '') {
    return false;
  }

  const value = Number(inputValue);

  return (
    Number.isNaN(value) ||
    (typeof min === 'number' && toNumber(inputValue) < min) ||
    (typeof max === 'number' && toNumber(inputValue) > max)
  );
};
