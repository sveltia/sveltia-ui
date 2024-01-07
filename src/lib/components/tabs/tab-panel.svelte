<!--
  @component
  A tab content panel.
  @see https://w3c.github.io/aria/#tabpanel
  @see https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
-->
<script>
  /**
   * The `class` attribute on the wrapper element.
   * @type {string}
   */
  let className = '';
  export { className as class };
</script>

<div role="tabpanel" class="sui tab-panel {className}" {...$$restProps}>
  <slot />
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
