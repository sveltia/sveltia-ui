/**
 * Helpers behind `<Modal>`, kept apart from the component so they can be tested on their own.
 */

/**
 * Get the longest time from a computed CSS time list, such as `transition-duration`.
 * @param {string} value Comma-separated CSS time values in seconds, e.g. `0.4s, 0.15s`.
 * @returns {number} Time in milliseconds, `0` if the list is empty or holds no valid time.
 */
export const getLongestTime = (value) =>
  Math.max(0, ...value.split(',').map((time) => Number.parseFloat(time) || 0)) * 1000;

/**
 * Get how long the closing or opening transition of a `<dialog>` can take, so a fallback timer can
 * be set in case `transitionend` is never fired, for example when the transition is removed by the
 * consumer’s CSS or the element is not rendered at all.
 * @param {{ transitionDuration: string, transitionDelay: string }} style Computed style of the
 * element.
 * @returns {number} Time in milliseconds, with a small margin added.
 */
export const getTransitionTimeout = ({ transitionDuration, transitionDelay }) =>
  getLongestTime(transitionDuration) + getLongestTime(transitionDelay) + 100;
