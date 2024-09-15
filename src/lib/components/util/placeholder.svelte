<!--
  @component
  @see https://github.com/sveltejs/svelte/issues/3088
-->
<script>
  /**
   * @typedef {object} Props
   * @property {import('svelte').Snippet} [children] - Primary slot content.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    children,
    /* eslint-enable prefer-const */
  } = $props();
</script>

{@render children?.()}
