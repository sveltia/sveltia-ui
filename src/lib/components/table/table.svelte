<!--
  @component
  The equivalent of the HTML `<table>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table
  @see https://w3c.github.io/aria/#table
-->
<script>
  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {string} [ariaLabel] The `aria-label` attribute on the wrapper element.
   * @property {Snippet} [children] Primary slot content.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    ariaLabel = undefined,
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<div {...restProps} role="table" class="sui table {className}" aria-label={ariaLabel}>
  {@render children?.()}
</div>

<style lang="scss">
  @use '../../styles/mixins';

  .table {
    @include mixins.table(table);
  }
</style>
