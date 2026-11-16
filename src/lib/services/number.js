/**
 * Number helpers shared by the components that step through a range of numbers, like
 * `<NumberInput>` and `<Slider>`.
 */

/**
 * Get the step to use, falling back to `1` for a value that isn’t a positive number, like `0`,
 * `null` or `NaN`, which would leave the spin buttons and the arrow keys with nowhere to go.
 * @param {number | null | undefined} step Step value.
 * @returns {number} Positive step.
 */
export const normalizeStep = (step) =>
  typeof step === 'number' && Number.isFinite(step) && step > 0 ? step : 1;

/**
 * Count the fraction digits of a number, including one written in exponent notation, such as
 * `1e-7`, so a value stepped by `0.1` can be rounded to `0.3` rather than `0.30000000000000004`.
 * @param {number} num Number.
 * @returns {number} Number of fraction digits, `0` for an integer.
 */
export const getMaximumFractionDigits = (num) => {
  // A small number like `0.0000001` is stringified in exponent notation as `1e-7`
  const [mantissa, exponent = '0'] = String(num).toLowerCase().split('e');
  const digits = (mantissa.split('.')[1]?.length ?? 0) - Number(exponent);

  return Math.max(digits, 0);
};
