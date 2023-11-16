<!--
  @component
  The interactive version of `<TableColHeader>`.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th
  @see https://w3c.github.io/aria/#columnheader
-->
<script>
  /**
   * The `class` attribute on the wrapper element.
   * @type {string}
   */
  let className = '';
  export { className as class };
</script>

<div role="columnheader" class="sui grid-col-header {className}" {...$$restProps}>
  <slot />
</div>

<style lang="scss">
  .grid-col-header {
    display: table-cell;
  }
</style>
