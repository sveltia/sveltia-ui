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
