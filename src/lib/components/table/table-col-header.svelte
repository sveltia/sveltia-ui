<!--
  @component
  The equivalent of the HTML `<th scope="col">` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th
  @see https://w3c.github.io/aria/#columnheader
-->
<script>
  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };
</script>

<div role="columnheader" class="sui table-col-header {className}" {...$$restProps}>
  <slot />
</div>

<style lang="scss">
  .table-col-header {
    display: table-cell;
  }
</style>
