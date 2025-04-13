<script>
  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {boolean} [hidden] Whether to hide the widget. An alias of the `aria-hidden`
   * attribute.
   * @property {boolean} [disabled] Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {string} [title] Text label displayed above the group items.
   * @property {Snippet} [children] Primary slot content.
   */

  /**
   * @type {Props & Record<string, any>}
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
    border-top-width: var(--sui-bottom-navigation-border-color, 1px);
    border-top-style: var(--sui-bottom-navigation-border-style, solid);
    border-top-color: var(--sui-bottom-navigation-border-color, var(--sui-secondary-border-color));

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
