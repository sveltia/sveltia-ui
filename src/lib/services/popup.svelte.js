/* eslint-disable no-nested-ternary */

import { generateElementId } from '@sveltia/utils/element';
import { sleep } from '@sveltia/utils/misc';
import { on } from 'svelte/events';
import { get, writable } from 'svelte/store';

/**
 * Implement the popup handler.
 */
class Popup {
  open = writable(false);

  /**
   * @type {import('svelte/store').Writable<{
   * inset: string | undefined,
   * zIndex: number | undefined,
   * minWidth: string | undefined,
   * maxWidth: string | undefined,
   * height: string | undefined,
   * }>}
   */
  style = writable({
    inset: undefined,
    zIndex: undefined,
    minWidth: undefined,
    maxWidth: undefined,
    height: undefined,
  });

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

      // Alter the position if the space is limited
      // @todo Handle more overflow cases
      if (position.startsWith('bottom-')) {
        if (contentHeight > bottomMargin) {
          if (topMargin > bottomMargin) {
            position = /** @type {import('$lib/typedefs').PopupPosition} */ (
              position.replace('bottom-', 'top-')
            );
            height = topMargin;
          } else {
            height = bottomMargin;
          }
        }
      }

      // If the popup overflows the viewport, change the position
      if (position.endsWith('-left')) {
        if (intersectionRect.left + contentWidth > rootBounds.width - 8) {
          position = /** @type {import('$lib/typedefs').PopupPosition} */ (
            position.replace('-left', '-right')
          );
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

      if (JSON.stringify(style) !== JSON.stringify(get(this.style))) {
        this.style.set(style);
      }
    });
  });

  /**
   * Initialize a new `Popup` instance.
   * @param {HTMLButtonElement} anchorElement - `<button>` element that triggers the popup.
   * @param {HTMLDialogElement} popupElement - `<dialog>` element to be used for the popup.
   * @param {import('$lib/typedefs').PopupPosition} position - Where to show the popup content.
   * @param {HTMLElement} [positionBaseElement] - The base element of the `position`. If omitted,
   * this will be the `anchorElement`.
   */
  constructor(anchorElement, popupElement, position, positionBaseElement) {
    this.anchorElement = anchorElement;
    this.popupElement = popupElement; // = backdrop
    this.position = position;
    this.positionBaseElement = positionBaseElement ?? anchorElement;
    this.id = generateElementId('popup');

    this.anchorElement.setAttribute('aria-controls', this.id);
    this.popupElement.setAttribute('id', this.id);

    on(anchorElement, 'click', () => {
      if (!this.isDisabled && !this.isReadOnly) {
        this.open.set(!get(this.open));
      }
    });

    on(anchorElement, 'keydown', (event) => {
      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
      const hasModifier = shiftKey || altKey || ctrlKey || metaKey;

      if (!this.isDisabled && !this.isReadOnly && ['Enter', ' '].includes(key) && !hasModifier) {
        event.preventDefault();
        event.stopPropagation();
        this.open.set(!get(this.open));
      }
    });

    on(anchorElement, 'transitionstart', () => {
      if (this.anchorElement.closest('.hiding, .hidden, [hidden]')) {
        this.hideImmediately();
      }
    });

    new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && get(this.open)) {
        this.hideImmediately();
      }
    }).observe(this.anchorElement);

    // Close the popup when the backdrop, a menu item or an option is clicked
    on(this.popupElement, 'click', (event) => {
      event.stopPropagation();

      // eslint-disable-next-line prefer-destructuring
      const target = /** @type {HTMLElement} */ (event.target);

      if (
        get(this.open) &&
        (target === this.popupElement || target.matches('[role^="menuitem"], [role="option"]'))
      ) {
        this.open.set(false);
      }
    });

    on(this.popupElement, 'keydown', (event) => {
      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
      const hasModifier = shiftKey || altKey || ctrlKey || metaKey;

      if (key === 'Escape' && !hasModifier) {
        event.preventDefault();
        event.stopPropagation();
        this.open.set(false);
      }
    });

    this.open.subscribe((open) => {
      if (open) {
        this.checkPosition();
      } else if (this.anchorElement.getAttribute('aria-expanded') === 'true') {
        this.anchorElement.focus();
        this.anchorElement.removeAttribute('aria-controls');
      }

      this.anchorElement.setAttribute('aria-expanded', String(open));
    });

    // Update the popup width when the base element is resized
    new ResizeObserver(() => {
      this.checkPosition();
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
    this.open.set(false);
    await sleep(50);
    this.popupElement.hidden = false;
  }
}

/**
 * Activate a new popup.
 * @param {...any} args - Arguments.
 * @returns {Popup} New popup.
 */
// @ts-ignore
export const activatePopup = (...args) => new Popup(...args);
