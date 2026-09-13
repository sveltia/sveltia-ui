import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import ResizableHandle from './resizable-handle.svelte';
import ResizablePaneFixture from './resizable-pane-fixture.test.svelte';
import { setRTL } from '../../test-utils/locale.js';

/**
 * Get the flex basis of each pane.
 * @param {HTMLElement} container Container.
 * @returns {string[]} Flex bases.
 */
const getSizes = (container) =>
  /** @type {HTMLElement[]} */ ([...container.querySelectorAll('.sui.resizable-pane')]).map(
    (pane) => pane.style.flexBasis,
  );

describe('ResizableHandle', () => {
  afterEach(() => {
    setRTL(false);
  });

  it('requires a pane group around it', async () => {
    await expect(render(ResizableHandle)).rejects.toThrow('<ResizableHandle> must be used inside');
  });

  it('renders a separator describing the pane before it', async () => {
    const screen = await render(ResizablePaneFixture, {
      firstDefaultSize: 30,
      firstMinSize: 10,
      firstMaxSize: 80,
    });

    const handle = screen.getByRole('separator', { name: 'Resize' });

    const first = /** @type {HTMLElement} */ (
      screen.container.querySelector('.sui.resizable-pane')
    );

    await expect.element(handle).toHaveClass('sui', 'resizable-handle', 'horizontal');
    await expect.element(handle).toHaveAttribute('tabindex', '0');
    await expect.element(handle).toHaveAttribute('aria-orientation', 'vertical');
    await expect.element(handle).toHaveAttribute('aria-valuenow', '30');
    await expect.element(handle).toHaveAttribute('aria-valuemin', '10');
    await expect.element(handle).toHaveAttribute('aria-valuemax', '80');
    expect(handle.element().getAttribute('aria-controls')).toBe(first.id);
    expect(handle.element().hasAttribute('aria-disabled')).toBe(false);
    expect(handle.element().querySelector('.handle-bar')).toBeNull();
  });

  it('shows a handle bar or custom content', async () => {
    const screen = await render(ResizablePaneFixture, { showHandleBar: true, third: true });
    const [first, second] = screen.getByRole('separator').all();

    expect(first.element().querySelector('.handle-bar')).not.toBeNull();
    expect(second.element().querySelector('.custom-handle')).not.toBeNull();
    expect(second.element().querySelector('.handle-bar')).toBeNull();
  });

  it('can be disabled', async () => {
    const screen = await render(ResizablePaneFixture, { disabled: true });
    const handle = screen.getByRole('separator');

    await expect.element(handle).toHaveAttribute('tabindex', '-1');
    await expect.element(handle).toHaveAttribute('aria-disabled', 'true');
    await expect.element(handle).toHaveClass('disabled');
    /** @type {HTMLElement} */ (handle.element()).focus();
    await userEvent.keyboard('{ArrowRight}');
    handle
      .element()
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    handle
      .element()
      .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }));
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(getSizes(screen.container)).toEqual(['50%', '50%']);
    expect(handle.element().classList.contains('dragging')).toBe(false);
  });

  it('reverses the drag direction in a right-to-left locale', async () => {
    setRTL(true);

    const screen = await render(ResizablePaneFixture);
    const handle = /** @type {HTMLElement} */ (screen.getByRole('separator').element());

    await vi.waitFor(() => {
      expect(getSizes(screen.container)).toEqual(['50%', '50%']);
    });
    handle.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, screenX: 100, pointerId: 1 }),
    );
    // Moving the pointer to the right shrinks the first pane, which sits on the right
    document.dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, screenX: 150, pointerId: 1 }),
    );
    await vi.waitFor(() => {
      expect(getSizes(screen.container)).toEqual(['40%', '60%']);
    });
    // Keys are swapped as well
    document.dispatchEvent(
      new PointerEvent('pointerup', { bubbles: true, screenX: 150, pointerId: 1 }),
    );
    handle.focus();
    await userEvent.keyboard('{ArrowLeft}');
    await vi.waitFor(() => {
      expect(getSizes(screen.container)).toEqual(['41%', '59%']);
    });
  });

  it('ignores pointer events from another pointer while dragging', async () => {
    const screen = await render(ResizablePaneFixture);
    const handle = /** @type {HTMLElement} */ (screen.getByRole('separator').element());

    await vi.waitFor(() => {
      expect(getSizes(screen.container)).toEqual(['50%', '50%']);
    });
    handle.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, screenX: 100, pointerId: 1 }),
    );
    document.dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, screenX: 150, pointerId: 2 }),
    );
    document.dispatchEvent(
      new PointerEvent('pointerup', { bubbles: true, screenX: 150, pointerId: 2 }),
    );
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(getSizes(screen.container)).toEqual(['50%', '50%']);
    await vi.waitFor(() => {
      expect(handle.classList.contains('dragging')).toBe(true);
    });
    document.dispatchEvent(
      new PointerEvent('pointerup', { bubbles: true, screenX: 150, pointerId: 1 }),
    );
  });

  it('resizes with the keyboard, within the constraints, and reports the interaction', async () => {
    const onResizeStart = vi.fn();
    const onResizeEnd = vi.fn();

    const screen = await render(ResizablePaneFixture, {
      firstMinSize: 40,
      firstMaxSize: 60,
      onResizeStart,
      onResizeEnd,
    });

    const handle = /** @type {HTMLElement} */ (screen.getByRole('separator').element());

    await vi.waitFor(() => {
      expect(getSizes(screen.container)).toEqual(['50%', '50%']);
    });
    handle.focus();
    await userEvent.keyboard('{ArrowRight}');
    await vi.waitFor(() => {
      expect(getSizes(screen.container)).toEqual(['51%', '49%']);
    });
    expect(onResizeStart).toHaveBeenCalledOnce();
    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
    // Capped at the maximum
    await vi.waitFor(() => {
      expect(getSizes(screen.container)).toEqual(['60%', '40%']);
    });
    await userEvent.keyboard('{Home}');
    await vi.waitFor(() => {
      expect(getSizes(screen.container)).toEqual(['40%', '60%']);
    });
    await userEvent.keyboard('{End}');
    await vi.waitFor(() => {
      expect(getSizes(screen.container)).toEqual(['60%', '40%']);
    });
    expect(onResizeStart).toHaveBeenCalledOnce();
    expect(onResizeEnd).not.toHaveBeenCalled();
    handle.blur();
    expect(onResizeEnd).toHaveBeenCalledOnce();
  });

  it('collapses and restores the pane with Enter', async () => {
    const screen = await render(ResizablePaneFixture, { firstMinSize: 10 });
    const handle = /** @type {HTMLElement} */ (screen.getByRole('separator').element());

    await vi.waitFor(() => {
      expect(getSizes(screen.container)).toEqual(['50%', '50%']);
    });
    handle.focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => {
      expect(getSizes(screen.container)).toEqual(['10%', '90%']);
    });
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => {
      expect(getSizes(screen.container)).toEqual(['50%', '50%']);
    });
  });

  it('resizes by dragging', async () => {
    const onResizeStart = vi.fn();
    const onResizeEnd = vi.fn();
    const screen = await render(ResizablePaneFixture, { onResizeStart, onResizeEnd });
    const handle = /** @type {HTMLElement} */ (screen.getByRole('separator').element());

    await vi.waitFor(() => {
      expect(getSizes(screen.container)).toEqual(['50%', '50%']);
    });

    /**
     * Make a pointer event.
     * @param {string} type Event type.
     * @param {number} screenX Pointer position.
     * @returns {PointerEvent} Event.
     */
    const at = (type, screenX) =>
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        screenX,
        screenY: 0,
        pointerId: 1,
      });

    handle.dispatchEvent(at('pointerdown', 100));
    await vi.waitFor(() => {
      expect(handle.classList.contains('dragging')).toBe(true);
    });
    expect(onResizeStart).toHaveBeenCalledOnce();
    // The group is 500px wide, so 50px is 10%
    document.dispatchEvent(at('pointermove', 150));
    await vi.waitFor(() => {
      expect(getSizes(screen.container)).toEqual(['60%', '40%']);
    });
    document.dispatchEvent(at('pointermove', 100));
    await vi.waitFor(() => {
      expect(getSizes(screen.container)).toEqual(['50%', '50%']);
    });
    document.dispatchEvent(at('pointerup', 100));
    await vi.waitFor(() => {
      expect(handle.classList.contains('dragging')).toBe(false);
    });
    expect(onResizeEnd).toHaveBeenCalledOnce();
    // Once released, further moves are ignored
    document.dispatchEvent(at('pointermove', 200));
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(getSizes(screen.container)).toEqual(['50%', '50%']);
  });

  it('resizes vertically by dragging', async () => {
    const screen = await render(ResizablePaneFixture, { direction: 'vertical' });
    const handle = /** @type {HTMLElement} */ (screen.getByRole('separator').element());

    await vi.waitFor(() => {
      expect(getSizes(screen.container)).toEqual(['50%', '50%']);
    });
    handle.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, screenY: 100, pointerId: 1 }),
    );
    // The group is 300px tall, so 30px is 10%
    document.dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, screenY: 70, pointerId: 1 }),
    );
    await vi.waitFor(() => {
      expect(getSizes(screen.container)).toEqual(['40%', '60%']);
    });
    document.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 1 }));
    await vi.waitFor(() => {
      expect(handle.classList.contains('dragging')).toBe(false);
    });
  });
});
