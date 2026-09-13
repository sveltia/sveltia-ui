/**
 * Logic behind `<NumberInput>`, kept apart from the component so the number handling can be tested
 * without rendering anything.
 */

/**
 * Get the number of fraction digits a value should be formatted with, so stepping by `0.1` yields
 * `0.3` rather than `0.30000000000000004`.
 * @param {number} step Step value.
 * @returns {number} Number of fraction digits, `0` for an integer step.
 */
export const getMaximumFractionDigits = (step) => String(step).split('.')[1]?.length || 0;

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
 * @returns {string | undefined} New text for the field, or `undefined` if the field holds no
 * number or is already at the limit in that direction, in which case it’s left as is.
 */
export const stepNumber = (inputValue, { step, direction, min, max }) => {
  if (Number.isNaN(Number(inputValue))) {
    return undefined;
  }

  if (direction > 0 ? isAtMax(inputValue, max) : isAtMin(inputValue, min)) {
    return undefined;
  }

  return Number(toNumber(inputValue) + step * direction).toFixed(getMaximumFractionDigits(step));
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
