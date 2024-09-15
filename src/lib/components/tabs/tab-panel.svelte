<!--
  @component
  A tab content panel.
  @see https://w3c.github.io/aria/#tabpanel
  @see https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
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

<div {...restProps} role="tabpanel" class="sui tab-panel {className}">
  {@render children?.()}
</div>

<style lang="scss">
  .tab-panel {
    flex: auto;
    transition: all 200ms;

    &[aria-hidden='true'],
    &:not([aria-hidden]) {
      display: none;
    }
  }
</style>
