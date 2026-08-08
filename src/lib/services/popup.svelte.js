import { generateElementId } from '@sveltia/utils/element';
import { sleep } from '@sveltia/utils/misc';
import { on } from 'svelte/events';
/**
 * @import { PopupPosition } from '$lib/typedefs';
 */

/**
 * Implement the popup handler.
 */
class Popup {
  #open = $state(false);

  /**
   * Whether the popup is open.
   * @returns {boolean} `true` if the popup is open.
   */
  get open() {
    return this.#open;
  }

  /**
   * Open or close the popup, running side effects synchronously.
   * @param {boolean} value `true` to open, `false` to close.
   */
  set open(value) {
    this.#open = value;

    if (value) {
      this.checkPosition();
    } else if (this.anchorElement.getAttribute('aria-expanded') === 'true') {
      // Wait for the popup to close before focusing the anchor, otherwise the focus will be lost
      window.requestAnimationFrame(() => {
        const { activeElement } = document;

        // Only take focus back if it’s still inside the popup, or nowhere because the popup took it
        // down with itself. If it has already moved on — the user tabbed out of the menu, say —
        // pulling it back would undo what they just did.
        if (
          !activeElement ||
          activeElement === document.body ||
          this.popupElement?.contains(activeElement)
        ) {
          this.anchorElement.focus();
        }
      });
    }

    this.anchorElement.setAttribute('aria-expanded', String(value));
  }

  style = $state(
    /**
     * @type {{ inset: string | undefined, zIndex: number | undefined, minWidth: string | undefined,
     * maxWidth: string | undefined, height: string | undefined }}
     */
    ({
      inset: undefined,
      zIndex: undefined,
      minWidth: undefined,
      maxWidth: undefined,
      height: undefined,
    }),
  );

  observer = new IntersectionObserver((entries) => {
    entries.forEach(({ intersectionRect, rootBounds }) => {
      if (!intersectionRect || !rootBounds) {
        return;
      }

      // Use the tracked content element rather than searching the popup element, which for a nested
      // popup is the shared parent `<dialog>` and would yield the parent’s content
      const content = /** @type {HTMLElement | null} */ (
        this.contentElement ?? this.popupElement?.querySelector('.content') ?? null
      );

      // The content is not in the DOM tree yet; `checkPosition()` will be called again once the
      // popup element is attached
      if (!content) {
        return;
      }

      const { scrollHeight: contentHeight, scrollWidth: contentWidth } = content;
      const topMargin = intersectionRect.top - 8;
      const bottomMargin = rootBounds.height - intersectionRect.bottom - 8;
      let { position } = this;
      let height;

      // Normalize RTL-friendly positions to LTR for LTR documents
      // @todo Rename `PopupPosition` enums to be direction-agnostic
      if (document.dir === 'rtl') {
        if (position.endsWith('-left')) {
          position = /** @type {PopupPosition} */ (position.replace('-left', '-right'));
        } else if (position.endsWith('-right')) {
          position = /** @type {PopupPosition} */ (position.replace('-right', '-left'));
        }

        if (position.startsWith('left-')) {
          position = /** @type {PopupPosition} */ (position.replace('left-', 'right-'));
        } else if (position.startsWith('right-')) {
          position = /** @type {PopupPosition} */ (position.replace('right-', 'left-'));
        }
      }

      // Alter the position if the space is limited
      // @todo Handle more overflow cases
      if (position.startsWith('bottom-')) {
        if (contentHeight > bottomMargin) {
          if (topMargin > bottomMargin) {
            position = /** @type {PopupPosition} */ (position.replace('bottom-', 'top-'));
            height = topMargin;
          } else {
            height = bottomMargin;
          }
        }
      }

      // If the popup overflows the viewport, change the position
      if (position.endsWith('-left')) {
        if (intersectionRect.left + contentWidth > rootBounds.width - 8) {
          position = /** @type {PopupPosition} */ (position.replace('-left', '-right'));
        }
      }

      if (position.endsWith('-right')) {
        if (intersectionRect.right - contentWidth < 8) {
          position = /** @type {PopupPosition} */ (position.replace('-right', '-left'));
        }
      }

      const top = position.startsWith('bottom-')
        ? `${Math.round(intersectionRect.bottom)}px`
        : position.endsWith('-top')
          ? `${Math.round(intersectionRect.top)}px`
          : 'auto';

      const right = position.startsWith('left-')
        ? `${Math.round(rootBounds.width - intersectionRect.left)}px`
        : position.endsWith('-right')
          ? `${Math.round(rootBounds.width - intersectionRect.right)}px`
          : 'auto';

      const bottom = position.startsWith('top-')
        ? `${Math.round(rootBounds.height - intersectionRect.top)}px`
        : position.endsWith('-bottom')
          ? `${Math.round(rootBounds.height - intersectionRect.bottom)}px`
          : 'auto';

      const left = position.startsWith('right-')
        ? `${Math.round(intersectionRect.right)}px`
        : position.endsWith('-left')
          ? `${Math.round(intersectionRect.left)}px`
          : 'auto';

      const style = {
        inset: [top, right, bottom, left].join(' '),
        zIndex: 1000,
        minWidth: `${Math.round(intersectionRect.width)}px`,
        maxWidth: position.endsWith('-left')
          ? `${Math.round(rootBounds.width - intersectionRect.left - 8)}px`
          : `${Math.round(intersectionRect.right - 8)}px`,
        height: height ? `${Math.round(height)}px` : 'auto',
      };

      if (
        style.inset !== this.style.inset ||
        style.zIndex !== this.style.zIndex ||
        style.minWidth !== this.style.minWidth ||
        style.maxWidth !== this.style.maxWidth ||
        style.height !== this.style.height
      ) {
        this.style = style;
      }
    });
  });

  /**
   * A reference to the `<dialog>` element used for the popup, which also serves as the backdrop.
   * This is `undefined` while the element is not in the DOM tree, which is the case for a closed
   * popup that doesn’t keep its content.
   * @type {HTMLDialogElement | undefined}
   */
  popupElement = undefined;

  /**
   * A reference to the element holding the popup content. Unlike {@link popupElement}, which a
   * nested popup shares with its parent, this element belongs to this popup alone, so it’s the one
   * that carries the {@link id} and that the anchor’s `aria-controls` points at.
   * @type {HTMLElement | undefined}
   */
  contentElement = undefined;

  /**
   * Function that removes the event listeners added to the current {@link popupElement}.
   * @type {(() => void) | undefined}
   */
  #removeEventListeners = undefined;

  /**
   * Initialize a new `Popup` instance. Note that the `popupElement` is optional, because the
   * element is typically mounted only while the popup is open. Use {@link attachPopupElement} to
   * provide it later.
   * @param {HTMLButtonElement} anchorElement `<button>` element that triggers the popup.
   * @param {HTMLDialogElement | undefined} popupElement `<dialog>` element to be used for the
   * popup, if it’s already in the DOM tree.
   * @param {PopupPosition} position Where to show the popup content.
   * @param {HTMLElement} [positionBaseElement] The base element of the `position`. If omitted, this
   * will be the `anchorElement`.
   */
  constructor(anchorElement, popupElement, position, positionBaseElement) {
    this.anchorElement = anchorElement;
    this.position = position;
    this.positionBaseElement = positionBaseElement ?? anchorElement;
    this.id = generateElementId('popup');

    this.anchorElement.setAttribute('aria-expanded', 'false');

    on(anchorElement, 'click', () => {
      if (!this.isDisabled && !this.isReadOnly) {
        this.open = !this.open;
      }
    });

    on(anchorElement, 'keydown', (event) => {
      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
      const hasModifier = shiftKey || altKey || ctrlKey || metaKey;

      if (!this.isDisabled && !this.isReadOnly && ['Enter', ' '].includes(key) && !hasModifier) {
        event.preventDefault();
        event.stopPropagation();
        this.open = !this.open;
      }
    });

    on(anchorElement, 'transitionstart', () => {
      if (this.anchorElement.closest('.hiding, .hidden, [hidden]')) {
        this.hideImmediately();
      }
    });

    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && this.open) {
        this.hideImmediately();
      }
    });
    this.intersectionObserver.observe(this.anchorElement);

    // Update the popup width when the base element is resized
    this.resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(this._rafId);
      this._rafId = requestAnimationFrame(() => this.checkPosition());
    });
    this.resizeObserver.observe(this.positionBaseElement);

    if (popupElement) {
      this.attachPopupElement(popupElement);
    }
  }

  /**
   * Attach the `<dialog>` element used for the popup. This is called every time the element is
   * mounted, which happens on each open.
   * @param {HTMLDialogElement} popupElement `<dialog>` element to be used for the popup. A nested
   * popup shares this with its parent, so it must not be labelled as belonging to this popup.
   * @param {HTMLElement} [contentElement] Element holding this popup’s content. When omitted, the
   * `popupElement` is assumed to hold the content on its own.
   */
  attachPopupElement(popupElement, contentElement) {
    if (this.popupElement === popupElement && this.contentElement === contentElement) {
      return;
    }

    this.detachPopupElement();
    this.popupElement = popupElement;
    this.contentElement = contentElement;

    // Identify the popup by the element that actually holds its content. Labelling the `<dialog>`
    // would be wrong for a nested popup, which shares its parent’s: it would overwrite the parent’s
    // own `id` and leave the anchor pointing at the parent instead of the submenu.
    const identifiedElement = contentElement ?? popupElement;

    identifiedElement.id = this.id;
    this.anchorElement.setAttribute('aria-controls', this.id);

    // Close the popup when the backdrop, a menu item or an option is clicked
    const removeClickListener = on(popupElement, 'click', (event) => {
      event.stopPropagation();

      // eslint-disable-next-line prefer-destructuring
      const target = /** @type {HTMLElement} */ (event.target);

      if (
        this.open &&
        (target === this.popupElement || target.matches('[role^="menuitem"], [role="option"]'))
      ) {
        this.open = false;
      }
    });

    const removeKeyDownListener = on(popupElement, 'keydown', (event) => {
      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
      const hasModifier = shiftKey || altKey || ctrlKey || metaKey;

      if (key === 'Escape' && !hasModifier) {
        event.preventDefault();
        event.stopPropagation();
        this.open = false;
      }
    });

    /**
     * Remove the listeners added above.
     */
    this.#removeEventListeners = () => {
      removeClickListener();
      removeKeyDownListener();
    };
  }

  /**
   * Detach the `<dialog>` element, typically because it’s being unmounted. The `aria-controls`
   * attribute on the anchor is left to the {@link open} setter, which removes it once the closing
   * animation is complete.
   */
  detachPopupElement() {
    this.#removeEventListeners?.();
    this.#removeEventListeners = undefined;

    // The content is leaving the DOM tree, so the anchor must stop referencing it. Only clear a
    // reference this popup owns; the consumer may have pointed the anchor somewhere else.
    if (this.anchorElement.getAttribute('aria-controls') === this.id) {
      this.anchorElement.removeAttribute('aria-controls');
    }

    this.popupElement = undefined;
    this.contentElement = undefined;
  }

  /**
   * Whether the anchor element is disabled.
   * @type {boolean}
   */
  get isDisabled() {
    return this.anchorElement.matches('[aria-disabled="true"]');
  }

  /**
   * Whether the anchor element is read-only.
   * @type {boolean}
   */
  get isReadOnly() {
    return this.anchorElement.matches('[aria-readonly="true"]');
  }

  /**
   * Check the position of the anchor element. This is a no-op while the popup element is not in the
   * DOM tree; the caller is expected to call this again once the element is attached.
   */
  checkPosition() {
    if (!this.popupElement) {
      return;
    }

    this.observer.unobserve(this.positionBaseElement);
    this.observer.observe(this.positionBaseElement);
  }

  /**
   * Hide the popup immediately (when the anchor is being hidden).
   */
  async hideImmediately() {
    if (this.popupElement) {
      this.popupElement.hidden = true;
    }

    this.open = false;
    await sleep(50);

    // The element may have been unmounted in the meantime
    if (this.popupElement) {
      this.popupElement.hidden = false;
    }
  }

  /**
   * Dispose of the popup, disconnecting observers and canceling pending work.
   */
  destroy() {
    this.detachPopupElement();
    this.intersectionObserver?.disconnect();
    this.resizeObserver?.disconnect();
    this.observer?.disconnect();

    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
    }
  }
}

/**
 * Activate a new popup.
 * @param {...any} args Arguments.
 * @returns {Popup} New popup.
 */
// @ts-ignore
export const activatePopup = (...args) => new Popup(...args);
