<!--
  @component
  The interactive version of `<TableBody>`.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody
  @see https://w3c.github.io/aria/#rowgroup
-->
<script>
  /**
   * The `class` attribute on the wrapper element.
   * @type {string}
   */
  let className = '';
  export { className as class };
</script>

<div
  role="rowgroup"
  class="sui grid-body {className}"
  aria-roledescription="grid body"
  {...$$restProps}
>
  <slot />
</div>

<style lang="scss">
  .grid-body {
    display: table-row-group;
  }
</style>
