import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import ResizablePaneFixture from './resizable-pane-fixture.test.svelte';

/**
 * Get the flex basis of each pane.
 * @param {HTMLElement} container Container.
 * @returns {string[]} Flex bases.
 */
const getSizes = (container) =>
  /** @type {HTMLElement[]} */ ([...container.querySelectorAll('.sui.resizable-pane')]).map(
    (pane) => pane.style.flexBasis,
  );

describe('ResizablePaneGroup', () => {
  it('lays out the panes horizontally, sharing the space equally by default', async () => {
    const screen = await render(ResizablePaneFixture);

    const group = /** @type {HTMLElement} */ (
      screen.container.querySelector('.sui.resizable-pane-group')
    );

    expect(group.classList.contains('horizontal')).toBe(true);
    expect(group.dataset.direction).toBe('horizontal');
    await vi.waitFor(() => {
      expect(getSizes(screen.container)).toEqual(['50%', '50%']);
    });

    const [first] = /** @type {HTMLElement[]} */ ([
      ...group.querySelectorAll('.sui.resizable-pane'),
    ]);

    expect(first.classList.contains('first')).toBe(true);
    expect(first.style.flexGrow).toBe('0');
    expect(first.style.flexShrink).toBe('0');
    expect(first.style.overflowX).toBe('auto');
    expect(first.style.overflowY).toBe('');
    expect(first.getBoundingClientRect().width).toBe(250);
  });

  it('honors the default sizes, in percentages and pixels', async () => {
    const screen = await render(ResizablePaneFixture, {
      firstDefaultSize: '100px',
      third: true,
      secondDefaultSize: 30,
    });

    await vi.waitFor(() => {
      expect(getSizes(screen.container)).toEqual(['20%', '30%', '50%']);
    });
  });

  it('lays out the panes vertically on demand', async () => {
    const screen = await render(ResizablePaneFixture, { direction: 'vertical' });

    const group = /** @type {HTMLElement} */ (
      screen.container.querySelector('.sui.resizable-pane-group')
    );

    const first = /** @type {HTMLElement} */ (group.querySelector('.sui.resizable-pane'));

    expect(group.classList.contains('vertical')).toBe(true);
    await vi.waitFor(() => {
      expect(first.getBoundingClientRect().height).toBe(150);
    });
    expect(first.style.overflowY).toBe('auto');
    expect(first.style.overflowX).toBe('');
    await expect
      .element(screen.getByRole('separator'))
      .toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('ignores a handle that has no pane after it', async () => {
    const onResize = vi.fn();
    const screen = await render(ResizablePaneFixture, { trailingHandle: true, onResize });

    const handle = /** @type {HTMLElement} */ (
      screen.getByRole('separator', { name: 'Trailing' }).element()
    );

    await vi.waitFor(() => {
      expect(getSizes(screen.container)).toEqual(['50%', '50%']);
    });
    handle.focus();
    await userEvent.keyboard('{ArrowLeft}');
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(getSizes(screen.container)).toEqual(['50%', '50%']);
    expect(onResize).not.toHaveBeenCalled();
  });

  it('reports the sizes to the group and each pane', async () => {
    const onResize = vi.fn();
    const onPaneResize = vi.fn();
    const screen = await render(ResizablePaneFixture, { onResize, onPaneResize });

    await vi.waitFor(() => {
      expect(onPaneResize).toHaveBeenCalledWith({ size: 50 });
    });
    /** @type {HTMLElement} */ (screen.getByRole('separator').element()).focus();
    await userEvent.keyboard('{ArrowRight}');
    await vi.waitFor(() => {
      expect(onResize).toHaveBeenCalledWith({ sizes: [51, 49] });
    });
    expect(onPaneResize).toHaveBeenLastCalledWith({ size: 51 });
  });
});
