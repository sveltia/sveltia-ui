<!--
  @component
  The equivalent of the HTML `<table>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table
  @see https://w3c.github.io/aria/#table
-->
<script>
  /**
   * The `class` attribute on the wrapper element.
   * @type {string}
   */
  let className = '';
  export { className as class };
</script>

<div role="table" class="sui table {className}" {...$$restProps}>
  <slot />
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
