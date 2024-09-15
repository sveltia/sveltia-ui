<!--
  @component
  The equivalent of the HTML `<th scope="col">` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th
  @see https://w3c.github.io/aria/#columnheader
-->
<script>
  /**
   * @typedef {object} Props
   * @property {string} [class] - The `class` attribute on the wrapper element.
   * @property {import('svelte').Snippet} [children] - Primary slot content.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<div {...restProps} role="columnheader" class="sui table-col-header {className}">
  {@render children?.()}
</div>

<style lang="scss">
  .table-col-header {
    display: table-cell;
  }
</style>
