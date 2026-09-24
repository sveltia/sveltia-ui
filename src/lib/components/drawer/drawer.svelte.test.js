import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { html, text } from '../../test-utils/snippets.js';
import Drawer from './drawer.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

/**
 * Get the `<dialog>` element.
 * @returns {HTMLDialogElement | null} Element.
 */
const getDialog = () => document.querySelector('dialog.sui.modal');

/**
 * Wait until the drawer is open.
 */
const waitForOpen = async () => {
  await vi.waitFor(() => {
    expect(getDialog()?.open).toBe(true);
  });
};

describe('Drawer', () => {
  it('renders a right-hand drawer with an outside close button by default', async () => {
    await render(Drawer, { open: true, title: 'Filters', children: text('Body') });
    await waitForOpen();

    const dialog = /** @type {HTMLDialogElement} */ (getDialog());
    const content = /** @type {HTMLElement} */ (dialog.querySelector('.content'));

    expect(dialog.classList.contains('drawer')).toBe(true);
    expect(dialog.classList.contains('backdrop')).toBe(true);
    expect(content.classList.contains('right')).toBe(true);
    expect(content.classList.contains('vertical')).toBe(true);
    expect(content.classList.contains('small')).toBe(true);
    expect(content.querySelector('.extra-control button.close')).not.toBeNull();
    expect(content.querySelector('.header button.close')).toBeNull();
    expect(content.querySelector('.title')?.textContent?.trim()).toBe('Filters');
    expect(content.querySelector('.main')?.textContent).toContain('Body');
    expect(content.querySelector('.footer')).toBeNull();
    expect(content.querySelector('button.close')?.getAttribute('aria-controls')).toBe(dialog.id);
    // The built-in title labels the dialog
    expect(dialog.getAttribute('aria-labelledby')).toBe(content.querySelector('.title')?.id);
    expect(dialog.hasAttribute('aria-label')).toBe(false);
  });

  it('names the dialog by title text with a custom header', async () => {
    await render(Drawer, {
      open: true,
      title: 'Filters',
      header: html('<h2 class="custom-header">Custom</h2>'),
    });
    await waitForOpen();

    const dialog = /** @type {HTMLDialogElement} */ (getDialog());

    expect(dialog.getAttribute('aria-label')).toBe('Filters');
    expect(dialog.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('lets a custom header name the dialog by element ID', async () => {
    await render(Drawer, {
      open: true,
      title: 'Filters',
      ariaLabelledby: 'custom-title',
      header: html('<h2 id="custom-title">Custom</h2>'),
    });
    await waitForOpen();

    const dialog = /** @type {HTMLDialogElement} */ (getDialog());

    expect(dialog.getAttribute('aria-labelledby')).toBe('custom-title');
    expect(dialog.hasAttribute('aria-label')).toBe(false);
  });

  it('supports other positions, sizes and an inside close button', async () => {
    await render(Drawer, {
      open: true,
      title: 'Filters',
      position: 'bottom',
      size: 'full',
      class: 'custom',
      showClose: 'inside',
      closeIcon: html('<i class="close-icon">x</i>'),
      footer: html('<button class="footer-button">Apply</button>'),
    });

    await waitForOpen();

    const content = /** @type {HTMLElement} */ (getDialog()?.querySelector('.content'));

    expect(content.classList.contains('bottom')).toBe(true);
    expect(content.classList.contains('horizontal')).toBe(true);
    expect(content.classList.contains('full')).toBe(true);
    expect(content.classList.contains('custom')).toBe(true);
    expect(content.querySelector('.extra-control button')).toBeNull();
    expect(content.querySelector('.header button.close .close-icon')).not.toBeNull();
    expect(content.querySelector('.footer .footer-button')).not.toBeNull();
  });

  it('omits the header without a title or close button', async () => {
    await render(Drawer, { open: true, showClose: false });
    await waitForOpen();

    const content = /** @type {HTMLElement} */ (getDialog()?.querySelector('.content'));

    expect(content.querySelector('.header')).toBeNull();
    expect(content.querySelector('button.close')).toBeNull();
  });

  it('renders the custom header and extra header content', async () => {
    const custom = await render(Drawer, {
      open: true,
      title: 'Filters',
      header: html('<h2 class="custom-header">Custom</h2>'),
    });

    await waitForOpen();
    expect(getDialog()?.querySelector('.custom-header')).not.toBeNull();
    expect(getDialog()?.querySelector('.title')).toBeNull();
    await custom.unmount();

    await render(Drawer, {
      open: true,
      title: 'Filters',
      headerExtra: html('<span class="header-extra">H</span>'),
    });

    await waitForOpen();
    expect(getDialog()?.querySelector('.header .header-extra')).not.toBeNull();
  });

  it('closes with the inside close button', async () => {
    /** @type {ComponentProps<typeof Drawer>} */
    const props = $state({ open: true, title: 'Filters', showClose: 'inside' });

    await render(Drawer, props);
    await waitForOpen();
    /** @type {HTMLButtonElement} */ (
      /** @type {HTMLDialogElement} */ (getDialog()).querySelector('.header button.close')
    ).click();
    expect(props.open).toBe(false);
  });

  it('closes with the close button', async () => {
    const onClose = vi.fn();
    /** @type {ComponentProps<typeof Drawer>} */
    const props = $state({ open: true, title: 'Filters', onClose });

    await render(Drawer, props);
    await waitForOpen();
    /** @type {HTMLButtonElement} */ (
      /** @type {HTMLDialogElement} */ (getDialog()).querySelector('button.close')
    ).click();
    expect(props.open).toBe(false);
    await vi.waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce();
    });
    expect(onClose.mock.calls[0][0].detail.returnValue).toBe('close');
  });

  describe('swipe to dismiss', () => {
    /**
     * Get the content element of the open drawer.
     * @returns {HTMLElement} Element.
     */
    const getContent = () => /** @type {HTMLElement} */ (getDialog()?.querySelector('.content'));
    /**
     * Get an element in the content of the open drawer.
     * @param {string} selector CSS selector.
     * @returns {HTMLElement} Element.
     */
    const getPart = (selector) => /** @type {HTMLElement} */ (getContent().querySelector(selector));

    /**
     * Dispatch a pointer event, and wait for the drawer to be updated.
     * @param {Element} target Event target.
     * @param {string} type Event type.
     * @param {PointerEventInit} [init] Event properties.
     */
    const firePointer = async (target, type, init = {}) => {
      target.dispatchEvent(
        new PointerEvent(type, { bubbles: true, pointerId: 1, isPrimary: true, ...init }),
      );
      await tick();
    };

    /**
     * Wait for the given time.
     * @param {number} ms Milliseconds.
     */
    const wait = async (ms) => {
      await new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    };

    /**
     * Drag the given element slowly enough not to count as a flick, without releasing it.
     * @param {Element} target Element to start the drag from.
     * @param {{ x?: number, y?: number }} distance Distance to drag the pointer, in pixels.
     */
    const drag = async (target, { x = 0, y = 0 }) => {
      const { left, top } = target.getBoundingClientRect();
      const steps = 10;

      await firePointer(target, 'pointerdown', { clientX: left, clientY: top });

      for (let step = 1; step <= steps; step += 1) {
        // eslint-disable-next-line no-await-in-loop
        await wait(50);
        // eslint-disable-next-line no-await-in-loop
        await firePointer(target, 'pointermove', {
          clientX: left + (x * step) / steps,
          clientY: top + (y * step) / steps,
        });
      }
    };

    it('shows a handle on a top or bottom drawer', async () => {
      const bottom = await render(Drawer, { open: true, position: 'bottom', swipeDismiss: true });

      await waitForOpen();
      expect(getContent().classList.contains('swipe-dismiss')).toBe(true);
      expect(getContent().firstElementChild?.classList.contains('handle')).toBe(true);
      await bottom.unmount();

      const top = await render(Drawer, { open: true, position: 'top', swipeDismiss: true });

      await waitForOpen();
      expect(getContent().lastElementChild?.classList.contains('handle')).toBe(true);
      await top.unmount();

      // The header is dragged on a side drawer
      await render(Drawer, { open: true, title: 'Filters', swipeDismiss: true });
      await waitForOpen();
      expect(getPart('.handle')).toBeNull();
    });

    it('dismisses a drawer dragged far enough towards its edge', async () => {
      /** @type {ComponentProps<typeof Drawer>} */
      const props = $state({ open: true, position: 'bottom', size: 'small', swipeDismiss: true });

      await render(Drawer, props);
      await waitForOpen();

      const content = getContent();
      const handle = getPart('.handle');

      await drag(handle, { y: 200 });
      // The drawer follows the pointer without a transition
      expect(content.style.transform).toBe('translateY(200px)');
      expect(content.style.transitionDuration).toBe('0s');

      await firePointer(handle, 'pointerup');
      expect(props.open).toBe(false);
      // The closing transition picks up from where the drag has left the drawer
      expect(content.style.transform).toBe('');
      expect(content.style.transitionDuration).toBe('');
    });

    it('puts a drawer that hasn’t been dragged far enough back into place', async () => {
      /** @type {ComponentProps<typeof Drawer>} */
      const props = $state({ open: true, title: 'Filters', swipeDismiss: true });

      await render(Drawer, props);
      await waitForOpen();

      const content = getContent();
      const title = getPart('.title');

      // A drag the other way doesn’t pull the drawer out further
      await drag(title, { x: -100 });
      expect(content.style.transform).toBe('translateX(0px)');
      await firePointer(title, 'pointerup');
      expect(props.open).toBe(true);

      await drag(title, { x: 40 });
      expect(content.style.transform).toBe('translateX(40px)');
      await firePointer(title, 'pointerup');
      expect(props.open).toBe(true);
      expect(content.style.transform).toBe('');
    });

    it('dismisses a drawer flicked towards its edge', async () => {
      /** @type {ComponentProps<typeof Drawer>} */
      const props = $state({ open: true, position: 'bottom', swipeDismiss: true });

      await render(Drawer, props);
      await waitForOpen();

      const handle = getPart('.handle');
      const { left, top } = handle.getBoundingClientRect();

      /**
       * Flick the handle: move the pointer from `from` to `to` pixels below where it’s pressed, 20
       * ms apart, and release it after the given pause.
       * @param {number} from Start of the flick.
       * @param {number} to End of the flick.
       * @param {number} [pause] Time to hold the pointer still before releasing it.
       */
      const flick = async (from, to, pause = 0) => {
        await firePointer(handle, 'pointerdown', { clientX: left, clientY: top });
        await firePointer(handle, 'pointermove', { clientX: left, clientY: top + from });
        await wait(20);
        await firePointer(handle, 'pointermove', { clientX: left, clientY: top + to });

        if (pause) {
          await wait(pause);
        }

        await firePointer(handle, 'pointerup');
      };

      // With a single move, there’s no speed to measure
      await firePointer(handle, 'pointerdown', { clientX: left, clientY: top });
      await firePointer(handle, 'pointermove', { clientX: left, clientY: top + 20 });
      await firePointer(handle, 'pointerup');
      expect(props.open).toBe(true);

      // Too short to be a flick, however fast
      await flick(2, 14);
      expect(props.open).toBe(true);

      // Held still before the release
      await flick(5, 40, 150);
      expect(props.open).toBe(true);

      await flick(5, 40);
      expect(props.open).toBe(false);
    });

    it('drags a side drawer the other way in a right-to-left layout', async () => {
      /** @type {ComponentProps<typeof Drawer>} */
      const props = $state({ open: true, title: 'Filters', position: 'left', swipeDismiss: true });

      document.documentElement.dir = 'rtl';

      try {
        await render(Drawer, props);
        await waitForOpen();

        const title = getPart('.title');

        await drag(title, { x: 300 });
        await firePointer(title, 'pointerup');
        expect(props.open).toBe(false);
      } finally {
        document.documentElement.dir = '';
      }
    });

    it('leaves the main content, the controls and other pointers alone', async () => {
      /** @type {ComponentProps<typeof Drawer>} */
      const props = $state({
        open: true,
        title: 'Filters',
        position: 'bottom',
        showClose: 'inside',
        swipeDismiss: true,
        children: text('Body'),
      });

      await render(Drawer, props);
      await waitForOpen();

      const content = getContent();
      const handle = getPart('.handle');
      const main = getPart('.main');
      const closeButton = getPart('.header button.close');

      await drag(main, { y: 400 });
      expect(content.style.transform).toBe('');
      await firePointer(main, 'pointerup');
      await drag(closeButton, { y: 400 });
      expect(content.style.transform).toBe('');
      await firePointer(closeButton, 'pointerup');
      expect(props.open).toBe(true);

      // A secondary button or pointer doesn’t start a drag
      await firePointer(handle, 'pointerdown', { button: 2 });
      await firePointer(handle, 'pointerdown', { isPrimary: false });
      expect(content.style.transform).toBe('');

      // Another pointer doesn’t move or release the drawer being dragged
      await firePointer(handle, 'pointerdown', { clientY: 0 });
      await firePointer(handle, 'pointerdown', { clientY: 0, pointerId: 2 });
      await firePointer(handle, 'pointermove', { clientY: 400, pointerId: 2 });
      await firePointer(handle, 'pointerup', { pointerId: 2 });
      expect(content.style.transform).toBe('translateY(0px)');

      // A cancelled drag puts the drawer back
      await firePointer(handle, 'pointermove', { clientY: 400 });
      expect(content.style.transform).toBe('translateY(400px)');
      await firePointer(handle, 'pointercancel');
      expect(content.style.transform).toBe('');
      expect(props.open).toBe(true);

      // Nothing happens without a drag
      await firePointer(handle, 'pointermove', { clientY: 400 });
      await firePointer(handle, 'pointerup');
      expect(props.open).toBe(true);
    });

    it('lets a drawer closed in the middle of a drag slide away', async () => {
      /** @type {ComponentProps<typeof Drawer>} */
      const props = $state({ open: true, position: 'bottom', swipeDismiss: true });

      await render(Drawer, props);
      await waitForOpen();

      const content = getContent();

      await drag(getPart('.handle'), { y: 40 });
      expect(content.classList.contains('swiping')).toBe(true);

      props.open = false;
      await tick();
      expect(content.classList.contains('swiping')).toBe(false);
      expect(content.style.transform).toBe('');

      // The next drag starts afresh
      props.open = true;
      await waitForOpen();
      await drag(getPart('.handle'), { y: 40 });
      expect(getContent().style.transform).toBe('translateY(40px)');
    });

    it('can’t be dragged unless enabled', async () => {
      /** @type {ComponentProps<typeof Drawer>} */
      const props = $state({ open: true, title: 'Filters', position: 'bottom' });

      await render(Drawer, props);
      await waitForOpen();

      const content = getContent();

      expect(content.classList.contains('swipe-dismiss')).toBe(false);
      expect(getPart('.handle')).toBeNull();
      await drag(getPart('.title'), { y: 400 });
      expect(content.style.transform).toBe('');
      await firePointer(getPart('.title'), 'pointerup');
      expect(props.open).toBe(true);
    });
  });
});
