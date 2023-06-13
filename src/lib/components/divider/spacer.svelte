<!--
  @component
  A content divider with no line. It can be flexible.
-->
<script>
  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };

  /** @type {boolean} */
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
