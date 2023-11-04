<!--
  @component
  The equivalent of the HTML `<th scope="row">` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th
  @see https://w3c.github.io/aria/#rowheader
-->
<script>
  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };
</script>

<div role="rowheader" class="sui table-row-header {className}" {...$$restProps}>
  <slot />
</div>

<style lang="scss">
  .table-row-header {
    display: table-cell;
    height: var(--sui-secondary-row-height);
  }
</style>
