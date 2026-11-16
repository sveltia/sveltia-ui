<!--
  @component
  A generic group layout.
  @see https://w3c.github.io/aria/#group
-->
<script>
  /**
   * @import { ContainerProps, WidgetStateProps } from '#lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {string} [ariaLabel] The `aria-label` attribute on the wrapper element.
   */

  /**
   * @type {ContainerProps & WidgetStateProps & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    hidden = false,
    disabled = false,
    ariaLabel = undefined,
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<div
  {...restProps}
  role="group"
  class="sui group {className}"
  {hidden}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-label={ariaLabel}
>
  <div role="none" class="inner" inert={disabled}>
    {@render children?.()}
  </div>
</div>

<style lang="scss">
  .inner {
    display: contents;
  }
</style>
