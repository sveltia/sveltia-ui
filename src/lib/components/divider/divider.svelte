<!--
  @component
  A content divider with a visible vertical/horizontal line.
  @see https://w3c.github.io/aria/#separator
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
   * Orientation of the widget. An alias of the `aria-orientation` attribute.
   * @type {'horizontal' | 'vertical'}
   */
  export let orientation = 'horizontal';
</script>

<div
  role="separator"
  class="sui divider {className}"
  hidden={hidden || undefined}
  aria-hidden={hidden}
  aria-orientation={orientation}
  {...$$restProps}
></div>

<style lang="scss">
  .divider {
    flex: none;
    background-color: var(--sui-secondary-border-color);

    &[aria-orientation='horizontal'] {
      margin: 8px 0;
      width: 100%;
      height: 1px;
    }

    &[aria-orientation='vertical'] {
      margin: 0 8px;
      width: 1px;
      height: 100%;
    }
  }
</style>
