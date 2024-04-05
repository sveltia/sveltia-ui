<script>
  /**
   * The `class` attribute on the wrapper element.
   * @type {string}
   */
  let className = '';
  export { className as class };
</script>

<div role="group" class="sui button-group {className}" {...$$restProps}>
  <slot />
</div>

<style lang="scss">
  .button-group {
    display: inline-flex;
    align-items: center;
  }
</style>
