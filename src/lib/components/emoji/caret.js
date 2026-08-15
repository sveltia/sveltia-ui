/**
 * @import { EmojiAnchorRect } from '$lib/typedefs';
 */

/**
 * CSS properties copied from the field onto the mirror element, so the mirror wraps and spaces the
 * text exactly as the field does. Anything that affects the position of a character has to be here.
 */
const MIRROR_STYLE_PROPERTIES = [
  'boxSizing',
  'width',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontFamily',
  'fontSize',
  'fontStretch',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'letterSpacing',
  'lineHeight',
  'tabSize',
  'textAlign',
  'textIndent',
  'textTransform',
  'wordBreak',
  'wordSpacing',
  'overflowWrap',
  'direction',
];

/**
 * Get the viewport-relative bounds of a range of characters within a text field.
 *
 * An `<input>` or `<textarea>` gives no way to ask where a character sits, so the field is
 * replicated with a hidden element carrying the same text and the same typography, and the range is
 * measured there. Only the offset within the mirror is used, which is then applied to the field’s
 * own position, so neither element has to be positioned relative to the other.
 * @param {HTMLInputElement | HTMLTextAreaElement} element Text field.
 * @param {number} start Index of the first character.
 * @param {number} end Index just past the last character.
 * @returns {EmojiAnchorRect | undefined} Bounds, or `undefined` if the field isn’t laid out.
 * @see https://github.com/component/textarea-caret-position
 */
export const getFieldCaretRect = (element, start, end) => {
  const fieldRect = element.getBoundingClientRect();

  // The field is hidden or detached, so there is nothing to anchor to
  if (!fieldRect.width && !fieldRect.height) {
    return undefined;
  }

  const style = globalThis.getComputedStyle(element);
  const singleLine = element.tagName === 'INPUT';
  const mirror = document.createElement('div');
  const marker = document.createElement('span');

  MIRROR_STYLE_PROPERTIES.forEach((property) => {
    /** @type {Record<string, any>} */ (mirror.style)[property] =
      /** @type {Record<string, any>} */ (style)[property];
  });

  Object.assign(mirror.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    height: 'auto',
    minHeight: '0',
    maxHeight: 'none',
    overflow: 'hidden',
    visibility: 'hidden',
    pointerEvents: 'none',
    // A single-line field never wraps, however long the value is
    whiteSpace: singleLine ? 'pre' : 'pre-wrap',
  });

  mirror.setAttribute('aria-hidden', 'true');
  mirror.textContent = element.value.slice(0, start);
  // A zero-width space keeps the marker measurable when the range is empty
  marker.textContent = element.value.slice(start, end) || '\u200B';
  mirror.append(marker);
  document.body.append(mirror);

  const mirrorRect = mirror.getBoundingClientRect();
  const markerRects = marker.getClientRects();
  // A wrapped range spans several lines; the last one is where the caret is
  const markerRect = markerRects[markerRects.length - 1] ?? marker.getBoundingClientRect();
  const offsetTop = markerRect.top - mirrorRect.top;
  const offsetLeft = markerRect.left - mirrorRect.left;
  const offsetRight = markerRect.right - mirrorRect.left;
  const height = markerRect.height || Number.parseFloat(style.lineHeight) || 0;

  mirror.remove();

  const top = fieldRect.top + offsetTop - element.scrollTop;
  const left = fieldRect.left + offsetLeft - element.scrollLeft;
  const right = fieldRect.left + offsetRight - element.scrollLeft;

  return { top, bottom: top + height, left, right };
};
