<!--
  @component
  The layout container of `<Checkbox>`es.
-->
<script>
  /**
   * The `class` attribute on the wrapper element.
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
   * Whether to disable the widget. An alias of the `aria-disabled` attribute.
   * @type {boolean}
   */
  export let disabled = false;
  /**
   * Orientation of the widget.
   * @type {('horizontal'|'vertical')}
   */
  export let orientation = 'horizontal';
</script>

<div
  class="sui checkbox-group {className} {orientation}"
  hidden={hidden || undefined}
  role="group"
  aria-hidden={hidden}
  aria-disabled={disabled}
  {...$$restProps}
>
  <div class="inner" inert={disabled}>
    <slot />
  </div>
</div>

<style lang="scss">
  .checkbox-group {
    display: inline-flex;

    &.horizontal {
      gap: 16px;
      align-items: center;
    }

    &.vertical {
      gap: 8px;
      flex-direction: column;
    }
  }

  .inner {
    display: contents;
  }
</style>
