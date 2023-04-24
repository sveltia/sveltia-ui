/* eslint-disable max-len */
/* eslint-disable no-nested-ternary */

import { get, writable } from 'svelte/store';
import { getRandomId } from './util';

/**
 * @typedef {('top-left'|'top-right'|'right-top'|'right-bottom'|'bottom-left'|'bottom-right'|'left-top'|'left-bottom')} PopupPosition
 */

class Popup {
  open = writable(false);

  style = writable({ inset: undefined, zIndex: undefined, width: undefined, height: undefined });

  observer = new IntersectionObserver((entries) => {
    entries.forEach(({ intersectionRect, rootBounds }) => {
      if (!intersectionRect || !rootBounds) {
        return;
      }

      const contentHeight = this.popupElement.querySelector('.content').scrollHeight;
      const topMargin = intersectionRect.top - 8;
      const bottomMargin = rootBounds.height - intersectionRect.bottom - 8;
      let { position } = this;
      let height;

      // Alter the position if the space is limited
      // @todo Handle more overflow cases
      if (position.startsWith('bottom-')) {
        if (contentHeight > bottomMargin) {
          if (topMargin > bottomMargin) {
            position = position.replace('bottom-', 'top-');
            height = topMargin;
          } else {
            height = bottomMargin;
          }
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

      const anchorPopup = this.anchorElement.closest('.popup');

      const style = {
        inset: [top, right, bottom, left].join(' '),
        zIndex: anchorPopup ? Number(anchorPopup.style.zIndex) + 1 : 1000,
        width: `${Math.round(intersectionRect.width)}px`,
        height: height ? `${Math.round(height)}px` : 'auto',
      };

      if (JSON.stringify(style) !== JSON.stringify(get(this.style))) {
        this.style.set(style);
      }
    });
  });

  /**
   *
   * @param {HTMLElement} anchorElement
   * @param {HTMLElement} popupElement
   * @param {PopupPosition} position
   */
  constructor(anchorElement, popupElement, position) {
    this.anchorElement = anchorElement;
    this.popupElement = popupElement; // = backdrop
    this.position = position;
    this.id = getRandomId('popup');

    this.anchorElement.setAttribute('aria-controls', this.id);
    this.popupElement.setAttribute('id', this.id);

    this.anchorElement.addEventListener('click', () => {
      if (!this.anchorElement.matches('[aria-disabled="true"]')) {
        this.open.set(!get(this.open));
      }
    });

    this.anchorElement.addEventListener('keydown', (event) => {
      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;

      if (!ctrlKey && !metaKey && !shiftKey && !altKey) {
        if (key === ' ' || key === 'Enter') {
          event.stopPropagation();
          this.open.set(!get(this.open));
        }
      }
    });

    this.popupElement.addEventListener('click', (event) => {
      if (get(this.open) && event.target !== this.anchorElement) {
        this.open.set(false);
      }
    });

    [this.anchorElement, this.popupElement].forEach((element) => {
      element.addEventListener('keydown', (event) => {
        const { key, ctrlKey, metaKey, shiftKey, altKey } = event;

        if (
          get(this.open) &&
          ['Escape'].includes(key) &&
          !ctrlKey &&
          !metaKey &&
          !shiftKey &&
          !altKey
        ) {
          this.open.set(false);
        }
      });
    });

    this.open.subscribe((open) => {
      if (open) {
        this.checkPosition();
      } else if (this.anchorElement.getAttribute('aria-expanded') === 'true') {
        this.anchorElement.focus();
      }

      this.anchorElement.setAttribute('aria-expanded', open);
    });
  }

  /**
   * Continue checking the position in case the window or parent element resizes.
   */
  checkPosition() {
    this.observer.observe(this.anchorElement);

    window.requestAnimationFrame(() => {
      this.observer.unobserve(this.anchorElement);

      if (get(this.open)) {
        this.checkPosition();
      }
    });
  }
}

/**
 *
 */
export const activatePopup = (...args) => new Popup(...args);
