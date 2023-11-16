<!--
  @component
  A content divider with no line. It can be flexible.
-->
<script>
  /**
   * CSS class name on the wrapper element.
   * @type {string}
   */
  let className = '';
  export { className as class };
  /**
   * Whether to make the spacer flexible.
   * @type {boolean}
   */
  export let flex = false;
</script>

<div role="none" class="sui spacer {className}" class:flex {...$$restProps} />

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
