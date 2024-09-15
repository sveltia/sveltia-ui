<!--
  @component
  The equivalent of the HTML `<table>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table
  @see https://w3c.github.io/aria/#table
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

<div {...restProps} role="table" class="sui table {className}">
  {@render children?.()}
</div>

<style lang="scss">
  .table {
    display: table;
    margin: var(--sui-focus-ring-width);
    width: calc(100% - var(--sui-focus-ring-width) * 2);

    &:global(.data) {
      border-collapse: collapse;

      :global(.table-col-header),
      :global(.table-row-header),
      :global(.table-cell) {
        border: 1px solid var(--sui-secondary-border-color);
        padding: 8px 8px;
      }
    }
  }
</style>
