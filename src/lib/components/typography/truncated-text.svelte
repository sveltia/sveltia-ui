<script>
  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {number} [lines] Number of lines.
   * @property {Snippet} [children] Primary slot content.
   */

  /** @type {Props} */
  let {
    /* eslint-disable prefer-const */
    lines = 1,
    children = undefined,
    /* eslint-enable prefer-const */
  } = $props();
</script>

<span
  role="none"
  class="sui truncated-text"
  style="-webkit-line-clamp: {lines}; line-clamp: {lines};"
>
  {@render children?.()}
</span>

<style lang="scss">
  .truncated-text {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    white-space: normal;
    overflow-wrap: anywhere;
  }
</style>
