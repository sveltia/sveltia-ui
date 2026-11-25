import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitForTooltipActivation } from './tooltip-activation.js';

/**
 * Create a button in the document.
 * @param {Node} [parent] Parent node.
 * @returns {HTMLButtonElement} Button.
 */
const createButton = (parent = document.body) => {
  const button = document.createElement('button');

  parent.appendChild(button);

  return button;
};

/**
 * Fire `pointerenter` at an element, as the browser does: not bubbling, so only the capture phase
 * reaches the document.
 * @param {Element} element Element.
 * @param {string} pointerType Pointer type.
 */
const enter = (element, pointerType) => {
  element.dispatchEvent(new PointerEvent('pointerenter', { pointerType }));
};

/**
 * Fire `focusin` at an element.
 * @param {Element} element Element.
 */
const focusIn = (element) => {
  element.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
};

describe('waitForTooltipActivation', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should call back once when the pointer enters the anchor', () => {
    const anchor = createButton();
    const callback = vi.fn();

    waitForTooltipActivation(anchor, callback);
    enter(document.body, 'mouse');
    expect(callback).not.toHaveBeenCalled();
    enter(anchor, 'mouse');
    expect(callback).toHaveBeenCalledExactlyOnceWith('pointer');
    enter(anchor, 'mouse');
    focusIn(anchor);
    expect(callback).toHaveBeenCalledOnce();
  });

  it('should ignore a touch', () => {
    const anchor = createButton();
    const callback = vi.fn();

    waitForTooltipActivation(anchor, callback);
    enter(anchor, 'touch');
    expect(callback).not.toHaveBeenCalled();
    enter(anchor, 'pen');
    expect(callback).toHaveBeenCalledExactlyOnceWith('pointer');
  });

  it('should call back when the focus moves into the anchor', () => {
    const anchor = document.createElement('div');
    const child = createButton(anchor);
    const callback = vi.fn();

    document.body.appendChild(anchor);
    waitForTooltipActivation(anchor, callback);
    focusIn(document.body);
    expect(callback).not.toHaveBeenCalled();
    focusIn(child);
    expect(callback).toHaveBeenCalledExactlyOnceWith('focus');
  });

  it('should call back every tooltip of the same anchor', () => {
    const anchor = createButton();
    const first = vi.fn();
    const second = vi.fn();

    waitForTooltipActivation(anchor, first);
    waitForTooltipActivation(anchor, second);
    focusIn(anchor);
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it('should stop waiting when asked to', () => {
    const anchor = createButton();
    const first = vi.fn();
    const second = vi.fn();
    const stopFirst = waitForTooltipActivation(anchor, first);
    const stopSecond = waitForTooltipActivation(anchor, second);

    stopFirst();
    focusIn(anchor);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
    // Stopping after the call, or twice, is harmless
    stopSecond();
    stopFirst();

    const third = vi.fn();
    const stopThird = waitForTooltipActivation(anchor, third);

    stopThird();
    focusIn(anchor);
    expect(third).not.toHaveBeenCalled();
  });

  it('should listen once per document or shadow root, including in a shadow root', () => {
    const host = createButton();
    const shadowRoot = host.attachShadow({ mode: 'open' });
    const anchor = createButton(/** @type {Node} */ (/** @type {unknown} */ (shadowRoot)));
    const other = createButton(/** @type {Node} */ (/** @type {unknown} */ (shadowRoot)));
    const addEventListener = vi.spyOn(shadowRoot, 'addEventListener');
    const callback = vi.fn();

    waitForTooltipActivation(anchor, callback);
    waitForTooltipActivation(other, vi.fn());
    expect(addEventListener).toHaveBeenCalledTimes(2);
    enter(anchor, 'mouse');
    expect(callback).toHaveBeenCalledExactlyOnceWith('pointer');
  });
});
