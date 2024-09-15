<!--
  @component
  The interactive version of `<TableRowHeader>`.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th
  @see https://w3c.github.io/aria/#rowheader
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

<div {...restProps} role="rowheader" class="sui grid-row-header {className}">
  {@render children?.()}
</div>

<style lang="scss">
  .grid-row-header {
    display: table-cell;
    height: var(--sui-secondary-row-height);
  }
</style>
