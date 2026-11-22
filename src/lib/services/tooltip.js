/**
 * Pure helpers for `<Tooltip>`, which don’t touch the DOM, so they can be tested on their own.
 */

/**
 * Space kept between a tooltip and its anchor, and between a tooltip and the viewport edges.
 */
export const TOOLTIP_GAP = 6;

/**
 * @typedef {'auto' | 'top' | 'bottom' | 'left' | 'right'} TooltipPosition
 */

/**
 * Sides opposite each other, which a tooltip moves to when its own side has no room.
 * @type {Record<'top' | 'bottom' | 'left' | 'right', 'top' | 'bottom' | 'left' | 'right'>}
 */
const OPPOSITE_SIDES = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
/**
 * Keep a value between a minimum and a maximum, favouring the minimum when they cross.
 * @param {number} value Value.
 * @param {number} min Minimum.
 * @param {number} max Maximum.
 * @returns {number} Result.
 */
const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

/**
 * Work out where a tooltip goes: on the given side of its anchor, centred on it, or on the opposite
 * side when there’s no room on the given one and more on the other, and moved along the side as
 * needed to stay within the viewport. `auto` is below the anchor.
 * @param {object} args Arguments.
 * @param {{ top: number, right: number, bottom: number, left: number, width: number,
 * height: number }} args.anchorRect Anchor’s rect, as `getBoundingClientRect()` returns it.
 * @param {{ width: number, height: number }} args.viewport Viewport size.
 * @param {{ width: number, height: number }} args.size Tooltip’s size.
 * @param {TooltipPosition} [args.position] Preferred side. Default: `auto`.
 * @param {boolean} [args.rtl] Whether the anchor is in a right-to-left context, which swaps `left`
 * and `right`, like the popup positions.
 * @returns {{ top: number, left: number, placement: 'top' | 'bottom' | 'left' | 'right' }}
 * Position of the tooltip’s top-left corner in the viewport, and which side of the anchor it’s on.
 */
export const getTooltipPosition = ({
  anchorRect,
  viewport,
  size,
  position = 'auto',
  rtl = false,
}) => {
  const rooms = {
    top: anchorRect.top - TOOLTIP_GAP * 2,
    bottom: viewport.height - anchorRect.bottom - TOOLTIP_GAP * 2,
    left: anchorRect.left - TOOLTIP_GAP * 2,
    right: viewport.width - anchorRect.right - TOOLTIP_GAP * 2,
  };

  const side = position === 'auto' ? 'bottom' : position;
  const preferred = rtl && (side === 'left' || side === 'right') ? OPPOSITE_SIDES[side] : side;
  const opposite = OPPOSITE_SIDES[preferred];
  const needed = preferred === 'top' || preferred === 'bottom' ? size.height : size.width;

  const placement =
    needed > rooms[preferred] && rooms[opposite] > rooms[preferred] ? opposite : preferred;

  const centredLeft = anchorRect.left + anchorRect.width / 2 - size.width / 2;
  const centredTop = anchorRect.top + anchorRect.height / 2 - size.height / 2;
  const maxLeft = viewport.width - size.width - TOOLTIP_GAP;
  const maxTop = viewport.height - size.height - TOOLTIP_GAP;

  if (placement === 'top' || placement === 'bottom') {
    return {
      top:
        placement === 'bottom'
          ? anchorRect.bottom + TOOLTIP_GAP
          : anchorRect.top - TOOLTIP_GAP - size.height,
      left: clamp(centredLeft, TOOLTIP_GAP, maxLeft),
      placement,
    };
  }

  return {
    top: clamp(centredTop, TOOLTIP_GAP, maxTop),
    left:
      placement === 'right'
        ? anchorRect.right + TOOLTIP_GAP
        : anchorRect.left - TOOLTIP_GAP - size.width,
    placement,
  };
};

/**
 * Add or remove an ID in a space-separated ID list, such as the `aria-describedby` attribute,
 * keeping any other IDs the consumer has set.
 * @param {string | null} list Current list.
 * @param {string} id ID.
 * @param {boolean} include Whether the ID should be in the list.
 * @returns {string | null} New list, or `null` if it ends up empty.
 */
export const toggleIdInList = (list, id, include) => {
  const ids = (list ?? '').split(/\s+/).filter((item) => item && item !== id);

  if (include) {
    ids.push(id);
  }

  return ids.length ? ids.join(' ') : null;
};

/**
 * Get the text of an element as a screen reader would read it, leaving out the parts hidden with
 * `aria-hidden`, such as the name of an icon drawn with a ligature font.
 * @param {Element} element Element.
 * @returns {string} Text, with its white space collapsed.
 */
export const getAccessibleText = (element) => {
  /**
   * Collect the text of a node.
   * @param {Node} node Node.
   * @returns {string} Text.
   */
  const collect = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent ?? '';
    }

    if (
      node.nodeType !== Node.ELEMENT_NODE ||
      /** @type {Element} */ (node).getAttribute('aria-hidden') === 'true'
    ) {
      return '';
    }

    // The text nodes carry the real white space, so nothing is added between the parts
    return [...node.childNodes].map(collect).join('');
  };

  return collect(element).replace(/\s+/g, ' ').trim();
};
