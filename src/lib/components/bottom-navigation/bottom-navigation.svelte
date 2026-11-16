<script>
  /**
   * @import { ContainerProps, WidgetStateProps } from '#lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {string} [title] Text label displayed above the group items.
   */

  /**
   * @type {ContainerProps & WidgetStateProps & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    children,
    ...rest
    /* eslint-enable prefer-const */
  } = $props();
</script>

<div role="none" class="sui bottom-navigation {className}" {...rest}>
  {@render children?.()}
</div>

<style lang="scss">
  .bottom-navigation {
    height: var(--sui-bottom-navigation-height, var(--sui-primary-toolbar-size));
    border-top-width: var(--sui-bottom-navigation-border-width, 1px);
    border-top-style: var(--sui-bottom-navigation-border-style, solid);
    border-top-color: var(--sui-bottom-navigation-border-color, var(--sui-secondary-border-color));

    &:is([inert], [hidden]) {
      display: none;
    }

    :global {
      .buttons {
        flex: auto;
        display: flex;
        align-items: center;
        justify-content: space-evenly;
      }
    }
  }
</style>
