<!--
  @component
  The layout container of `<Checkbox>`es.
-->
<script>
  /**
   * @typedef {object} Props
   * @property {string} [class] - The `class` attribute on the wrapper element.
   * @property {boolean} [hidden] - Whether to hide the widget. An alias of the `aria-hidden`
   * attribute.
   * @property {boolean} [disabled] - Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {'horizontal'|'vertical'} [orientation] - Orientation of the widget.
   * @property {import('svelte').Snippet} [children] - Primary slot content.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    hidden = false,
    disabled = false,
    orientation = 'horizontal',
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<div
  {...restProps}
  role="group"
  class="sui checkbox-group {className} {orientation}"
  {hidden}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-roledescription="checkbox group"
>
  <div role="none" class="inner" inert={disabled}>
    {@render children?.()}
  </div>
</div>

<style lang="scss">
  .checkbox-group {
    display: inline-flex;

    &.horizontal {
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    &.vertical {
      gap: 4px;
      flex-direction: column;

      @media (pointer: coarse) {
        gap: 8px;
      }
    }
  }

  .inner {
    display: contents;
  }
</style>
