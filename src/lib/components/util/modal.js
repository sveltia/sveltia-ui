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

/**
 * The modal `<dialog>` elements shown by `<Modal>`, in the order they were opened, the topmost
 * last. The elements are placed in the document in the order the components are mounted, which
 * tells nothing about which one is on top, so others like `<Toast>` can look here instead.
 * @type {HTMLDialogElement[]}
 */
export const openModalDialogs = [];

/**
 * Remove the given `<dialog>` element from {@link openModalDialogs}.
 * @param {HTMLDialogElement | undefined} dialog Element.
 */
export const forgetModalDialog = (dialog) => {
  const index = dialog ? openModalDialogs.indexOf(dialog) : -1;

  if (index > -1) {
    openModalDialogs.splice(index, 1);
  }
};

/**
 * Add the given `<dialog>` element to {@link openModalDialogs} as the topmost one, moving it there
 * if it’s already in the list.
 * @param {HTMLDialogElement} dialog Element.
 */
export const rememberModalDialog = (dialog) => {
  forgetModalDialog(dialog);
  openModalDialogs.push(dialog);
};
