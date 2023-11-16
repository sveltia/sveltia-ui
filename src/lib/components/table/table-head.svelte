<!--
  @component
  The equivalent of the HTML `<thead>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/thead
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
  class="sui table-head {className}"
  aria-roledescription="table head"
  {...$$restProps}
>
  <slot />
</div>

<style lang="scss">
  .table-head {
    display: table-header-group;
  }
</style>
