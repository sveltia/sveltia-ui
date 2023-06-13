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

/**
 * Check if the given input is a simple object.
 * @param {*} input Input, probably an object.
 * @returns {boolean} Result.
 */
export const isObject = (input) =>
  input !== null && typeof input === 'object' && !Array.isArray(input);

/**
 * Return a simple `Promise` to resolve in the given time, making it easier to wait for a bit in the
 * code, particularly while making sequential HTTP requests.
 * @param {number} [ms] Milliseconds to wait.
 * @returns {Promise} Nothing.
 */
export const sleep = (ms = 1000) =>
  new Promise((resolve) => {
    window.setTimeout(() => {
      resolve();
    }, ms);
  });
