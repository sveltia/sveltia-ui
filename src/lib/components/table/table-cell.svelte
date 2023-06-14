<!--
  @component
  The equivalent of the HTML `<td>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td
  @see https://w3c.github.io/aria/#gridcell
-->
<script>
  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };
</script>

<div role="gridcell" class="sui table-cell {className}" {...$$restProps}>
  <slot />
</div>

<style lang="scss">
  .table-cell {
    display: table-cell;
  }
</style>
