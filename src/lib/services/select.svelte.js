/**
 * @import { SelectedItemDetail } from '$lib/typedefs';
 */

/**
 * Get the detail of the selected element.
 * @param {HTMLElement} target Element to get the detail from.
 * @returns {SelectedItemDetail} Detail of the selected element.
 */
export const getSelectedItemDetail = (target) => {
  const { type = 'string', name, label } = target.dataset;
  /** @type {any} */
  let { value } = target.dataset;

  if (type === 'number') {
    value = Number(value);

    if (Number.isNaN(value)) {
      value = null;
    }
  } else if (type === 'boolean') {
    value = value === 'true';
  } else if (type === 'string') {
    value = value ? String(value) : '';
  }

  return { target, type, name, label, value };
};
