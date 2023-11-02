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
  class="sui divider {className}"
  role="separator"
  hidden={hidden || undefined}
  aria-hidden={hidden}
  aria-orientation={orientation}
  {...$$restProps}
/>

<style lang="scss">
  .divider {
    flex: none;
    background-color: var(--sui-secondary-border-color);

    &[aria-orientation='horizontal'] {
      height: 1px;
    }

    &[aria-orientation='vertical'] {
      width: 1px;
    }
  }
</style>
