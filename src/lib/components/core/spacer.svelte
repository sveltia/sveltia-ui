<script>
  /**
   * CSS class name on the button.
   * @type {String}
   */
  let className = '';

  export { className as class };

  /** @type {Boolean} */
  export let flex = false;
</script>

<div class="sui spacer {className}" class:flex />

<style lang="scss">
  .spacer {
    &.flex {
      flex: auto;
    }

    &:not(.flex) {
      width: 8px;
      height: 8px;
    }
  }
</style>
