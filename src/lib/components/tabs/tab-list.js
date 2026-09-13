/**
 * Helpers behind `<TabList>`, kept apart from the component so they can be tested on their own.
 */

/**
 * Get the inline style placing the selection indicator over the given tab.
 * @param {{ offsetTop: number, offsetLeft: number, offsetWidth: number, offsetHeight: number }}
 * tab The selected tab’s offset box, relative to the tab list.
 * @returns {string} CSS declarations for the indicator.
 */
export const getIndicatorStyle = ({ offsetTop, offsetLeft, offsetWidth, offsetHeight }) =>
  Object.entries({
    top: offsetTop,
    left: offsetLeft,
    width: offsetWidth,
    height: offsetHeight,
  })
    .map(([key, value]) => `${key}: ${value}px`)
    .join('; ');
