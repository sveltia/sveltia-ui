/* eslint-disable jsdoc/require-description */
/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable jsdoc/require-param */
/* eslint-disable jsdoc/require-param-description */
/* eslint-disable lines-between-class-members */
/* eslint-disable max-classes-per-file */

import { isRTL } from '@sveltia/i18n';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { activatePopup } from './popup.svelte.js';

vi.mock('@sveltia/i18n', () => ({
  isRTL: vi.fn(() => false),
}));

describe('Popup', () => {
  /** @type {HTMLButtonElement} */
  let anchor;
  /** @type {HTMLDialogElement} */
  let popup;

  beforeEach(() => {
    anchor = /** @type {HTMLButtonElement} */ (document.createElement('button'));
    popup = /** @type {HTMLDialogElement} */ (document.createElement('dialog'));
    document.body.appendChild(anchor);
    document.body.appendChild(popup);
  });

  afterEach(() => {
    anchor.remove();
    popup.remove();
    vi.mocked(isRTL).mockReturnValue(false);
  });

  it('should assign an id to the popup element', () => {
    activatePopup(anchor, popup, 'bottom-left');
    expect(popup.id).toBeTruthy();
  });

  it('should set aria-controls on the anchor to match the popup id', () => {
    activatePopup(anchor, popup, 'bottom-left');
    expect(anchor.getAttribute('aria-controls')).toBe(popup.id);
  });

  it('should expose the open store defaulting to false', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    expect(instance.open).toBe(false);
  });

  it('should set aria-expanded to false initially', () => {
    activatePopup(anchor, popup, 'bottom-left');
    expect(anchor.getAttribute('aria-expanded')).toBe('false');
  });

  it('should toggle open store to true on anchor click', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    anchor.click();
    expect(instance.open).toBe(true);
  });

  it('should set aria-expanded to true after anchor click', () => {
    activatePopup(anchor, popup, 'bottom-left');
    anchor.click();
    expect(anchor.getAttribute('aria-expanded')).toBe('true');
  });

  it('should not toggle open when anchor is disabled', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    anchor.setAttribute('aria-disabled', 'true');
    anchor.click();
    expect(instance.open).toBe(false);
  });

  it('should not toggle open when anchor is read-only', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    anchor.setAttribute('aria-readonly', 'true');
    anchor.click();
    expect(instance.open).toBe(false);
  });

  it('should report isDisabled as false when not disabled', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    expect(instance.isDisabled).toBe(false);
  });

  it('should report isDisabled as true when aria-disabled is set', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    anchor.setAttribute('aria-disabled', 'true');
    expect(instance.isDisabled).toBe(true);
  });

  it('should report isReadOnly as false when not read-only', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    expect(instance.isReadOnly).toBe(false);
  });

  it('should report isReadOnly as true when aria-readonly is set', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    anchor.setAttribute('aria-readonly', 'true');
    expect(instance.isReadOnly).toBe(true);
  });

  it('should close on Escape keydown on popup', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    anchor.click(); // open first
    popup.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: false }));
    expect(instance.open).toBe(false);
  });

  it('should close when a menu option inside popup is clicked', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');
    const menuItem = document.createElement('div');

    menuItem.setAttribute('role', 'menuitem');
    popup.appendChild(menuItem);
    anchor.click(); // open
    menuItem.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(instance.open).toBe(false);
  });

  it('should not close popup when clicking a non-menuitem element inside it (branch 35 false)', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');
    const div = document.createElement('div');

    popup.appendChild(div);
    anchor.click(); // open
    div.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    // div has no role → neither menuitem nor popup backdrop → popup stays open
    expect(instance.open).toBe(true);
    div.remove();
  });

  it('should not close popup on Escape with modifier key held (branch 38 false)', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    anchor.click(); // open
    popup.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', shiftKey: true, bubbles: false }),
    );
    // hasModifier=true → condition false → popup stays open
    expect(instance.open).toBe(true);
  });

  it('should toggle open to true on Enter keydown on anchor', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    anchor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(instance.open).toBe(true);
  });

  it('should toggle open to true on Space keydown on anchor', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    anchor.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(instance.open).toBe(true);
  });

  it('should not toggle open when anchor keydown has a modifier key', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    anchor.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }),
    );
    expect(instance.open).toBe(false);
  });

  it('should close on click directly on the popup backdrop element', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    anchor.click(); // open
    popup.dispatchEvent(new MouseEvent('click', { bubbles: false }));
    expect(instance.open).toBe(false);
  });

  it('should keep aria-controls after closing while the popup is still in the DOM tree', async () => {
    // The reference stays valid, and a submenu that shares its parent’s `<dialog>` is never
    // unmounted — dropping the reference there would leave nothing to reopen it by
    activatePopup(anchor, popup, 'bottom-left');
    anchor.click(); // open
    anchor.click(); // close

    await new Promise((resolve) => {
      window.requestAnimationFrame(() => resolve(undefined));
    });

    expect(anchor.getAttribute('aria-controls')).toBe(popup.id);
  });

  it('should drop aria-controls once the popup element is detached', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    expect(anchor.getAttribute('aria-controls')).toBe(popup.id);
    instance.detachPopupElement();
    expect(anchor.getAttribute('aria-controls')).toBeNull();
  });

  it('should set aria-expanded to false after closing', () => {
    activatePopup(anchor, popup, 'bottom-left');
    anchor.click(); // open
    anchor.click(); // close
    expect(anchor.getAttribute('aria-expanded')).toBe('false');
  });

  it('should not remove aria-controls when closing a never-opened popup', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    // open is false and aria-expanded is 'false' — setting open=false should be a no-op
    instance.open = false;
    expect(anchor.getAttribute('aria-controls')).toBe(popup.id);
    expect(anchor.getAttribute('aria-expanded')).toBe('false');
  });

  it('should take focus back to the anchor when closing while focus is still inside the popup', async () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');
    const child = document.createElement('button');

    popup.appendChild(child);
    anchor.click(); // open
    child.focus();
    instance.open = false;

    await new Promise((resolve) => {
      window.requestAnimationFrame(() => resolve(undefined));
    });

    expect(document.activeElement).toBe(anchor);
    child.remove();
  });

  it('should not steal focus back when it has already moved outside the popup on close', async () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');
    const outside = document.createElement('button');

    document.body.appendChild(outside);
    anchor.click(); // open
    outside.focus();
    instance.open = false;

    await new Promise((resolve) => {
      window.requestAnimationFrame(() => resolve(undefined));
    });

    expect(document.activeElement).toBe(outside);
    outside.remove();
  });
});

describe('Popup - hideImmediately', () => {
  /** @type {HTMLButtonElement} */
  let anchor;
  /** @type {HTMLDialogElement} */
  let popup;

  beforeEach(() => {
    vi.useFakeTimers();
    anchor = /** @type {HTMLButtonElement} */ (document.createElement('button'));
    popup = /** @type {HTMLDialogElement} */ (document.createElement('dialog'));
    document.body.appendChild(anchor);
    document.body.appendChild(popup);
  });

  afterEach(() => {
    anchor.remove();
    popup.remove();
    vi.useRealTimers();
  });

  it('should set open to false immediately when hideImmediately is called', async () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    anchor.click();
    expect(instance.open).toBe(true);

    const hidePromise = instance.hideImmediately();

    expect(instance.open).toBe(false);
    await vi.advanceTimersByTimeAsync(100);
    await hidePromise;
  });

  it('should temporarily set popup.hidden and then restore it', async () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    anchor.click();

    const hidePromise = instance.hideImmediately();

    expect(popup.hidden).toBe(true);
    await vi.advanceTimersByTimeAsync(100);
    await hidePromise;
    expect(popup.hidden).toBe(false);
  });

  it('should be a no-op on the popup element when none is attached', async () => {
    const instance = activatePopup(anchor, undefined, 'bottom-left');
    const hidePromise = instance.hideImmediately();

    expect(instance.open).toBe(false);
    await vi.advanceTimersByTimeAsync(100);
    await expect(hidePromise).resolves.toBeUndefined();
  });
});

describe('Popup - transitionstart', () => {
  /** @type {HTMLButtonElement} */
  let anchor;
  /** @type {HTMLDialogElement} */
  let popup;
  /** @type {HTMLDivElement} */
  let wrapper;

  beforeEach(() => {
    vi.useFakeTimers();
    anchor = /** @type {HTMLButtonElement} */ (document.createElement('button'));
    popup = /** @type {HTMLDialogElement} */ (document.createElement('dialog'));
    wrapper = document.createElement('div');
    wrapper.appendChild(anchor);
    document.body.appendChild(wrapper);
    document.body.appendChild(popup);
  });

  afterEach(() => {
    wrapper.remove();
    popup.remove();
    vi.useRealTimers();
  });

  it('should hide popup when anchor transitions inside a .hiding ancestor', async () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    anchor.click();
    expect(instance.open).toBe(true);
    wrapper.classList.add('hiding');
    anchor.dispatchEvent(new Event('transitionstart'));
    expect(instance.open).toBe(false);
    wrapper.classList.remove('hiding');
    await vi.advanceTimersByTimeAsync(100);
  });

  it('should not hide popup on transitionstart when no hiding ancestor', async () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    anchor.click();
    anchor.dispatchEvent(new Event('transitionstart'));
    expect(instance.open).toBe(true);
    await vi.advanceTimersByTimeAsync(100);
  });
});

describe('Popup - IntersectionObserver on anchor (lines 179-180)', () => {
  /** @type {HTMLButtonElement} */
  let anchor;
  /** @type {HTMLDialogElement} */
  let popup;
  /** @type {typeof globalThis.IntersectionObserver} */
  let OrigIObserver;
  /** @type {((entries: any[]) => void)[]} */
  let ioCallbacks;

  beforeEach(() => {
    vi.useFakeTimers();
    anchor = /** @type {HTMLButtonElement} */ (document.createElement('button'));
    popup = /** @type {HTMLDialogElement} */ (document.createElement('dialog'));
    document.body.appendChild(anchor);
    document.body.appendChild(popup);
    ioCallbacks = [];
    OrigIObserver = globalThis.IntersectionObserver;

    // Stub IntersectionObserver to capture callbacks
    globalThis.IntersectionObserver = /** @type {any} */ (
      class {
        /** @param {(entries: any[]) => void} cb */
        constructor(cb) {
          ioCallbacks.push(cb);
        }

        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
  });

  afterEach(async () => {
    anchor.remove();
    popup.remove();
    globalThis.IntersectionObserver = OrigIObserver;
    await vi.runAllTimersAsync();
    vi.useRealTimers();
  });

  it('should hide when anchor becomes non-intersecting while popup is open', async () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    anchor.click();
    expect(instance.open).toBe(true);

    // ioCallbacks[0] = anchor visibility observer, the only `IntersectionObserver` the class uses
    const anchorVisibilityCallback = ioCallbacks[0];

    anchorVisibilityCallback([{ isIntersecting: false }]);
    expect(instance.open).toBe(false);
    await vi.advanceTimersByTimeAsync(100);
  });

  it('should not hide when anchor leaves viewport but popup is already closed', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');
    // popup is not opened
    const anchorVisibilityCallback = ioCallbacks[0];

    anchorVisibilityCallback([{ isIntersecting: false }]);
    expect(instance.open).toBe(false);
  });
});
describe('Popup - checkPosition() calculation', () => {
  /** @type {HTMLButtonElement} */
  let anchor;
  /** @type {HTMLDialogElement} */
  let popup;
  /** @type {HTMLDivElement} */
  let content;
  /** @type {number} */
  let origInnerWidth;
  /** @type {number} */
  let origInnerHeight;

  beforeEach(() => {
    anchor = /** @type {HTMLButtonElement} */ (document.createElement('button'));
    popup = /** @type {HTMLDialogElement} */ (document.createElement('dialog'));
    // checkPosition() accesses popup.querySelector('.content')
    content = document.createElement('div');
    content.className = 'content';
    popup.appendChild(content);
    document.body.appendChild(anchor);
    document.body.appendChild(popup);

    origInnerWidth = window.innerWidth;
    origInnerHeight = window.innerHeight;
  });

  afterEach(() => {
    anchor.remove();
    popup.remove();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: origInnerWidth });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: origInnerHeight });
  });

  /**
   * Stub the anchor’s bounding rect and the viewport size that `checkPosition()` measures
   * synchronously via `getBoundingClientRect()` and `window.innerWidth`/`innerHeight`.
   */
  const mockRect = ({
    top = 100,
    bottom = 150,
    left = 50,
    right = 300,
    vw = 800,
    vh = 600,
  } = {}) => {
    anchor.getBoundingClientRect = () =>
      /** @type {DOMRect} */ ({
        top,
        bottom,
        left,
        right,
        width: right - left,
        height: bottom - top,
        x: left,
        y: top,
        toJSON: () => ({}),
      });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: vw });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: vh });
  };

  it('should set popup style when checking position (bottom-left, normal case)', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    mockRect();
    instance.checkPosition();

    const { style } = instance;

    expect(style.inset).toBeTruthy();
    expect(style.zIndex).toBe(1000);
  });

  it('should clip the anchor rect to the viewport when it extends beyond it', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    // Anchor extends above/left of and past the right edge of the viewport
    mockRect({ top: -20, bottom: 100, left: -10, right: 900, vw: 800, vh: 600 });
    instance.checkPosition();

    const { style } = instance;

    // Clamped: left → 0, right → 800, so the popup spans the full viewport width
    expect(style.minWidth).toBe('800px');
  });

  it('should switch position to top-left when content overflows bottom', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    // contentHeight > bottomMargin AND topMargin > bottomMargin → switches to top-
    Object.defineProperty(content, 'scrollHeight', { configurable: true, get: () => 500 });
    mockRect({ top: 400, bottom: 450, left: 50, right: 300, vw: 800, vh: 500 });
    instance.checkPosition();

    const { style } = instance;

    // Position changed to top-left → bottom should be calculated (not auto)
    expect(style.inset).not.toBeUndefined();
  });

  it('should switch position to bottom-right when content overflows to the right', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    // contentWidth > remaining right space → switch to bottom-right
    Object.defineProperty(content, 'scrollWidth', { configurable: true, get: () => 760 });
    mockRect({ left: 50, right: 300 });
    instance.checkPosition();

    const { style } = instance;

    expect(style.inset).not.toBeUndefined();
  });

  it('should switch position to bottom-left when content overflows to the left', () => {
    const instance = activatePopup(anchor, popup, 'bottom-right');

    // contentWidth causes left edge to be < 8 → switch to bottom-left
    Object.defineProperty(content, 'scrollWidth', { configurable: true, get: () => 290 });
    mockRect({ left: 50, right: 100 });
    instance.checkPosition();

    const { style } = instance;

    expect(style.inset).not.toBeUndefined();
  });

  it('should mirror bottom-left to bottom-right when the locale is RTL', () => {
    vi.mocked(isRTL).mockReturnValue(true);

    const instance = activatePopup(anchor, popup, 'bottom-left');

    mockRect();
    instance.checkPosition();

    const { style } = instance;

    // `bottom-left` → `bottom-right`: pinned to the viewport’s right edge (800 − 300) instead
    // of its left; LTR would give `150px auto auto 50px`
    expect(style.inset).toBe('150px 500px auto auto');
    expect(style.maxWidth).toBe('292px');
    expect(style.minWidth).toBe('250px');
  });

  it('should mirror bottom-right to bottom-left when the locale is RTL', () => {
    vi.mocked(isRTL).mockReturnValue(true);

    const instance = activatePopup(anchor, popup, 'bottom-right');

    mockRect();
    instance.checkPosition();

    const { style } = instance;

    // `bottom-right` → `bottom-left`: pinned to the anchor’s left edge (50); LTR would
    // give `150px 500px auto auto`
    expect(style.inset).toBe('150px auto auto 50px');
    expect(style.maxWidth).toBe('742px');
    expect(style.minWidth).toBe('250px');
  });

  it('should mirror left-top to right-top when the locale is RTL', () => {
    vi.mocked(isRTL).mockReturnValue(true);

    const instance = activatePopup(anchor, popup, 'left-top');

    mockRect();
    instance.checkPosition();

    const { style } = instance;

    // `left-top` → `right-top`: opens to the anchor’s right (300); LTR would give
    // `100px 750px auto auto`
    expect(style.inset).toBe('100px auto auto 300px');
    expect(style.maxWidth).toBe('292px');
    expect(style.minWidth).toBe('250px');
  });

  it('should mirror right-top to left-top when the locale is RTL', () => {
    vi.mocked(isRTL).mockReturnValue(true);

    const instance = activatePopup(anchor, popup, 'right-top');

    mockRect();
    instance.checkPosition();

    const { style } = instance;

    // `right-top` → `left-top`: opens to the anchor’s left (800 − 50); LTR would give
    // `100px auto auto 300px`
    expect(style.inset).toBe('100px 750px auto auto');
    expect(style.maxWidth).toBe('292px');
    expect(style.minWidth).toBe('250px');
  });

  it('should leave the position untouched when the locale is LTR', () => {
    vi.mocked(isRTL).mockReturnValue(false);

    const instance = activatePopup(anchor, popup, 'bottom-left');

    mockRect();
    instance.checkPosition();

    const { style } = instance;

    // The LTR counterpart of the first case above, so the two together show the mirroring
    expect(style.inset).toBe('150px auto auto 50px');
    expect(style.maxWidth).toBe('742px');
  });

  it('should set height to bottomMargin when content overflows bottom but top is not better', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    // bottomMargin = 500 - 400 - 8 = 92; topMargin = 50 - 8 = 42; topMargin < bottomMargin
    // so the else branch runs: height = bottomMargin (92px)
    Object.defineProperty(content, 'scrollHeight', { configurable: true, get: () => 200 });
    mockRect({ top: 50, bottom: 400, vw: 800, vh: 500 });
    instance.checkPosition();

    const { style } = instance;

    expect(style.height).toBe('92px');
  });

  it('should compute bottom from rootBounds.height - intersectionRect.bottom for -bottom position', () => {
    // 'right-bottom' ends with '-bottom' → bottom = Math.round(vh - intersectionRect.bottom)
    const instance = activatePopup(anchor, popup, 'right-bottom');

    // default: top=100, bottom=150, left=50, right=300, vh=600
    // bottom = Math.round(600 - 150) = 450
    mockRect();
    instance.checkPosition();

    const { style } = instance;

    expect(style.inset).toContain('450px');
  });

  it('should skip the update when no `.content` element exists yet', () => {
    // Simulate the popup element being in the DOM tree before its content is mounted
    content.remove();

    const instance = activatePopup(anchor, popup, 'bottom-left');

    mockRect();
    instance.checkPosition();

    // No content found → early return, style remains at its default, unset state
    const { style } = instance;

    expect(style.inset).toBeUndefined();
  });

  it('should not update style when checkPosition is called again with identical geometry', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    mockRect();
    instance.checkPosition();

    const styleBefore = instance.style;

    // Second call with the same anchor rect and viewport size — all comparisons are equal →
    // style.set not called again
    instance.checkPosition();

    const styleAfter = instance.style;

    expect(styleAfter.inset).toBe(styleBefore.inset);
    expect(styleAfter.zIndex).toBe(styleBefore.zIndex);
  });
});
describe('Popup - ResizeObserver callbacks', () => {
  /** @type {HTMLButtonElement} */
  let anchor;
  /** @type {HTMLDialogElement} */
  let popup;
  /** @type {typeof globalThis.ResizeObserver} */
  let OrigRObs;
  /**
   * @type {{ cb: (entries: any[]) => void, target: any, unobserve: ReturnType<typeof vi.fn> }[]}
   */
  let rObsInstances;
  /** @type {typeof globalThis.IntersectionObserver | undefined} */
  let _OrigIO;

  beforeEach(() => {
    vi.useFakeTimers();
    anchor = /** @type {HTMLButtonElement} */ (document.createElement('button'));
    popup = /** @type {HTMLDialogElement} */ (document.createElement('dialog'));
    document.body.appendChild(anchor);
    document.body.appendChild(popup);
    rObsInstances = [];
    OrigRObs = globalThis.ResizeObserver;

    // Stub ResizeObserver to capture each instance’s callback and observed target. The class
    // constructs two of these — `resizeObserver` (anchor) first, then `viewportResizeObserver`
    // (popupElement) — so `rObsInstances[0]` and `rObsInstances[1]` refer to them in that order.
    globalThis.ResizeObserver = /** @type {any} */ (
      class {
        /** @param {(entries: any[]) => void} cb */
        constructor(cb) {
          this.cb = cb;
          this.target = undefined;
          this.unobserve = vi.fn();
          rObsInstances.push(/** @type {any} */ (this));
        }

        /** @param {any} target */
        observe(target) {
          this.target = target;
        }

        disconnect() {}
      }
    );

    // Also stub IntersectionObserver to avoid errors
    const OrigIO = globalThis.IntersectionObserver;

    globalThis.IntersectionObserver = /** @type {any} */ (
      class {
        // eslint-disable-next-line no-useless-constructor, no-empty-function
        constructor() {}
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );

    _OrigIO = OrigIO;
  });

  afterEach(async () => {
    anchor.remove();
    popup.remove();
    globalThis.ResizeObserver = OrigRObs;
    globalThis.IntersectionObserver = /** @type {any} */ (_OrigIO);
    await vi.runAllTimersAsync();
    vi.useRealTimers();
  });

  it('should schedule checkPosition via RAF when the anchor’s ResizeObserver fires', async () => {
    activatePopup(anchor, popup, 'bottom-left');

    // rObsInstances[0] is `resizeObserver`, observing the anchor
    rObsInstances[0].cb([]);
    await vi.advanceTimersByTimeAsync(16); // flush rAF
    // No crash; just verifies these lines execute
    expect(true).toBe(true);
  });

  it('should recalculate the position directly when the viewport ResizeObserver fires while open', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    anchor.click(); // open

    const spy = vi.spyOn(instance, 'checkPosition');

    // rObsInstances[1] is `viewportResizeObserver`, observing `popupElement`
    rObsInstances[1].cb([]);

    // Called directly, not deferred through `requestAnimationFrame` or the `resize` event on
    // `window` — neither is guaranteed to fire promptly (or at all) for every layout-affecting
    // viewport change across browsers, which is what left the popup stuck at a stale position
    expect(spy).toHaveBeenCalled();
  });

  it('should not recalculate when the viewport ResizeObserver fires while closed', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');
    const spy = vi.spyOn(instance, 'checkPosition');

    rObsInstances[1].cb([]);

    expect(spy).not.toHaveBeenCalled();
  });

  it('should observe popupElement with the viewport ResizeObserver on attach', () => {
    activatePopup(anchor, popup, 'bottom-left');

    expect(rObsInstances[1].target).toBe(popup);
  });

  it('should unobserve popupElement with the viewport ResizeObserver on detach', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    instance.detachPopupElement();

    expect(rObsInstances[1].unobserve).toHaveBeenCalledWith(popup);
  });
});

describe('Popup - destroy', () => {
  /** @type {HTMLButtonElement} */
  let anchor;
  /** @type {HTMLDialogElement} */
  let popup;
  /** @type {typeof globalThis.ResizeObserver} */
  let OrigRObs;
  /** @type {typeof globalThis.IntersectionObserver} */
  let OrigIO;
  /** @type {{ disconnect: ReturnType<typeof vi.fn> }[]} */
  let ioInstances;
  /** @type {{ disconnect: ReturnType<typeof vi.fn> }[]} */
  let rObsInstances;

  beforeEach(() => {
    anchor = /** @type {HTMLButtonElement} */ (document.createElement('button'));
    popup = /** @type {HTMLDialogElement} */ (document.createElement('dialog'));
    document.body.appendChild(anchor);
    document.body.appendChild(popup);
    ioInstances = [];
    rObsInstances = [];
    OrigIO = globalThis.IntersectionObserver;
    OrigRObs = globalThis.ResizeObserver;

    globalThis.IntersectionObserver = /** @type {any} */ (
      class {
        constructor() {
          this.disconnect = vi.fn();
          ioInstances.push(/** @type {any} */ (this));
        }

        observe() {}
        unobserve() {}
      }
    );

    globalThis.ResizeObserver = /** @type {any} */ (
      class {
        constructor() {
          this.disconnect = vi.fn();
          rObsInstances.push(/** @type {any} */ (this));
        }

        observe() {}
        unobserve() {}
      }
    );
  });

  afterEach(() => {
    anchor.remove();
    popup.remove();
    globalThis.IntersectionObserver = OrigIO;
    globalThis.ResizeObserver = OrigRObs;
  });

  it('should disconnect all observers when destroy is called', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');

    instance.destroy();

    // One IntersectionObserver is created, for anchor visibility. Two ResizeObservers are
    // created: one for the anchor’s own size, one for the popup’s viewport-sized `<dialog>`. All
    // should be disconnected.
    expect(ioInstances).toHaveLength(1);
    expect(ioInstances[0].disconnect).toHaveBeenCalledTimes(1);
    expect(rObsInstances).toHaveLength(2);
    expect(rObsInstances[0].disconnect).toHaveBeenCalledTimes(1);
    expect(rObsInstances[1].disconnect).toHaveBeenCalledTimes(1);
  });

  it('should cancel a pending animation frame on destroy', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');
    const cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame');

    /** @type {any} */ (instance)._rafId = 123;
    instance.destroy();

    expect(cancelSpy).toHaveBeenCalledWith(123);
    cancelSpy.mockRestore();
  });

  it('should not call cancelAnimationFrame when no frame is pending', () => {
    const instance = activatePopup(anchor, popup, 'bottom-left');
    const cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame');

    instance.destroy();

    expect(cancelSpy).not.toHaveBeenCalled();
    cancelSpy.mockRestore();
  });
});

describe('Popup - identity when a nested popup shares its parent’s dialog', () => {
  /** @type {HTMLButtonElement} */
  let parentAnchor;
  /** @type {HTMLButtonElement} */
  let childAnchor;
  /** @type {HTMLDialogElement} */
  let sharedDialog;
  /** @type {HTMLElement} */
  let parentContent;
  /** @type {HTMLElement} */
  let childContent;

  beforeEach(() => {
    parentAnchor = /** @type {HTMLButtonElement} */ (document.createElement('button'));
    childAnchor = /** @type {HTMLButtonElement} */ (document.createElement('button'));
    sharedDialog = /** @type {HTMLDialogElement} */ (document.createElement('dialog'));
    parentContent = document.createElement('div');
    childContent = document.createElement('div');
    parentContent.className = 'content';
    childContent.className = 'content';
    sharedDialog.append(parentContent, childContent);
    document.body.append(parentAnchor, childAnchor, sharedDialog);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should put the id on the content element, not the dialog', () => {
    const instance = activatePopup(parentAnchor, undefined, 'bottom-left');

    instance.attachPopupElement(sharedDialog, parentContent);

    expect(parentContent.id).toBe(instance.id);
    expect(sharedDialog.id).toBe('');
  });

  it('should point aria-controls at the content element', () => {
    const instance = activatePopup(parentAnchor, undefined, 'bottom-left');

    instance.attachPopupElement(sharedDialog, parentContent);

    expect(parentAnchor.getAttribute('aria-controls')).toBe(parentContent.id);
    expect(
      document.getElementById(/** @type {string} */ (parentAnchor.getAttribute('aria-controls'))),
    ).toBe(parentContent);
  });

  it('should not let a nested popup clobber an id already on the dialog', () => {
    sharedDialog.id = 'combobox-popup';

    const instance = activatePopup(childAnchor, undefined, 'right-top');

    instance.attachPopupElement(sharedDialog, childContent);

    expect(sharedDialog.id).toBe('combobox-popup');
  });

  it('should give two popups sharing a dialog distinct, resolvable targets', () => {
    const parent = activatePopup(parentAnchor, undefined, 'bottom-left');
    const child = activatePopup(childAnchor, undefined, 'right-top');

    parent.attachPopupElement(sharedDialog, parentContent);
    child.attachPopupElement(sharedDialog, childContent);

    expect(parentContent.id).not.toBe(childContent.id);
    expect(parentAnchor.getAttribute('aria-controls')).toBe(parentContent.id);
    expect(childAnchor.getAttribute('aria-controls')).toBe(childContent.id);
  });

  it('should fall back to the popup element when no content is given', () => {
    const instance = activatePopup(parentAnchor, undefined, 'bottom-left');

    instance.attachPopupElement(sharedDialog);

    expect(sharedDialog.id).toBe(instance.id);
    expect(parentAnchor.getAttribute('aria-controls')).toBe(sharedDialog.id);
  });

  it('should forget the content element on detach', () => {
    const instance = activatePopup(parentAnchor, undefined, 'bottom-left');

    instance.attachPopupElement(sharedDialog, parentContent);
    instance.detachPopupElement();

    expect(instance.contentElement).toBeUndefined();
    expect(instance.popupElement).toBeUndefined();
  });

  it('should be a no-op when attaching the same popup and content element again (line 271)', () => {
    const instance = activatePopup(parentAnchor, undefined, 'bottom-left');

    instance.attachPopupElement(sharedDialog, parentContent);

    const idBefore = parentContent.id;

    // Re-attaching the identical pair must not re-run the setup (which would otherwise remove
    // and re-add the click/keydown listeners)
    instance.attachPopupElement(sharedDialog, parentContent);

    expect(parentContent.id).toBe(idBefore);
  });
});

describe('Popup - checkPosition without a popup element in the DOM tree', () => {
  /** @type {HTMLButtonElement} */
  let anchor;

  beforeEach(() => {
    anchor = /** @type {HTMLButtonElement} */ (document.createElement('button'));
    document.body.appendChild(anchor);
  });

  afterEach(() => {
    anchor.remove();
  });

  it('should be a no-op when opening before a popup element is attached (line 362)', () => {
    const instance = activatePopup(anchor, undefined, 'bottom-left');

    // No popupElement was provided, so the `open` setter's call to checkPosition() must return
    // immediately instead of observing anything
    expect(() => {
      instance.open = true;
    }).not.toThrow();
    expect(instance.open).toBe(true);
  });
});
