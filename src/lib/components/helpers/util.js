/**
 * Get a random ID that can be used for elements.
 * @param {string} [prefix] Prefix to be added to the ID, e.g. `popup`.
 * @param {number} [length] Number of characters to be used in the ID.
 * @returns {string} Generated ID.
 */
export const getRandomId = (prefix = '', length = 7) =>
  [
    prefix,
    new Array(length)
      .fill()
      .map(() => '0123456789abcdef'[Math.floor(Math.random() * 12)])
      .join(''),
  ].join('-');
