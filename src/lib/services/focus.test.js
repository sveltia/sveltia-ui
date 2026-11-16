import { afterEach, describe, expect, it } from 'vitest';
import { focusAdjacentTabStop, restoreFocus } from './focus.js';

afterEach(() => {
  document.body.innerHTML = '';
});

/**
 * Create a button that reports a layout box, which happy-dom doesn’t compute.
 * @param {string} label Label.
 * @param {boolean} [rendered] Whether the button has a layout box.
 * @returns {HTMLButtonElement} Button.
 */
const createButton = (label, rendered = true) => {
  const button = document.createElement('button');

  button.textContent = label;

  /**
   * Report a layout box only if rendered.
   * @returns {DOMRectList} Rects.
   */
  button.getClientRects = () =>
    /** @type {DOMRectList} */ (/** @type {unknown} */ (rendered ? [{}] : []));

  return button;
};

describe('focusAdjacentTabStop', () => {
  it('moves to the next or previous rendered tab stop', () => {
    const first = createButton('First');
    const hidden = createButton('Hidden', false);
    const middle = createButton('Middle');
    const disabled = createButton('Disabled');
    const last = createButton('Last');

    disabled.disabled = true;
    document.body.append(first, hidden, middle, disabled, last);
    focusAdjacentTabStop(middle, false);
    expect(document.activeElement).toBe(last);
    focusAdjacentTabStop(middle, true);
    expect(document.activeElement).toBe(first);
  });

  it('does nothing for an element that isn’t a tab stop candidate', () => {
    const div = document.createElement('div');
    const button = createButton('Button');

    document.body.append(div, button);
    focusAdjacentTabStop(div, false);
    expect(document.activeElement).toBe(document.body);
  });
});

describe('restoreFocus', () => {
  it('takes focus back from inside the container or from nowhere', () => {
    const opener = createButton('Opener');
    const container = document.createElement('div');
    const inside = createButton('Inside');

    container.appendChild(inside);
    document.body.append(opener, container);
    restoreFocus(opener, container);
    expect(document.activeElement).toBe(opener);
    inside.focus();
    restoreFocus(opener, container);
    expect(document.activeElement).toBe(opener);
  });

  it('leaves focus that has moved on elsewhere alone', () => {
    const opener = createButton('Opener');
    const elsewhere = createButton('Elsewhere');

    document.body.append(opener, elsewhere);
    elsewhere.focus();
    restoreFocus(opener, undefined);
    expect(document.activeElement).toBe(elsewhere);
  });

  it('leaves a disconnected element alone', () => {
    const opener = createButton('Opener');

    restoreFocus(opener, undefined);
    expect(document.activeElement).toBe(document.body);
  });
});
