<script>
  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {Snippet} [children] Primary slot content.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<div {...restProps} role="group" class="sui button-group {className}">
  {@render children?.()}
</div>

<style lang="scss">
  .button-group {
    flex: none;
    display: inline-flex;
    align-items: center;
  }
</style>
