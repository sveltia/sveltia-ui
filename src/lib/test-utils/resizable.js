/**
 * Helpers for testing the resizable pane components.
 */

/**
 * Get the flex basis of each pane.
 * @param {HTMLElement} container Container.
 * @returns {string[]} Flex bases.
 */
export const getSizes = (container) =>
  /** @type {HTMLElement[]} */ ([...container.querySelectorAll('.sui.resizable-pane')]).map(
    (pane) => pane.style.flexBasis,
  );
