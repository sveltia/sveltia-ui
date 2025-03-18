<!--
  @component
  The equivalent of the HTML `<tfoot>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tfoot
  @see https://w3c.github.io/aria/#rowgroup
-->
<script>
  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {Snippet} [children] Primary slot content.
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
  class="sui table-foot {className}"
  aria-roledescription="table foot"
>
  {@render children?.()}
</div>

<style lang="scss">
  .table-foot {
    display: table-footer-group;
  }
</style>
