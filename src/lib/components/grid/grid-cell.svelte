<!--
  @component
  The interactive version of `<TableCell>`.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td
  @see https://w3c.github.io/aria/#gridcell
-->
<script>
  /**
   * The `class` attribute on the wrapper element.
   * @type {string}
   */
  let className = '';
  export { className as class };
</script>

<div role="gridcell" class="sui grid-cell {className}" {...$$restProps}>
  <slot />
</div>

<style lang="scss">
  .grid-cell {
    display: table-cell;
  }
</style>
