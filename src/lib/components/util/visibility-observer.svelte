<script>
  import { removeVisibilityResolver, waitForVisibility } from '@sveltia/utils/element';

  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {boolean} [eager] Whether to render the content right away rather than once it comes
   * into view, such as an item just added to a list, which is then scrolled into view and focused.
   * Only the value at mount is used, as the content stays rendered anyway.
   * @property {Snippet} children Slot content.
   */

  /** @type {Props} */
  let {
    /* eslint-disable prefer-const */
    eager = false,
    children,
    /* eslint-enable prefer-const */
  } = $props();

  /** @type {HTMLElement | null} */
  let placeholder = $state(null);
  /** @type {boolean} */
  // svelte-ignore state_referenced_locally
  let visible = $state(eager);

  $effect(() => {
    if (placeholder) {
      (async () => {
        await waitForVisibility(placeholder);
        visible = true;
      })();
    }

    // Clean up
    return () => {
      if (placeholder) {
        removeVisibilityResolver(placeholder);
      }
    };
  });
</script>

{#if visible}
  {@render children()}
{:else}
  <div class="placeholder" bind:this={placeholder}></div>
{/if}

<style>
  .placeholder {
    height: 64px;
  }
</style>
