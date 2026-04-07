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
      this.anchorElement.focus();
      this.anchorElement.removeAttribute('aria-controls');
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

      const content = /** @type {HTMLElement} */ (this.popupElement.querySelector('.content'));
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
   * Initialize a new `Popup` instance.
   * @param {HTMLButtonElement} anchorElement `<button>` element that triggers the popup.
   * @param {HTMLDialogElement} popupElement `<dialog>` element to be used for the popup.
   * @param {PopupPosition} position Where to show the popup content.
   * @param {HTMLElement} [positionBaseElement] The base element of the `position`. If omitted, this
   * will be the `anchorElement`.
   */
  constructor(anchorElement, popupElement, position, positionBaseElement) {
    this.anchorElement = anchorElement;
    this.popupElement = popupElement; // = backdrop
    this.position = position;
    this.positionBaseElement = positionBaseElement ?? anchorElement;
    this.id = generateElementId('popup');

    this.anchorElement.setAttribute('aria-controls', this.id);
    this.popupElement.setAttribute('id', this.id);
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

    new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && this.open) {
        this.hideImmediately();
      }
    }).observe(this.anchorElement);

    // Close the popup when the backdrop, a menu item or an option is clicked
    on(this.popupElement, 'click', (event) => {
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

    on(this.popupElement, 'keydown', (event) => {
      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
      const hasModifier = shiftKey || altKey || ctrlKey || metaKey;

      if (key === 'Escape' && !hasModifier) {
        event.preventDefault();
        event.stopPropagation();
        this.open = false;
      }
    });

    // Update the popup width when the base element is resized
    new ResizeObserver(() => {
      cancelAnimationFrame(this._rafId);
      this._rafId = requestAnimationFrame(() => this.checkPosition());
    }).observe(this.positionBaseElement);
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
   * Check the position of the anchor element.
   */
  checkPosition() {
    this.observer.unobserve(this.positionBaseElement);
    this.observer.observe(this.positionBaseElement);
  }

  /**
   * Hide the popup immediately (when the anchor is being hidden).
   */
  async hideImmediately() {
    this.popupElement.hidden = true;
    this.open = false;
    await sleep(50);
    this.popupElement.hidden = false;
  }
}

/**
 * Activate a new popup.
 * @param {...any} args Arguments.
 * @returns {Popup} New popup.
 */
// @ts-ignore
export const activatePopup = (...args) => new Popup(...args);
