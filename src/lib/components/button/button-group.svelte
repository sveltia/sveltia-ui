<script>
  /**
   * @import { ContainerProps } from '#lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {string} [ariaLabel] The `aria-label` attribute on the wrapper element.
   */

  /**
   * @type {ContainerProps & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    ariaLabel = undefined,
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<div {...restProps} role="group" class="sui button-group {className}" aria-label={ariaLabel}>
  {@render children?.()}
</div>

<style lang="scss">
  .button-group {
    flex: none;
    display: inline-flex;
    align-items: center;
  }
</style>
