<!--
  @component
  The interactive version of `<TableRowHeader>`.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th
  @see https://w3c.github.io/aria/#rowheader
-->
<script>
  /**
   * The `class` attribute on the wrapper element.
   * @type {string}
   */
  let className = '';
  export { className as class };
</script>

<div role="rowheader" class="sui grid-row-header {className}" {...$$restProps}>
  <slot />
</div>

<style lang="scss">
  .grid-row-header {
    display: table-cell;
    height: var(--sui-secondary-row-height);
  }
</style>
