<!--
  @component
  The equivalent of the HTML `<tr>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr
  @see https://w3c.github.io/aria/#row
-->
<script>
  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };
</script>

<div role="row" tabindex="0" class="sui table-row {className}" {...$$restProps} on:click>
  <slot />
</div>

<style lang="scss">
  .table-row {
    display: table-row;
  }
</style>
