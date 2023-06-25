<!--
  @component
  A content divider with a visible vertical/horizontal line.
  @see https://w3c.github.io/aria/#separator
-->
<script>
  /** @type {('horizontal' | 'vertical')} */
  export let orientation = 'horizontal';

  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };
</script>

<div
  role="separator"
  class="sui divider {className}"
  aria-orientation={orientation}
  {...$$restProps}
/>

<style lang="scss">
  .divider {
    flex: none;
    background-color: var(--secondary-border-color);

    &[aria-orientation='horizontal'] {
      height: 1px;
    }

    &[aria-orientation='vertical'] {
      width: 1px;
    }
  }
</style>
