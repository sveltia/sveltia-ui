import { isRTL } from '@sveltia/i18n';
import { generateElementId } from '@sveltia/utils/element';
import { sleep } from '@sveltia/utils/misc';
import { on } from 'svelte/events';
import { calculatePopupStyle, isShallowEqual, mirrorPosition } from './popup-position.js';

/**
 * @import { PopupPosition } from '$lib/typedefs';
 * @import { PopupStyle } from './popup-position.js';
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
    /** @type {PopupStyle} */
    ({
      inset: undefined,
      zIndex: undefined,
      minWidth: undefined,
      maxWidth: undefined,
      height: undefined,
    }),
  );

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
   * Functions that remove the event listeners added to the {@link anchorElement}, which may outlive
   * this instance.
   * @type {(() => void)[]}
   */
  #removeAnchorListeners = [];

  /**
   * ID of the animation frame requested to recalculate the position after a resize.
   * @type {number}
   */
  _rafId = 0;

  /**
   * Initialize a new `Popup` instance. Note that the `popupElement` is optional, because the
   * element is typically mounted only while the popup is open. Use {@link attachPopupElement} to
   * provide it later.
   * @param {HTMLElement} anchorElement Element that triggers the popup, typically a `<button>`.
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

    const removeClickListener = on(anchorElement, 'click', () => {
      if (!this.isDisabled && !this.isReadOnly) {
        this.open = !this.open;
      }
    });

    const removeKeyDownListener = on(anchorElement, 'keydown', (event) => {
      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
      const hasModifier = shiftKey || altKey || ctrlKey || metaKey;

      if (this.isDisabled || this.isReadOnly) {
        return;
      }

      if (['Enter', ' '].includes(key) && !hasModifier) {
        event.preventDefault();
        event.stopPropagation();
        this.open = !this.open;

        return;
      }

      // The arrow keys open a listbox or menu, the way they do a native `<select>`; Alt+Down is the
      // combobox convention (APG Select-Only Combobox, Menu Button). They never close one: inside
      // the popup they belong to the list. A menu item that opens a submenu is left alone: there
      // the arrows move through the parent menu, and the submenu opens with the inline arrow.
      if (
        ['ArrowDown', 'ArrowUp'].includes(key) &&
        !(shiftKey || ctrlKey || metaKey) &&
        (!altKey || key === 'ArrowDown') &&
        ['listbox', 'menu'].includes(anchorElement.getAttribute('aria-haspopup') ?? '') &&
        !anchorElement.matches('[role^="menuitem"]') &&
        !this.open
      ) {
        event.preventDefault();
        event.stopPropagation();
        this.open = true;
      }
    });

    const removeTransitionStartListener = on(anchorElement, 'transitionstart', () => {
      if (this.anchorElement.closest('.hiding, .hidden, [hidden]')) {
        this.hideImmediately();
      }
    });

    this.#removeAnchorListeners = [
      removeClickListener,
      removeKeyDownListener,
      removeTransitionStartListener,
    ];

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

    // Recalculate the position when the viewport is resized. This is needed in addition to the
    // `ResizeObserver` above, which only reacts to the anchor’s own size changing, not to it
    // simply moving — which happens, for example, when a dialog containing the anchor is
    // re-centered as the viewport is resized. This deliberately avoids the `resize` event on
    // `window`, which isn’t guaranteed to fire for every layout-affecting viewport change across
    // browsers; observing this popup’s own `<dialog>` element instead is reliable, because that
    // element is always sized to exactly `100dvw` × `100dvh` (see `Modal.svelte`), so its box
    // changes precisely when the viewport does — independent of the host app’s own CSS, unlike
    // watching `document.body` or `document.documentElement` would be.
    this.viewportResizeObserver = new ResizeObserver(() => {
      if (this.open) {
        this.checkPosition();
      }
    });

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
    this.viewportResizeObserver.observe(popupElement);

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
   * Detach the `<dialog>` element, typically because it’s being unmounted. The anchor’s
   * `aria-controls` attribute is removed as well, since the content is leaving the DOM tree.
   */
  detachPopupElement() {
    this.#removeEventListeners?.();
    this.#removeEventListeners = undefined;

    if (this.popupElement) {
      this.viewportResizeObserver.unobserve(this.popupElement);
    }

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
   * Check the position of the anchor element and, if the popup is mounted, recalculate and apply
   * its inset and size. This is a no-op while the popup element is not in the DOM tree; the caller
   * is expected to call this again once the element is attached.
   *
   * This measures the anchor synchronously with `getBoundingClientRect()` rather than reacting to
   * an `IntersectionObserver`, whose delivery isn’t guaranteed to be timely or frame-aligned the
   * way `ResizeObserver`’s is: a stale computation could arrive after a fresher one and silently
   * overwrite it, occasionally leaving the popup mispositioned after a resize.
   */
  checkPosition() {
    if (!this.popupElement) {
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

    // Measure the content at its natural size, with any limit previously applied here taken off
    // first. A popup that delegates its scrolling to a child — the combobox hands it to the option
    // list, so the filter stays put — reports a `scrollHeight` no larger than the `max-height` it’s
    // already capped at, and the same goes for `scrollWidth` against `max-width`. Measuring those
    // clipped values would make the cap stick: once the popup had shrunk to fit a small viewport,
    // it could never grow back when the viewport did. The properties are put back synchronously,
    // before the browser can paint, so nothing flickers.
    const anchorRect = this.positionBaseElement.getBoundingClientRect();
    const { maxHeight: appliedMaxHeight, maxWidth: appliedMaxWidth } = content.style;

    content.style.maxHeight = '';
    content.style.maxWidth = '';

    const { scrollHeight: contentHeight, scrollWidth: contentWidth } = content;

    content.style.maxHeight = appliedMaxHeight;
    content.style.maxWidth = appliedMaxWidth;

    const style = calculatePopupStyle({
      // Normalize RTL-friendly positions to LTR for LTR documents
      position: isRTL() ? mirrorPosition(this.position) : this.position,
      anchorRect,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      contentWidth,
      contentHeight,
    });

    if (!isShallowEqual(style, this.style)) {
      this.style = style;
    }
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
    this.#removeAnchorListeners.forEach((removeListener) => removeListener());
    this.#removeAnchorListeners = [];
    this.intersectionObserver?.disconnect();
    this.resizeObserver?.disconnect();
    this.viewportResizeObserver?.disconnect();

    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
    }
  }
}

/**
 * Activate a new popup.
 * @param {ConstructorParameters<typeof Popup>} args Arguments passed to the `Popup` constructor.
 * @returns {Popup} New popup.
 */
export const activatePopup = (...args) => new Popup(...args);
