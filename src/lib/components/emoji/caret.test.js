import { afterEach, describe, expect, it, vi } from 'vitest';
import { getFieldCaretRect } from './caret.js';

/**
 * Give an element a fixed bounding box, since the test environment has no layout engine.
 * @param {Element} element Element to fake.
 * @param {{ top?: number, left?: number, right?: number, bottom?: number, width?: number,
 * height?: number }} rect Box to report.
 */
const setRect = (element, rect) => {
  const box = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    ...rect,
  };

  element.getBoundingClientRect = vi.fn(() => /** @type {DOMRect} */ (/** @type {any} */ (box)));
};

/**
 * Create a field with a fixed bounding box, the way a laid-out one would report it.
 * @param {object} [options] Options.
 * @param {string} [options.tag] Element tag, either `textarea` or `input`.
 * @param {string} [options.value] Field value.
 * @param {number} [options.scrollTop] Vertical scroll offset.
 * @param {number} [options.scrollLeft] Horizontal scroll offset.
 * @returns {any} Field element.
 */
const createField = ({ tag = 'textarea', value = '', scrollTop = 0, scrollLeft = 0 } = {}) => {
  const element = /** @type {any} */ (document.createElement(tag));

  element.value = value;
  Object.defineProperty(element, 'scrollTop', { value: scrollTop, writable: true });
  Object.defineProperty(element, 'scrollLeft', { value: scrollLeft, writable: true });
  setRect(element, { top: 100, left: 40, right: 340, bottom: 160, width: 300, height: 60 });
  document.body.append(element);

  return element;
};

/**
 * Intercept the mirror and marker the measurement creates, so their geometry can be faked and
 * inspected. Both are created with `document.createElement()` and are the only elements created
 * while the measurement runs.
 * @param {object} geometry Boxes to report.
 * @param {any} geometry.mirror Box for the mirror.
 * @param {any} geometry.marker Box for the marker, or boxes when the range wraps across lines.
 * @returns {{ mirror?: any, marker?: any }} The elements, once the measurement has created them.
 */
const interceptMirror = ({ mirror: mirrorRect, marker: markerRect }) => {
  /** @type {{ mirror?: any, marker?: any }} */
  const created = {};
  const { createElement } = document;

  vi.spyOn(document, 'createElement').mockImplementation((tag, options) => {
    const element = createElement.call(document, tag, options);

    if (tag === 'div' && !created.mirror) {
      created.mirror = element;
      setRect(element, mirrorRect);
    }

    if (tag === 'span' && !created.marker) {
      created.marker = element;

      const boxes = Array.isArray(markerRect) ? markerRect : [markerRect];

      setRect(element, boxes[boxes.length - 1]);
      element.getClientRects = vi.fn(() => /** @type {DOMRectList} */ (/** @type {any} */ (boxes)));
    }

    return element;
  });

  return created;
};

describe('getFieldCaretRect', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('should return nothing when the field has no layout, as when it’s hidden', () => {
    const element = document.createElement('textarea');

    element.value = 'Hello :tada';
    setRect(element, {});

    expect(getFieldCaretRect(element, 6, 11)).toBeUndefined();
  });

  it('should place the shortcode relative to the field, from its offset within the mirror', () => {
    const element = createField({ value: 'Hello :tada' });

    interceptMirror({
      mirror: { top: 0, left: 0 },
      marker: { top: 20, left: 55, right: 90, height: 18 },
    });

    // Field at (40, 100), shortcode 20 down and 55 across within the mirror
    expect(getFieldCaretRect(element, 6, 11)).toEqual({
      top: 120,
      bottom: 138,
      left: 95,
      right: 130,
    });
  });

  it('should measure from the mirror’s own origin, not the viewport', () => {
    const element = createField({ value: 'Hello :tada' });

    // The mirror sits wherever the document flow puts it; only the offset within it matters
    interceptMirror({
      mirror: { top: 500, left: 300 },
      marker: { top: 520, left: 355, right: 390, height: 18 },
    });

    expect(getFieldCaretRect(element, 6, 11)).toEqual({
      top: 120,
      bottom: 138,
      left: 95,
      right: 130,
    });
  });

  it('should subtract the field’s scroll offsets', () => {
    const element = createField({ value: 'Hello :tada', scrollTop: 12, scrollLeft: 7 });

    interceptMirror({
      mirror: { top: 0, left: 0 },
      marker: { top: 20, left: 55, right: 90, height: 18 },
    });

    expect(getFieldCaretRect(element, 6, 11)).toEqual({
      top: 108,
      bottom: 126,
      left: 88,
      right: 123,
    });
  });

  it('should anchor to the last line when the shortcode wraps', () => {
    const element = createField({ value: 'Hello :tada' });

    interceptMirror({
      mirror: { top: 0, left: 0 },
      marker: [
        { top: 20, left: 250, right: 300, height: 18 },
        { top: 38, left: 0, right: 25, height: 18 },
      ],
    });

    // The caret is on the second line, so that’s where the dropdown belongs
    expect(getFieldCaretRect(element, 6, 11)).toEqual({
      top: 138,
      bottom: 156,
      left: 40,
      right: 65,
    });
  });

  it('should split the value at the shortcode, so the mirror lays out the same text', () => {
    const element = createField({ value: 'Hello :tada world' });

    const created = interceptMirror({
      mirror: { top: 0, left: 0 },
      marker: { top: 0, left: 0, right: 10, height: 18 },
    });

    getFieldCaretRect(element, 6, 11);

    expect(created.mirror.textContent).toBe('Hello :tada');
    expect(created.marker.textContent).toBe(':tada');
  });

  it('should keep the marker measurable when the range is empty', () => {
    const element = createField({ value: 'Hello' });

    const created = interceptMirror({
      mirror: { top: 0, left: 0 },
      marker: { top: 0, left: 0, right: 0, height: 18 },
    });

    getFieldCaretRect(element, 5, 5);

    expect(created.marker.textContent).toBe('\u200B');
  });

  it('should let a textarea wrap but never a single-line input', () => {
    const textarea = createField({ tag: 'textarea', value: 'Hello :tada' });
    const marker = { top: 0, left: 0, right: 10, height: 18 };
    const firstCreated = interceptMirror({ mirror: { top: 0, left: 0 }, marker });

    getFieldCaretRect(textarea, 6, 11);
    expect(firstCreated.mirror.style.whiteSpace).toBe('pre-wrap');
    vi.restoreAllMocks();

    const input = createField({ tag: 'input', value: 'Hello :tada' });
    const secondCreated = interceptMirror({ mirror: { top: 0, left: 0 }, marker });

    getFieldCaretRect(input, 6, 11);
    expect(secondCreated.mirror.style.whiteSpace).toBe('pre');
  });

  it('should copy the field’s typography, so the text is laid out identically', () => {
    const element = createField({ value: 'Hello :tada' });

    element.style.fontSize = '17px';
    element.style.letterSpacing = '2px';
    element.style.paddingLeft = '9px';

    const created = interceptMirror({
      mirror: { top: 0, left: 0 },
      marker: { top: 0, left: 0, right: 10, height: 18 },
    });

    getFieldCaretRect(element, 6, 11);

    const { style } = created.mirror;

    expect(style.fontSize).toBe('17px');
    expect(style.letterSpacing).toBe('2px');
    expect(style.paddingLeft).toBe('9px');
  });

  it('should fall back to the line height when the marker reports none', () => {
    const element = createField({ value: 'Hello :tada' });

    element.style.lineHeight = '24px';

    interceptMirror({
      mirror: { top: 0, left: 0 },
      marker: { top: 0, left: 0, right: 10, height: 0 },
    });

    expect(getFieldCaretRect(element, 6, 11)?.bottom).toBe(124);
  });

  it('should fall back to the marker’s own box when it reports no client rects', () => {
    const element = createField({ value: 'Hello :tada' });

    // An empty range, or one the browser declines to measure, yields no client rects
    interceptMirror({ mirror: { top: 0, left: 0 }, marker: [] });
    element.style.lineHeight = '20px';

    expect(getFieldCaretRect(element, 6, 11)).toEqual({
      top: 100,
      bottom: 120,
      left: 40,
      right: 40,
    });
  });

  it('should treat an unresolvable line height as no height at all', () => {
    const element = createField({ value: 'Hello :tada' });

    // `line-height: normal` computes to a keyword rather than a length
    element.style.lineHeight = 'normal';
    interceptMirror({
      mirror: { top: 0, left: 0 },
      marker: { top: 0, left: 0, right: 10, height: 0 },
    });

    const rect = getFieldCaretRect(element, 6, 11);

    expect(rect?.bottom).toBe(rect?.top);
  });

  it('should not leave the mirror behind in the document', () => {
    const element = createField({ value: 'Hello :tada' });

    interceptMirror({
      mirror: { top: 0, left: 0 },
      marker: { top: 0, left: 0, right: 10, height: 18 },
    });

    getFieldCaretRect(element, 6, 11);

    expect(document.querySelectorAll('div[aria-hidden="true"]')).toHaveLength(0);
  });
});
