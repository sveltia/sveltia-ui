<!--
  @component
  The interactive version of `<TableCell>`.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td
  @see https://w3c.github.io/aria/#gridcell
-->
<script>
  /**
   * @typedef {object} Props
   * @property {string} [class] - The `class` attribute on the wrapper element.
   * @property {import('svelte').Snippet} [children] - Primary slot content.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<div {...restProps} role="gridcell" class="sui grid-cell {className}">
  {@render children?.()}
</div>

<style lang="scss">
  .grid-cell {
    display: table-cell;
  }
</style>
