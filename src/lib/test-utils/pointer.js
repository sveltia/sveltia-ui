/**
 * Helpers for dealing with the pointer in the browser tests.
 */

import { page, userEvent } from 'vitest/browser';

/**
 * Move the pointer to the top left corner of the viewport, out of the way. The pointer stays
 * wherever the last click left it, which may be right where the next test is about to render
 * something that reacts to being hovered, such as an option list that follows the pointer.
 */
export const parkPointer = async () => {
  const target = document.createElement('div');

  target.style.cssText = 'position: fixed; top: 0; left: 0; width: 2px; height: 2px;';
  document.body.appendChild(target);
  await userEvent.hover(page.elementLocator(target));
  target.remove();
};

/**
 * Let elements capture and release the pointer of synthetic pointer events in Firefox. Firefox
 * only treats the mouse as an active pointer in a page once the real mouse has moved over it, and
 * `setPointerCapture()` and `releasePointerCapture()` throw `NotFoundError` for any other pointer
 * ID, so synthetic events would fail where real ones wouldn’t. Other errors are thrown as usual,
 * and the other browsers are left alone, where an error would point to a wrong pointer ID.
 */
export const allowSyntheticPointerCapture = () => {
  if (!navigator.userAgent.includes('Firefox')) {
    return;
  }

  const { setPointerCapture, releasePointerCapture } = Element.prototype;

  /**
   * Wrap the given method to ignore an inactive pointer.
   * @param {(this: Element, pointerId: number) => void} method Original method.
   * @returns {(this: Element, pointerId: number) => void} Wrapped method.
   */
  const wrap = (method) =>
    function wrapped(pointerId) {
      try {
        method.call(this, pointerId);
      } catch (ex) {
        if (!(ex instanceof DOMException && ex.name === 'NotFoundError')) {
          throw ex;
        }
      }
    };

  Element.prototype.setPointerCapture = wrap(setPointerCapture);
  Element.prototype.releasePointerCapture = wrap(releasePointerCapture);
};
