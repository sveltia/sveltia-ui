<!--
  @component Enable infinite scroll for list items for better rendering performance.
  @see https://svelte.dev/docs/svelte/v5-migration-guide#Snippets-instead-of-slots-Passing-data-back-up
-->
<script>
  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {any[]} items Item list.
   * @property {string} itemKey Item key used for the `each` loop.
   * @property {number} [itemChunkSize] Number of items to be loaded at once. Defaults to 25.
   * @property {Snippet<[any, number]>} renderItem Snippet to render each item. The snippet receives
   * the item and its index as parameters.
   */

  /** @type {Props} */
  let {
    /* eslint-disable prefer-const */
    items,
    itemKey,
    itemChunkSize = 25,
    renderItem,
    /* eslint-enable prefer-const */
  } = $props();

  /** @type {number} */
  // svelte-ignore state_referenced_locally
  let loadedItemSize = $state(itemChunkSize);

  /** @type {HTMLElement | undefined} */
  let spinner = $state(undefined);

  const loading = $derived(items.length > loadedItemSize);

  /**
   * The scroll container found for the spinner, kept once found. Looking it up reads the computed
   * style and the scroll size of every ancestor, which forces a layout each time a chunk has been
   * rendered. The list only grows from then on, so a container that scrolls keeps doing so.
   * @type {HTMLElement | null}
   */
  let scrollContainer = null;

  /**
   * Get the nearest ancestor of the given element that scrolls vertically. An ancestor that can
   * scroll but whose content fits, like one growing with the list or a horizontal scroller, doesn’t
   * clip the element, and as the observer’s root it would let every chunk load at once. The heights
   * are rounded separately, so a 1px difference doesn’t count as scrolling.
   * @param {HTMLElement} element Element.
   * @returns {HTMLElement | null} Scroll container, or `null` if the document itself scrolls.
   */
  const getScrollContainer = (element) => {
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      if (
        parent.scrollHeight - parent.clientHeight > 1 &&
        /^(auto|scroll)$/.test(getComputedStyle(parent).overflowY)
      ) {
        return parent;
      }
    }

    return null;
  };

  // Observe the spinner anew once each chunk is rendered: the observer only reports changes, so a
  // spinner that stays in view because the chunk didn’t fill the viewport would stall the loading.
  // Observing an element always reports its current state first. The observer is created here
  // rather than when the component is set up, since `IntersectionObserver` doesn’t exist during
  // server-side rendering, and it’s disconnected before the next chunk and on unmount.
  // The next chunk starts loading while the spinner is still a little below the visible area, so
  // the scrolling doesn’t stop at the end of each chunk. The margin only applies to the observer’s
  // root, which has to be the scroll container: the viewport margin wouldn’t reveal a spinner
  // clipped by a scrolling ancestor.
  $effect(() => {
    void loadedItemSize;

    if (!spinner) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // A busy browser can report several changes at once, oldest first, so only the last entry
        // tells whether the spinner is near the view now
        if (entries.at(-1)?.isIntersecting && loading) {
          loadedItemSize += itemChunkSize;
        }
      },
      { root: (scrollContainer ??= getScrollContainer(spinner)), rootMargin: '0px 0px 500px 0px' },
    );

    observer.observe(spinner);

    return () => {
      observer.disconnect();
    };
  });
</script>

{#each items.slice(0, loadedItemSize) as item, index (item[itemKey] ?? index)}
  {@render renderItem(item, index)}
{/each}

{#if loading}
  <div role="none" class="spinner" bind:this={spinner}></div>
{/if}

<style>
  .spinner {
    height: 1px;
  }
</style>
