<script>
  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {string} [ariaLabel] The `aria-label` attribute on the wrapper element.
   * @property {Snippet} [children] Primary slot content.
   */

  /**
   * @type {Props & Record<string, any>}
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
