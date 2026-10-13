import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import InfiniteScrollFixture from './infinite-scroll-fixture.test.svelte';

/**
 * Create a list of items.
 * @param {number} length Number of items.
 * @returns {{ id: string, label: string }[]} Items.
 */
const createItems = (length) =>
  Array.from({ length }, (_, i) => ({ id: `i${i}`, label: `Item ${i}` }));

const items = createItems(12);
const longItems = createItems(80);

/**
 * Wait for a few frames, so an observer that would load another chunk has had the chance to.
 */
const settle = async () => {
  for (let i = 0; i < 5; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });
  }
};

it('renders the first chunk with a spinner, then more as the spinner nears the view', async () => {
  // Each 20-item chunk is 400px tall, four times the height of the 100px scroller
  const screen = await render(InfiniteScrollFixture, { items: longItems, itemChunkSize: 20 });
  const scroller = /** @type {HTMLElement} */ (screen.container.querySelector('.scroller'));

  expect(screen.container.querySelectorAll('.item')).toHaveLength(20);
  expect(screen.container.querySelector('.item')?.textContent).toBe('0: Item 0');
  expect(screen.container.querySelector('.spinner')).not.toBeNull();

  // The spinner is 300px below the view, within the 500px margin, so the next chunk loads without
  // scrolling; then it’s 700px below and the loading stops
  await vi.waitFor(() => {
    expect(screen.container.querySelectorAll('.item')).toHaveLength(40);
  });
  await settle();
  expect(screen.container.querySelectorAll('.item')).toHaveLength(40);

  // Scrolling by 250px brings the spinner within the margin before it comes into view
  scroller.scrollTop = 250;
  await vi.waitFor(() => {
    expect(screen.container.querySelectorAll('.item')).toHaveLength(60);
  });
  await settle();
  expect(screen.container.querySelectorAll('.item')).toHaveLength(60);

  scroller.scrollTop = scroller.scrollHeight;
  await vi.waitFor(() => {
    expect(screen.container.querySelectorAll('.item')).toHaveLength(80);
  });
  expect(screen.container.querySelector('.spinner')).toBeNull();
});

it('ignores an ancestor that can scroll but doesn’t clip the list', async () => {
  // The horizontal scroller’s `overflow-y` computes to `auto`, but it grows with the list: as the
  // observer’s root, it would let every chunk load at once
  const screen = await render(InfiniteScrollFixture, {
    items: longItems,
    itemChunkSize: 20,
    wrapped: true,
  });

  await vi.waitFor(() => {
    expect(screen.container.querySelectorAll('.item')).toHaveLength(40);
  });
  await settle();
  expect(screen.container.querySelectorAll('.item')).toHaveLength(40);
});

it('loads more within the page when there’s no scroll container', async () => {
  const screen = await render(InfiniteScrollFixture, {
    items,
    itemChunkSize: 5,
    scrollable: false,
  });

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
       * @param {IntersectionObserverInit} [options] Options.
       */
      constructor(callback, options) {
        super(callback, options);
        created();
      }
    },
  );

  try {
    const fitting = await render(InfiniteScrollFixture, { items: items.slice(0, 3) });

    expect(created).not.toHaveBeenCalled();
    await fitting.unmount();

    const screen = await render(InfiniteScrollFixture, { items: longItems, itemChunkSize: 10 });

    expect(created).toHaveBeenCalled();
    disconnect.mockClear();
    await screen.unmount();
    expect(disconnect).toHaveBeenCalled();
  } finally {
    vi.unstubAllGlobals();
    disconnect.mockRestore();
  }
});
