import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { text } from '../../test-utils/snippets.js';
import Toast from './toast.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

/**
 * Get the shared popover base the toasts are rendered in.
 * @returns {HTMLElement | null} Element.
 */
const getBase = () => document.querySelector('.sui.toast-base.enabled');

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

  it('inserts the content when shown, and removes it once faded out', async () => {
    /** @type {ComponentProps<typeof Toast>} */
    const props = $state({ show: false, duration: 0, children: text('Saved') });

    await render(Toast, props);

    const toast = /** @type {HTMLElement} */ (getBase()?.querySelector('.sui.toast'));

    expect(toast.textContent).not.toContain('Saved');
    props.show = true;
    await vi.waitFor(() => {
      expect(toast.textContent).toContain('Saved');
    });
    props.show = false;
    await vi.waitFor(() => {
      expect(toast.getAttribute('aria-hidden')).toBe('true');
    });
    // Still there while fading
    expect(toast.textContent).toContain('Saved');
    await vi.advanceTimersByTimeAsync(250);
    await vi.waitFor(() => {
      expect(toast.textContent).not.toContain('Saved');
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
