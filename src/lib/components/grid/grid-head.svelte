<!--
  @component
  The interactive version of `<TableThead>`.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/thead
  @see https://w3c.github.io/aria/#rowgroup
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

<div
  {...restProps}
  role="rowgroup"
  class="sui grid-head {className}"
  aria-roledescription="grid head"
>
  {@render children?.()}
</div>

<style lang="scss">
  .grid-head {
    display: table-header-group;
  }
</style>
