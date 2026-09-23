/**
 * Conversion of the values held by buttons and other items: a value is stored in the `data-value`
 * attribute along with its type in the `data-type` attribute, so it can be cast back to the
 * original type when the item is selected.
 */

/**
 * Get the data type of a value, to be stored in the `data-type` attribute. `null` gets its own type
 * because `typeof null` is `object`, and the `data-value` attribute is omitted for `null`.
 * @param {any} value Value.
 * @returns {string} Data type, e.g. `string`, `number`, `boolean` or `null`.
 */
export const getValueType = (value) => (value === null ? 'null' : typeof value);

/**
 * Cast a value read from the `data-value` attribute back to its original type.
 * @param {string | undefined} value Attribute value, or `undefined` if the attribute is omitted.
 * @param {string} type Data type stored in the `data-type` attribute.
 * @returns {any} Cast value. Any other type than `number`, `boolean`, `null` and `string` is
 * returned as is.
 */
export const castValue = (value, type) => {
  if (type === 'number') {
    const number = Number(value);

    return Number.isNaN(number) ? null : number;
  }

  if (type === 'boolean') {
    return value === 'true';
  }

  if (type === 'null') {
    return null;
  }

  if (type === 'string') {
    return value ? String(value) : '';
  }

  return value;
};
