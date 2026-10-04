import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import InfiniteScrollFixture from './infinite-scroll-fixture.test.svelte';

const items = Array.from({ length: 12 }, (_, i) => ({ id: `i${i}`, label: `Item ${i}` }));

it('renders the first chunk with a spinner, then more as the spinner comes into view', async () => {
  const screen = await render(InfiniteScrollFixture, { items, itemChunkSize: 5 });
  const scroller = /** @type {HTMLElement} */ (screen.container.querySelector('.scroller'));

  expect(screen.container.querySelectorAll('.item')).toHaveLength(5);
  expect(screen.container.querySelector('.item')?.textContent).toBe('0: Item 0');
  expect(screen.container.querySelector('.spinner')).not.toBeNull();

  scroller.scrollTop = scroller.scrollHeight;
  await vi.waitFor(() => {
    expect(screen.container.querySelectorAll('.item')).toHaveLength(10);
  });

  scroller.scrollTop = scroller.scrollHeight;
  await vi.waitFor(() => {
    expect(screen.container.querySelectorAll('.item')).toHaveLength(12);
  });
  expect(screen.container.querySelector('.spinner')).toBeNull();
});

it('falls back to the index for items without the key', async () => {
  const screen = await render(InfiniteScrollFixture, {
    items: /** @type {any[]} */ ([{ label: 'A' }, { label: 'B' }]),
  });

  expect([...screen.container.querySelectorAll('.item')].map((item) => item.textContent)).toEqual([
    '0: A',
    '1: B',
  ]);
});

it('renders everything at once when the list fits in a chunk', async () => {
  const screen = await render(InfiniteScrollFixture, { items: items.slice(0, 3) });

  expect(screen.container.querySelectorAll('.item')).toHaveLength(3);
  expect(screen.container.querySelector('.spinner')).toBeNull();
});

it('keeps loading while the spinner stays in view after a chunk is rendered', async () => {
  // Two 20px items don’t fill the 100px scroller, so the spinner never leaves the view
  const screen = await render(InfiniteScrollFixture, { items, itemChunkSize: 2 });

  await vi.waitFor(() => {
    expect(screen.container.querySelectorAll('.item').length).toBeGreaterThanOrEqual(6);
  });
});

it('only creates an observer while the spinner is mounted, and disconnects it on unmount', async () => {
  const NativeObserver = IntersectionObserver;
  const created = vi.fn();
  const disconnect = vi.spyOn(NativeObserver.prototype, 'disconnect');

  // Creating the observer while the component is set up would break server-side rendering, where
  // `IntersectionObserver` doesn’t exist
  vi.stubGlobal(
    'IntersectionObserver',
    /**
     * `IntersectionObserver` that records its creation.
     */
    class extends NativeObserver {
      /**
       * Record the creation.
       * @param {IntersectionObserverCallback} callback Callback.
       */
      constructor(callback) {
        super(callback);
        created();
      }
    },
  );

  try {
    const fitting = await render(InfiniteScrollFixture, { items: items.slice(0, 3) });

    expect(created).not.toHaveBeenCalled();
    await fitting.unmount();

    const screen = await render(InfiniteScrollFixture, { items, itemChunkSize: 5 });

    expect(created).toHaveBeenCalled();
    disconnect.mockClear();
    await screen.unmount();
    expect(disconnect).toHaveBeenCalled();
  } finally {
    vi.unstubAllGlobals();
    disconnect.mockRestore();
  }
});
