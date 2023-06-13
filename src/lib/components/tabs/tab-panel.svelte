<!--
  @component
  A tab content panel.
  @see https://w3c.github.io/aria/#tabpanel
  @see https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
-->
<script>
  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };
</script>

<div class="sui tabpanel {className}" role="tabpanel" {...$$restProps}>
  <slot />
</div>

<style lang="scss">
  .tabpanel {
    &[aria-hidden='true'],
    &:not([aria-hidden]) {
      display: none;
    }
  }
</style>
