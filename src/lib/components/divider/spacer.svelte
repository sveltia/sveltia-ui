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
   * Whether to hide the widget. An alias of the `aria-hidden` attribute.
   * @type {boolean | undefined}
   */
  export let hidden = undefined;
  /**
   * Whether to make the spacer flexible.
   * @type {boolean}
   */
  export let flex = false;
</script>

<div class="sui spacer {className}" class:flex {hidden} aria-hidden={hidden} {...$$restProps} />

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
