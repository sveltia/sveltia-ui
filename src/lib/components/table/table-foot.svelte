<!--
  @component
  The equivalent of the HTML `<tfoot>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tfoot
  @see https://w3c.github.io/aria/#rowgroup
-->
<script>
  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };
</script>

<div role="rowgroup" class="sui table-foot {className}" {...$$restProps}>
  <slot />
</div>

<style lang="scss">
  .table-foot {
    display: table-footer-group;
  }
</style>
