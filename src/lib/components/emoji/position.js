/**
 * Placement of the `<EmojiSuggestions>` dropdown, kept apart from the component so it can be
 * tested against arbitrary viewports.
 */

/**
 * @import { EmojiAnchorRect } from '$lib/typedefs';
 */

/**
 * Width of the dropdown, also enforced in the component’s stylesheet.
 */
export const LIST_WIDTH = 280;
/**
 * Gap between the dropdown and the caret, and the minimum margin to the viewport edges.
 */
export const LIST_OFFSET = 4;
export const VIEWPORT_MARGIN = 8;

/**
 * @typedef {object} SuggestionListPosition
 * @property {string | undefined} top CSS `top`, when the list hangs below the caret.
 * @property {string | undefined} bottom CSS `bottom`, when the list is flipped above the caret.
 * @property {string} left CSS `left`.
 * @property {string} maxHeight CSS `max-height`.
 */

/**
 * Work out where to place the dropdown: below the caret by default, flipped above it when there
 * is more room there and not enough below, and clamped to the viewport horizontally.
 *
 * The dropdown grows away from the start of the line, so it follows the reading direction rather
 * than reaching back across the text: in a right-to-left layout it hangs from the shortcode’s
 * right edge and extends leftwards, mirroring what `activatePopup()` does for anchored popups.
 * @param {object} options Options.
 * @param {EmojiAnchorRect} options.anchorRect Viewport-relative bounds of the shortcode being
 * typed.
 * @param {number} options.listMaxHeight The height the list would like to have, in pixels.
 * @param {{ width: number, height: number }} options.viewport Size of the viewport in pixels.
 * @param {boolean} options.rtl Whether the layout is right-to-left.
 * @returns {SuggestionListPosition} Position.
 */
export const getSuggestionListPosition = ({ anchorRect, listMaxHeight, viewport, rtl }) => {
  const { width: innerWidth, height: innerHeight } = viewport;
  const spaceBelow = innerHeight - anchorRect.bottom;
  const spaceAbove = anchorRect.top;
  const flipped = spaceBelow < listMaxHeight + VIEWPORT_MARGIN && spaceAbove > spaceBelow;
  const anchorLeft = rtl ? anchorRect.right - LIST_WIDTH : anchorRect.left;

  return {
    top: flipped ? undefined : `${Math.round(anchorRect.bottom + LIST_OFFSET)}px`,
    bottom: flipped ? `${Math.round(innerHeight - anchorRect.top + LIST_OFFSET)}px` : undefined,
    left: `${Math.round(
      Math.max(VIEWPORT_MARGIN, Math.min(anchorLeft, innerWidth - LIST_WIDTH - VIEWPORT_MARGIN)),
    )}px`,
    maxHeight: `${Math.round(
      Math.min(listMaxHeight, (flipped ? spaceAbove : spaceBelow) - LIST_OFFSET - VIEWPORT_MARGIN),
    )}px`,
  };
};
