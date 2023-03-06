<!--
  @component
  @see https://w3c.github.io/aria/#tabpanel
  @see https://w3c.github.io/aria-practices/#tabpanel
-->
<script>
  /**
   * CSS class name on the button.
   * @type {String}
   */
  // eslint-disable-next-line padding-line-between-statements
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
