<!--
  @component
  The equivalent of the HTML `<tbody>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody
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

<div role="rowgroup" class="sui table-body {className}" {...$$restProps}>
  <slot />
</div>

<style lang="scss">
  .table-body {
    display: table-row-group;
  }
</style>
