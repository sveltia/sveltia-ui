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

  // Observe the spinner anew once each chunk is rendered: the observer only reports changes, so a
  // spinner that stays in view because the chunk didn’t fill the viewport would stall the loading.
  // Observing an element always reports its current state first. The observer is created here
  // rather than when the component is set up, since `IntersectionObserver` doesn’t exist during
  // server-side rendering, and it’s disconnected before the next chunk and on unmount.
  $effect(() => {
    void loadedItemSize;

    if (!spinner) {
      return undefined;
    }

    const observer = new IntersectionObserver(([{ isIntersecting }]) => {
      if (isIntersecting && loading) {
        loadedItemSize += itemChunkSize;
      }
    });

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
