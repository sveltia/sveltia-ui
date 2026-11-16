/**
 * Pointer drag lifecycle shared by the widgets that can be dragged, such as `<ResizableHandle>` and
 * `<Slider>`.
 */

/**
 * @typedef {object} PointerDragHandlers
 * @property {(event: PointerEvent) => void} [onMove] Called with each `pointermove` event of the
 * dragging pointer while the drag goes on.
 * @property {(event: PointerEvent) => void} [onEnd] Called once when the drag ends, with the
 * `pointerup` or `pointercancel` event, or with the `pointermove` event of a mouse that no longer
 * has the primary button held down.
 */

/**
 * Start dragging with the pointer that has just been pressed. The pointer is captured by the given
 * element, and its moves and release are followed on the `document` until the drag ends. Events of
 * other pointers are ignored.
 * @internal
 * @param {HTMLElement} element Element to capture the pointer.
 * @param {PointerEvent} event `pointerdown` event that starts the drag.
 * @param {PointerDragHandlers} handlers Event handlers.
 * @returns {() => void} Function to stop following the pointer without calling `onEnd`, for example
 * when the element is removed in the middle of a drag. It does nothing once the drag has ended.
 */
export const startPointerDrag = (element, { pointerId }, { onMove, onEnd }) => {
  /**
   * Stop following the pointer, and release it.
   */
  const stop = () => {
    // eslint-disable-next-line no-use-before-define
    document.removeEventListener('pointermove', onPointerMove);
    // eslint-disable-next-line no-use-before-define
    document.removeEventListener('pointerup', onPointerUp);
    // eslint-disable-next-line no-use-before-define
    document.removeEventListener('pointercancel', onPointerUp);

    if (element.hasPointerCapture(pointerId)) {
      element.releasePointerCapture(pointerId);
    }
  };

  /**
   * End the drag.
   * @param {PointerEvent} event Event that ends the drag.
   */
  const end = (event) => {
    stop();
    onEnd?.(event);
  };

  /**
   * Handle the `pointermove` event fired anywhere on the page.
   * @param {PointerEvent} event `pointermove` event.
   */
  const onPointerMove = (event) => {
    if (event.pointerId !== pointerId) {
      return;
    }

    // The `pointerup` event may never come, for example when a context menu opened during the drag
    // swallowed it, so a mouse moved without the primary button held down ends the drag instead of
    // carrying on. The primary button is the lowest bit of `buttons`.
    if (event.pointerType === 'mouse' && event.buttons % 2 === 0) {
      end(event);

      return;
    }

    onMove?.(event);
  };

  /**
   * Handle the `pointerup` and `pointercancel` events fired anywhere on the page.
   * @param {PointerEvent} event `pointerup` or `pointercancel` event.
   */
  const onPointerUp = (event) => {
    if (event.pointerId === pointerId) {
      end(event);
    }
  };

  element.setPointerCapture(pointerId);
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);
  document.addEventListener('pointercancel', onPointerUp);

  return stop;
};
