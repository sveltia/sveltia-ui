import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ResizablePaneFixture from './resizable-pane-fixture.test.svelte';
import ResizablePane from './resizable-pane.svelte';

describe('ResizablePane', () => {
  it('requires a pane group around it', async () => {
    await expect(render(ResizablePane)).rejects.toThrow('<ResizablePane> must be used inside');
  });

  it('renders the pane with its size and the children', async () => {
    const screen = await render(ResizablePaneFixture, { firstDefaultSize: 30 });

    const first = /** @type {HTMLElement} */ (
      screen.container.querySelector('.sui.resizable-pane')
    );

    expect(first.getAttribute('role')).toBe('none');
    expect(first.classList.contains('first')).toBe(true);
    expect(first.id).toBeTruthy();
    expect(first.textContent?.trim()).toBe('First');
    await vi.waitFor(() => {
      expect(first.style.flexBasis).toBe('30%');
    });
    expect(first.style.flexGrow).toBe('0');
    // Shrinkable, so the handles take their room from the panes rather than overflowing the group
    expect(first.style.flexShrink).toBe('1');
  });

  it('uses the default size as is until the group has measured the panes', async () => {
    const screen = await render(ResizablePaneFixture, { firstDefaultSize: '120px' });

    const first = /** @type {HTMLElement} */ (
      screen.container.querySelector('.sui.resizable-pane')
    );

    // Once resolved, the size is a percentage of the 500px the panes share
    await vi.waitFor(() => {
      expect(first.style.flexBasis).toBe('24%');
    });
    expect(first.getBoundingClientRect().width).toBe(120);
  });

  it('reports its size whenever it changes', async () => {
    const onPaneResize = vi.fn();
    const screen = await render(ResizablePaneFixture, { firstDefaultSize: 33.33, onPaneResize });

    await vi.waitFor(() => {
      expect(onPaneResize).toHaveBeenCalledWith({ size: 33.3 });
    });
    expect(screen.container.querySelector('.sui.resizable-pane')).not.toBeNull();
  });
});
