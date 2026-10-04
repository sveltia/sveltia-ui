/**
 * Activation scaffolding shared by the composite widgets, `Group` and `Tree`, which set up their
 * members only once the child components have had a chance to mount.
 */

import { sleep } from '@sveltia/utils/misc';

/**
 * @typedef {object} ActivatableWidget
 * @property {() => void} activate Set up the members, unless they already are.
 */

/**
 * Create an event listener that activates the widget before handing the event on, so an event
 * that comes before the delayed activation is not lost.
 * @template {Event} E
 * @param {ActivatableWidget} widget Widget.
 * @param {(event: E) => void} handler Function that handles the event.
 * @returns {(event: E) => void} Event listener.
 */
export const activateBefore = (widget, handler) => (event) => {
  widget.activate();
  handler(event);
};

/**
 * Activate the widget after a short delay, giving the relevant components time to mount, unless
 * the widget has been destroyed in the meantime.
 * @param {ActivatableWidget} widget Widget.
 * @param {() => boolean} isDestroyed Function that tells whether the widget has been destroyed.
 */
export const activateLater = async (widget, isDestroyed) => {
  await sleep(100);

  // The widget may have been unmounted in the meantime
  if (!isDestroyed()) {
    widget.activate();
  }
};
