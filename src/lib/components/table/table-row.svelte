<!--
  @component
  The equivalent of the HTML `<tr>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr
  @see https://w3c.github.io/aria/#row
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

<div {...restProps} role="row" class="sui table-row {className}">
  {@render children?.()}
</div>

<style lang="scss">
  .table-row {
    display: table-row;
    height: var(--sui-primary-row-height);
  }
</style>
