/**
 * Pure helpers that work out where a popup goes and how large it can be, given the anchor’s rect
 * and the viewport size. They don’t touch the DOM, so they can be tested on their own.
 */

/**
 * @import { PopupPosition } from '$lib/typedefs';
 */

/**
 * @typedef {object} PopupStyle
 * @property {string | undefined} inset The `inset` CSS property.
 * @property {number | undefined} zIndex The `z-index` CSS property.
 * @property {string | undefined} minWidth The `min-width` CSS property.
 * @property {string | undefined} maxWidth The `max-width` CSS property.
 * @property {string | undefined} height The `max-height` CSS property.
 */

/**
 * @typedef {object} ViewportSize
 * @property {number} width Viewport width.
 * @property {number} height Viewport height.
 */

/**
 * @typedef {object} ClippedRect
 * @property {number} top Top edge.
 * @property {number} left Left edge.
 * @property {number} right Right edge.
 * @property {number} bottom Bottom edge.
 * @property {number} width Width.
 * @property {number} height Height.
 */

/**
 * Mirror a popup position for an RTL document, so `-left` becomes `-right`, `left-` becomes
 * `right-` and vice versa. The positions are written for LTR documents.
 * @internal
 * @param {PopupPosition} position Original position.
 * @returns {PopupPosition} Mirrored position.
 * @todo Rename `PopupPosition` enums to be direction-agnostic.
 */
export const mirrorPosition = (position) => {
  let mirrored = position;

  if (mirrored.endsWith('-left')) {
    mirrored = /** @type {PopupPosition} */ (mirrored.replace('-left', '-right'));
  } else if (mirrored.endsWith('-right')) {
    mirrored = /** @type {PopupPosition} */ (mirrored.replace('-right', '-left'));
  }

  if (mirrored.startsWith('left-')) {
    mirrored = /** @type {PopupPosition} */ (mirrored.replace('left-', 'right-'));
  } else if (mirrored.startsWith('right-')) {
    mirrored = /** @type {PopupPosition} */ (mirrored.replace('right-', 'left-'));
  }

  return mirrored;
};

/**
 * Clip the anchor’s rect to the viewport, mirroring what `IntersectionObserver` used to report as
 * `intersectionRect`.
 * @internal
 * @param {{ top: number, left: number, right: number, bottom: number }} anchorRect Anchor’s
 * bounding rect.
 * @param {ViewportSize} viewport Viewport size.
 * @returns {ClippedRect} Clipped rect.
 */
export const clipRect = (anchorRect, viewport) => {
  const top = Math.max(anchorRect.top, 0);
  const left = Math.max(anchorRect.left, 0);
  const right = Math.min(anchorRect.right, viewport.width);
  const bottom = Math.min(anchorRect.bottom, viewport.height);

  return {
    top,
    left,
    right,
    bottom,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
};

/**
 * Move a popup to the opposite side of its anchor when the content doesn’t fit on the current side
 * and the opposite side has more room. When the content doesn’t fit, the popup is also capped by
 * the room on the side it ends up on, so it scrolls instead of running past the viewport.
 * @internal
 * @param {object} args Arguments.
 * @param {PopupPosition} args.position Current position.
 * @param {string} args.from Part of the position denoting the current side, e.g. `bottom-`.
 * @param {string} args.to Part of the position denoting the opposite side, e.g. `top-`.
 * @param {number} args.size Content size along the axis.
 * @param {number} args.room Room on the current side.
 * @param {number} args.otherRoom Room on the opposite side.
 * @returns {{ position: PopupPosition, cap: number | undefined }} New position, and the size limit
 * if the content doesn’t fit, `undefined` otherwise.
 */
export const flip = ({ position, from, to, size, room, otherRoom }) => {
  if (size <= room) {
    return { position, cap: undefined };
  }

  if (otherRoom > room) {
    return { position: /** @type {PopupPosition} */ (position.replace(from, to)), cap: otherRoom };
  }

  return { position, cap: room };
};

/**
 * Calculate the popup’s inset and size from the anchor’s rect, the viewport size and the content’s
 * natural size. The position may be altered if the space is limited.
 * @internal
 * @param {object} args Arguments.
 * @param {PopupPosition} args.position Preferred position, already mirrored for RTL if needed.
 * @param {{ top: number, left: number, right: number, bottom: number }} args.anchorRect Anchor’s
 * bounding rect.
 * @param {ViewportSize} args.viewport Viewport size.
 * @param {number} args.contentWidth Content’s natural width.
 * @param {number} args.contentHeight Content’s natural height.
 * @returns {PopupStyle} Popup style.
 */
export const calculatePopupStyle = ({
  position: preferredPosition,
  anchorRect,
  viewport,
  contentWidth,
  contentHeight,
}) => {
  const rect = clipRect(anchorRect, viewport);
  const topMargin = rect.top - 8;
  const bottomMargin = viewport.height - rect.bottom - 8;
  // A popup that opens beside its anchor is aligned with one of the anchor’s edges and extends
  // across it, so its room is measured from that edge, not from the opposite one a dropdown
  // hangs off
  const leftMargin = rect.left - 8;
  const rightMargin = viewport.width - rect.right - 8;
  const downwardMargin = viewport.height - rect.top - 8;
  const upwardMargin = rect.bottom - 8;
  let position = preferredPosition;
  /** @type {number | undefined} */
  let height;

  /**
   * Apply {@link flip} vertically, keeping any height limit already set if the content fits.
   * @param {string} from Current side.
   * @param {string} to Opposite side.
   * @param {number} room Room on the current side.
   * @param {number} otherRoom Room on the opposite side.
   */
  const flipVertically = (from, to, room, otherRoom) => {
    const result = flip({ position, from, to, size: contentHeight, room, otherRoom });

    position = result.position;
    height = result.cap ?? height;
  };

  // Alter the position if the space is limited
  if (position.startsWith('bottom-')) {
    flipVertically('bottom-', 'top-', bottomMargin, topMargin);
  } else if (position.startsWith('top-')) {
    flipVertically('top-', 'bottom-', topMargin, bottomMargin);
  }

  // Only a popup that opens beside its anchor carries a `-top`/`-bottom` suffix, and it grows
  // away from the edge it’s aligned with: down from the anchor’s top, or up from its bottom. It
  // gets the same treatment as the dropdown above — align with the other edge when the content
  // doesn’t fit and that edge has more room, and cap it either way, so a long submenu scrolls
  // instead of running past the viewport
  if (position.endsWith('-top')) {
    flipVertically('-top', '-bottom', downwardMargin, upwardMargin);
  } else if (position.endsWith('-bottom')) {
    flipVertically('-bottom', '-top', upwardMargin, downwardMargin);
  }

  // If the popup overflows the viewport, change the position
  if (position.endsWith('-left')) {
    if (rect.left + contentWidth > viewport.width - 8) {
      position = /** @type {PopupPosition} */ (position.replace('-left', '-right'));
    }
  }

  if (position.endsWith('-right')) {
    if (rect.right - contentWidth < 8) {
      position = /** @type {PopupPosition} */ (position.replace('-right', '-left'));
    }
  }

  // The two checks above align a dropdown that opens below or above its anchor, so neither
  // covers a popup that opens beside one — a submenu — running off the edge it opens towards.
  // That gets the same treatment as the vertical flip above: switch to the other side, but only
  // when it has more room, so a submenu with nowhere to go stays where the caller put it. The
  // width isn’t capped here; that’s done with `maxWidth` below.
  if (position.startsWith('right-')) {
    ({ position } = flip({
      position,
      from: 'right-',
      to: 'left-',
      size: contentWidth,
      room: rightMargin,
      otherRoom: leftMargin,
    }));
  } else if (position.startsWith('left-')) {
    ({ position } = flip({
      position,
      from: 'left-',
      to: 'right-',
      size: contentWidth,
      room: leftMargin,
      otherRoom: rightMargin,
    }));
  }

  const top = position.startsWith('bottom-')
    ? `${Math.round(rect.bottom)}px`
    : position.endsWith('-top')
      ? `${Math.round(rect.top)}px`
      : 'auto';

  const right = position.startsWith('left-')
    ? `${Math.round(viewport.width - rect.left)}px`
    : position.endsWith('-right')
      ? `${Math.round(viewport.width - rect.right)}px`
      : 'auto';

  const bottom = position.startsWith('top-')
    ? `${Math.round(viewport.height - rect.top)}px`
    : position.endsWith('-bottom')
      ? `${Math.round(viewport.height - rect.bottom)}px`
      : 'auto';

  const left = position.startsWith('right-')
    ? `${Math.round(rect.right)}px`
    : position.endsWith('-left')
      ? `${Math.round(rect.left)}px`
      : 'auto';

  return {
    inset: [top, right, bottom, left].join(' '),
    zIndex: 1000,
    minWidth: `${Math.round(rect.width)}px`,
    // A popup opening beside the anchor is capped by the room on that side, not by the width the
    // anchor’s own edges leave, which is what the two dropdown cases below measure
    maxWidth: position.startsWith('right-')
      ? `${Math.round(rightMargin)}px`
      : position.startsWith('left-')
        ? `${Math.round(leftMargin)}px`
        : position.endsWith('-left')
          ? `${Math.round(viewport.width - rect.left - 8)}px`
          : `${Math.round(rect.right - 8)}px`,
    // `undefined` removes the `max-height` the popup is given, letting it take its natural size
    // again. `auto` would look equivalent but isn’t a valid `max-height`, so the browser would
    // drop it and leave whatever limit was applied last in place.
    height: height ? `${Math.round(height)}px` : undefined,
  };
};

/**
 * Check if two objects have the same keys with strictly equal values.
 * @internal
 * @param {Record<string, any>} a One object.
 * @param {Record<string, any>} b Another object.
 * @returns {boolean} Whether the objects are shallowly equal.
 */
export const isShallowEqual = (a, b) => {
  const keys = Object.keys(a);

  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => Object.hasOwn(b, key) && a[key] === b[key])
  );
};
