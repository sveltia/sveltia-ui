import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { html, text } from '../../test-utils/snippets.js';
import Toast from './toast.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

/**
 * Get the shared popover base the toasts are rendered in.
 * @returns {HTMLElement | null} Element.
 */
const getBase = () => document.querySelector('.sui.toast-base.enabled');

/**
 * Wait for the CSS transitions of the toasts to finish, such as a toast opening or collapsing.
 */
const finishTransitions = async () => {
  await Promise.all(
    [...document.querySelectorAll('.sui.toast')]
      .flatMap((toast) => toast.getAnimations())
      .map((animation) => animation.finished),
  );
};

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('moves the toast into a popover base appended to the body', async () => {
    const screen = await render(Toast, { show: true, children: text('Saved'), 'data-x': '1' });
    const base = /** @type {HTMLElement} */ (getBase());
    const toast = /** @type {HTMLElement} */ (base.querySelector('.sui.toast'));

    expect(base.parentElement).toBe(document.body);
    expect(base.matches(':popover-open')).toBe(true);
    expect(screen.container.querySelector('.toast')).toBeNull();
    expect(toast.textContent).toContain('Saved');
    expect(toast.getAttribute('aria-hidden')).toBe('false');
    expect(toast.getAttribute('data-x')).toBe('1');
  });

  it('shares one popover base between toasts', async () => {
    await render(Toast, { show: true, children: text('One') });
    await render(Toast, { show: true, children: text('Two') });
    expect(document.querySelectorAll('.sui.toast-base')).toHaveLength(1);
    expect(getBase()?.querySelectorAll('.sui.toast')).toHaveLength(2);
  });

  it('stacks the toasts at the same position instead of overlapping them', async () => {
    await render(Toast, { show: true, position: 'bottom-right', children: text('One') });
    await render(Toast, { show: true, position: 'bottom-right', children: text('Two') });
    await render(Toast, { show: true, position: 'top-left', children: text('Three') });

    const base = /** @type {HTMLElement} */ (getBase());
    const lanes = [...base.querySelectorAll(':scope > .toast-lane')];
    const [one, two] = [...base.querySelectorAll('.toast-lane.bottom-right > .sui.toast')];

    expect(lanes.map((lane) => lane.className)).toEqual([
      'toast-lane bottom-right',
      'toast-lane top-left',
    ]);
    expect(one.textContent).toContain('One');
    expect(two.textContent).toContain('Two');
    // The later toast is below the earlier one, with the gap in between, once they’ve opened
    await finishTransitions();
    expect(two.getBoundingClientRect().top - one.getBoundingClientRect().bottom).toBe(8);
    expect(base.querySelector('.toast-lane.top-left')?.textContent).toContain('Three');
  });

  it('puts the newest toast next to the edge of the screen', async () => {
    await render(Toast, { show: true, position: 'top-left', children: text('One') });
    await render(Toast, { show: true, position: 'top-left', children: text('Two') });
    await render(Toast, { show: true, position: 'bottom-left', children: text('Three') });
    await render(Toast, { show: true, position: 'bottom-left', children: text('Four') });

    /**
     * Get the text of the toasts in a lane, from top to bottom.
     * @param {string} position Lane position.
     * @returns {string[]} Text.
     */
    const getTexts = (position) =>
      [...document.querySelectorAll(`.toast-lane.${position} > .sui.toast`)].map(
        (toast) => toast.textContent?.trim() ?? '',
      );

    expect(getTexts('top-left')).toEqual(['Two', 'One']);
    expect(getTexts('bottom-left')).toEqual(['Three', 'Four']);
  });

  it('keeps one lane per position, whatever the value', async () => {
    /** @type {ComponentProps<typeof Toast>} */
    const props = $state({
      show: true,
      duration: 0,
      // Not a valid class name, so it can’t be looked up with a selector
      position: /** @type {any} */ ('far away'),
      children: text('Saved'),
    });

    await render(Toast, props);
    props.show = false;
    await vi.advanceTimersByTimeAsync(250);
    props.show = true;
    await vi.waitFor(() => {
      expect(getBase()?.querySelector('.sui.toast')?.getAttribute('aria-hidden')).toBe('false');
    });
    expect(getBase()?.children).toHaveLength(1);
  });

  it('clips its content, with the shadow of an alert drawn outside', async () => {
    await render(Toast, { show: true, children: html('<div class="alert">Saved</div>') });

    const style = getComputedStyle(
      /** @type {HTMLElement} */ (getBase()?.querySelector('.sui.toast')),
    );

    expect(style.overflow).toBe('clip');
    expect(style.filter).toMatch(/^drop-shadow\(/);
  });

  it('collapses a toast that goes, so the next one slides into its place', async () => {
    await render(Toast, { show: true, position: 'top-left', children: text('One') });

    /** @type {ComponentProps<typeof Toast>} */
    const props = $state({ show: true, duration: 0, position: 'top-left', children: text('Two') });

    await render(Toast, props);
    await finishTransitions();

    // The newer toast is at the top, next to the edge
    const [two, one] = /** @type {HTMLElement[]} */ ([
      ...document.querySelectorAll('.toast-lane.top-left > .sui.toast'),
    ]);

    const { top } = two.getBoundingClientRect();

    expect(two.textContent).toContain('Two');
    expect(one.getBoundingClientRect().top).toBeGreaterThan(top);
    props.show = false;
    await vi.waitFor(() => {
      expect(two.getAttribute('aria-hidden')).toBe('true');
    });
    await finishTransitions();
    // The fading toast takes no room, along with its margins, before it’s removed
    expect(two.isConnected).toBe(true);
    expect(two.getBoundingClientRect().height).toBe(0);
    expect(one.getBoundingClientRect().top).toBe(top);
  });

  it('moves the toast to the lane of its new position', async () => {
    /** @type {ComponentProps<typeof Toast>} */
    const props = $state({ show: true, position: 'top-left', children: text('Saved') });

    await render(Toast, props);

    const base = /** @type {HTMLElement} */ (getBase());
    const toast = /** @type {HTMLElement} */ (base.querySelector('.sui.toast'));

    expect(toast.parentElement?.classList.contains('top-left')).toBe(true);
    props.position = 'bottom-center';
    await vi.waitFor(() => {
      expect(toast.parentElement?.classList.contains('bottom-center')).toBe(true);
    });
  });

  it('renders the base within the app shell when there is one', async () => {
    const shell = document.createElement('div');

    shell.className = 'sui app-shell';
    document.body.appendChild(shell);
    await render(Toast, { show: true });
    expect(getBase()?.parentElement).toBe(shell);
  });

  it('positions the toast automatically based on the viewport width', async () => {
    const screen = await render(Toast, { show: true });
    const toast = /** @type {HTMLElement} */ (getBase()?.querySelector('.sui.toast'));
    const narrow = window.innerWidth < 1024;

    expect(toast.classList.contains(narrow ? 'bottom-center' : 'bottom-right')).toBe(true);
    await screen.unmount();

    await render(Toast, { show: true, position: 'top-left' });
    expect(getBase()?.querySelector('.sui.toast')?.classList.contains('top-left')).toBe(true);
  });

  it('sits in the bottom right corner on a wide viewport', async () => {
    const matchMedia = vi.spyOn(window, 'matchMedia');

    matchMedia.mockImplementation(
      (query) =>
        /** @type {MediaQueryList} */ (
          /** @type {unknown} */ ({
            matches: false,
            media: query,
            /**
             * Ignore listeners.
             */
            addEventListener: () => {},
            /**
             * Ignore listeners.
             */
            removeEventListener: () => {},
          })
        ),
    );

    await render(Toast, { show: true });
    expect(getBase()?.querySelector('.sui.toast')?.classList.contains('bottom-right')).toBe(true);
    matchMedia.mockRestore();
  });

  it('hides itself after the duration', async () => {
    /** @type {ComponentProps<typeof Toast>} */
    const props = $state({ show: true, duration: 1000 });

    await render(Toast, props);

    const toast = /** @type {HTMLElement} */ (getBase()?.querySelector('.sui.toast'));

    await vi.advanceTimersByTimeAsync(999);
    expect(props.show).toBe(true);
    await vi.advanceTimersByTimeAsync(1);
    expect(props.show).toBe(false);
    await vi.waitFor(() => {
      expect(toast.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('holds the countdown while hovered or focused, and starts over after', async () => {
    /** @type {ComponentProps<typeof Toast>} */
    const props = $state({ show: true, duration: 1000 });

    await render(Toast, props);

    const toast = /** @type {HTMLElement} */ (getBase()?.querySelector('.sui.toast'));

    await vi.advanceTimersByTimeAsync(800);
    toast.dispatchEvent(new PointerEvent('pointerenter'));
    await vi.advanceTimersByTimeAsync(5000);
    expect(props.show).toBe(true);
    toast.dispatchEvent(new PointerEvent('pointerleave'));
    await vi.advanceTimersByTimeAsync(999);
    expect(props.show).toBe(true);
    await vi.advanceTimersByTimeAsync(1);
    expect(props.show).toBe(false);
  });

  it('releases the hold when removed while hovered', async () => {
    /** @type {ComponentProps<typeof Toast>} */
    const props = $state({ show: true, duration: 1000 });

    await render(Toast, props);

    const toast = /** @type {HTMLElement} */ (getBase()?.querySelector('.sui.toast'));

    toast.dispatchEvent(new PointerEvent('pointerenter'));
    // Hidden, e.g. with a dismiss button in it, while the pointer is still over it
    props.show = false;
    await vi.advanceTimersByTimeAsync(250);
    expect(toast.isConnected).toBe(false);
    props.show = true;
    await vi.advanceTimersByTimeAsync(1000);
    expect(props.show).toBe(false);
  });

  it('holds the countdown while the focus moves between controls inside it', async () => {
    /** @type {ComponentProps<typeof Toast>} */
    const props = $state({
      show: true,
      duration: 1000,
      children: html('<span><button class="undo">Undo</button><button class="x">✕</button></span>'),
    });

    await render(Toast, props);

    const toast = /** @type {HTMLElement} */ (getBase()?.querySelector('.sui.toast'));
    const undo = /** @type {HTMLButtonElement} */ (toast.querySelector('.undo'));
    const close = /** @type {HTMLButtonElement} */ (toast.querySelector('.x'));

    await vi.advanceTimersByTimeAsync(800);
    undo.focus();
    await vi.advanceTimersByTimeAsync(5000);
    expect(props.show).toBe(true);
    // Moving on to the next control is still inside the toast
    close.focus();
    await vi.advanceTimersByTimeAsync(5000);
    expect(props.show).toBe(true);
    // Leaving it starts the countdown over
    close.blur();
    await vi.advanceTimersByTimeAsync(999);
    expect(props.show).toBe(true);
    await vi.advanceTimersByTimeAsync(1);
    expect(props.show).toBe(false);
  });

  it('inserts the toast when shown, and removes it once faded out', async () => {
    /** @type {ComponentProps<typeof Toast>} */
    const props = $state({ show: false, duration: 0, children: text('Saved') });

    await render(Toast, props);

    const base = /** @type {HTMLElement} */ (getBase());

    expect(base.querySelector('.sui.toast')).toBeNull();
    expect(base.matches(':popover-open')).toBe(false);
    props.show = true;

    await vi.waitFor(() => {
      expect(base.querySelector('.sui.toast')?.textContent).toContain('Saved');
    });

    const toast = /** @type {HTMLElement} */ (base.querySelector('.sui.toast'));

    expect(base.matches(':popover-open')).toBe(true);
    props.show = false;
    await vi.waitFor(() => {
      expect(toast.getAttribute('aria-hidden')).toBe('true');
    });
    // Still there while fading
    expect(toast.textContent).toContain('Saved');
    expect(toast.parentElement?.parentElement).toBe(base);
    await vi.advanceTimersByTimeAsync(250);
    await vi.waitFor(() => {
      expect(toast.isConnected).toBe(false);
    });
    expect(toast.textContent).not.toContain('Saved');
    expect(base.matches(':popover-open')).toBe(false);
  });

  it('keeps the base open while another toast is still shown', async () => {
    /** @type {ComponentProps<typeof Toast>} */
    const props = $state({ show: true, duration: 0, children: text('One') });

    await render(Toast, props);
    await render(Toast, { show: true, duration: 0, children: text('Two') });

    const base = /** @type {HTMLElement} */ (getBase());

    props.show = false;
    await vi.advanceTimersByTimeAsync(250);
    await vi.waitFor(() => {
      expect(base.querySelectorAll('.sui.toast')).toHaveLength(1);
    });
    expect(base.matches(':popover-open')).toBe(true);
  });

  describe('with a modal dialog', () => {
    /** @type {HTMLDialogElement} */
    let dialog;

    beforeEach(() => {
      dialog = document.createElement('dialog');
      document.body.appendChild(dialog);
    });

    afterEach(() => {
      dialog.close();
      dialog.remove();
    });

    it('renders the base within a modal dialog open from the start', async () => {
      dialog.showModal();
      await render(Toast, { show: true, duration: 0, children: text('Saved') });

      const base = /** @type {HTMLElement} */ (getBase());

      expect(base.parentElement).toBe(dialog);
      expect(base.matches(':popover-open')).toBe(true);
    });

    it('moves the base into a modal dialog once opened, and back out once closed', async () => {
      await render(Toast, { show: true, duration: 0, children: text('Saved') });

      const base = /** @type {HTMLElement} */ (getBase());

      expect(base.parentElement).toBe(document.body);
      dialog.showModal();
      await vi.waitFor(() => {
        expect(base.parentElement).toBe(dialog);
      });
      expect(base.matches(':popover-open')).toBe(true);
      expect(base.querySelector('.sui.toast')?.textContent).toContain('Saved');
      dialog.close();
      // Moved out synchronously, before the dialog could be removed
      expect(base.parentElement).toBe(document.body);
      await vi.waitFor(() => {
        expect(base.matches(':popover-open')).toBe(true);
      });
    });

    it('keeps the toast interactive over a modal dialog', async () => {
      await render(Toast, {
        show: true,
        duration: 0,
        children: html('<button class="undo">Undo</button>'),
      });
      dialog.showModal();

      const undo = /** @type {HTMLButtonElement} */ (getBase()?.querySelector('.undo'));

      await vi.waitFor(() => {
        const { x, y, width, height } = undo.getBoundingClientRect();

        expect(document.elementFromPoint(x + width / 2, y + height / 2)).toBe(undo);
      });
      undo.focus();
      expect(document.activeElement).toBe(undo);
    });

    it('reopens the base after moving it in a browser without `moveBefore()`', async () => {
      const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'moveBefore');

      // Hide the method, so the base is moved with `appendChild()`, which closes the popover
      Object.defineProperty(Element.prototype, 'moveBefore', {
        configurable: true,
        value: undefined,
      });

      try {
        await render(Toast, { show: true, duration: 0 });

        const base = /** @type {HTMLElement} */ (getBase());

        dialog.showModal();
        await vi.waitFor(() => {
          expect(base.parentElement).toBe(dialog);
        });
        expect(base.matches(':popover-open')).toBe(true);
        dialog.close();
        expect(base.parentElement).toBe(document.body);
        expect(base.matches(':popover-open')).toBe(true);
      } finally {
        if (descriptor) {
          Object.defineProperty(Element.prototype, 'moveBefore', descriptor);
        } else {
          // @ts-ignore
          delete Element.prototype.moveBefore;
        }
      }
    });

    it('moves the base into a modal dialog without opening it while no toast is shown', async () => {
      await render(Toast, { show: false });

      const base = /** @type {HTMLElement} */ (getBase());

      dialog.showModal();
      await vi.waitFor(() => {
        expect(base.parentElement).toBe(dialog);
      });
      expect(base.matches(':popover-open')).toBe(false);
    });

    it('ignores a non-modal dialog', async () => {
      await render(Toast, { show: true, duration: 0 });

      const base = /** @type {HTMLElement} */ (getBase());

      dialog.show();
      dialog.close();
      await vi.advanceTimersByTimeAsync(0);
      expect(base.parentElement).toBe(document.body);
      expect(base.matches(':popover-open')).toBe(true);
    });

    it('follows the topmost of nested modal dialogs', async () => {
      const inner = document.createElement('dialog');

      // Placed before the outer dialog in the DOM tree, but opened after it
      document.body.prepend(inner);
      await render(Toast, { show: true, duration: 0 });

      const base = /** @type {HTMLElement} */ (getBase());

      dialog.showModal();
      await vi.waitFor(() => {
        expect(base.parentElement).toBe(dialog);
      });
      inner.showModal();
      await vi.waitFor(() => {
        expect(base.parentElement).toBe(inner);
      });
      inner.close();
      expect(base.parentElement).toBe(dialog);
      inner.remove();
    });

    it('keeps following modal dialogs after the toast that created the base is gone', async () => {
      const first = await render(Toast, { show: false });
      /** @type {ComponentProps<typeof Toast>} */
      const props = $state({ show: true, duration: 0, children: text('Two') });

      await render(Toast, props);

      const base = /** @type {HTMLElement} */ (getBase());

      await first.unmount();
      // Still in place for the remaining toast
      expect(base.isConnected).toBe(true);
      expect(base.querySelector('.sui.toast')?.textContent).toContain('Two');
      dialog.showModal();
      await vi.waitFor(() => {
        expect(base.parentElement).toBe(dialog);
      });
      dialog.close();
      expect(base.parentElement).toBe(document.body);
    });

    it('recovers when the dialog is removed without being closed first', async () => {
      /** @type {ComponentProps<typeof Toast>} */
      const props = $state({ show: true, duration: 0 });

      await render(Toast, props);

      const base = /** @type {HTMLElement} */ (getBase());

      dialog.showModal();
      await vi.waitFor(() => {
        expect(base.parentElement).toBe(dialog);
      });
      dialog.remove();
      props.show = false;
      await vi.advanceTimersByTimeAsync(250);
      props.show = true;
      await vi.waitFor(() => {
        expect(base.parentElement).toBe(document.body);
      });
      expect(base.matches(':popover-open')).toBe(true);
    });
  });

  it('stays until hidden manually with a zero duration', async () => {
    /** @type {ComponentProps<typeof Toast>} */
    const props = $state({ show: true, duration: 0 });

    await render(Toast, props);
    await vi.advanceTimersByTimeAsync(10000);
    expect(props.show).toBe(true);
  });

  it('restarts the timer when the ID changes', async () => {
    /** @type {ComponentProps<typeof Toast>} */
    const props = $state({ show: true, duration: 1000, id: 1 });

    await render(Toast, props);
    await vi.advanceTimersByTimeAsync(800);
    props.id = 2;
    await vi.advanceTimersByTimeAsync(800);
    expect(props.show).toBe(true);
    await vi.advanceTimersByTimeAsync(200);
    expect(props.show).toBe(false);
  });

  it('cancels the countdown when unmounted', async () => {
    /** @type {ComponentProps<typeof Toast>} */
    const props = $state({ show: true, duration: 1000 });
    const screen = await render(Toast, props);

    await vi.advanceTimersByTimeAsync(500);
    await screen.unmount();
    await vi.advanceTimersByTimeAsync(1000);
    expect(props.show).toBe(true);
  });

  it('removes the toast when unmounted', async () => {
    const first = await render(Toast, { show: true, children: text('One') });
    const second = await render(Toast, { show: true, children: text('Two') });

    expect(document.querySelectorAll('.sui.toast')).toHaveLength(2);
    await second.unmount();
    expect(document.querySelectorAll('.sui.toast')).toHaveLength(1);
    expect(document.querySelector('.sui.toast')?.textContent).toContain('One');
    // The base belongs to the toast that created it, and goes away with it
    await first.unmount();
    expect(document.querySelector('.sui.toast')).toBeNull();
    expect(getBase()).toBeNull();
  });
});
