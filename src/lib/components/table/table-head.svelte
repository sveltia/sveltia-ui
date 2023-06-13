<!--
  @component
  The equivalent of the HTML `<thead>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/thead
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

<div role="rowgroup" class="sui table-head {className}" {...$$restProps}>
  <slot />
</div>
