<!--
  @component
  A content divider with a visible vertical/horizontal line.
  @see https://w3c.github.io/aria/#separator
-->
<script>
  /**
   * @typedef {object} Props
   * @property {string} [class] - The `class` attribute on the wrapper element.
   * @property {boolean} [hidden] - Whether to hide the widget. An alias of the `aria-hidden`
   * attribute.
   * @property {'horizontal'|'vertical'} [orientation] - Orientation of the widget. An alias of the
   * `aria-orientation` attribute.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    hidden = false,
    orientation = 'horizontal',
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<div
  {...restProps}
  role="separator"
  class="sui divider {className}"
  {hidden}
  aria-hidden={hidden}
  aria-orientation={orientation}
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
