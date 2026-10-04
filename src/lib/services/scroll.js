/**
 * Scrolling helpers shared by the composite widgets.
 */

/**
 * Scroll the given element into view if needed, by as little as possible. Falls back to the legacy
 * boolean argument on a browser that rejects the options object.
 * @internal
 * @param {HTMLElement} element Element to be scrolled into view.
 */
export const scrollIntoViewIfNeeded = (element) => {
  try {
    element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
  } catch {
    element.scrollIntoView(true);
  }
};
