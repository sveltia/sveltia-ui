<!--
  @component
  @see https://github.com/sveltejs/svelte/issues/3088
-->
<script>
  import { onDestroy, onMount } from 'svelte';

  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };

  /** @type {HTMLElement} */
  let ref;

  onMount(() => {
    document.body.appendChild(ref);
  });

  onDestroy(() => {
    ref.remove();
  });
</script>

<div role="none" class="sui portal {className}" {...$$restProps} bind:this={ref}>
  <slot />
</div>

<style lang="scss">
  .portal {
    display: contents;
  }
</style>
