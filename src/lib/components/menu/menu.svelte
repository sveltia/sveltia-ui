<!--
  @component
  A menu widget.
  @see https://w3c.github.io/aria/#menu
  @see https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
-->
<script>
  import { activateGroup } from '../../services/group.svelte';

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
   * @property {Snippet} [children] Primary slot content.
   * @property {(event: CustomEvent) => void} [onChange] Custom `Change` event handler.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    hidden = false,
    disabled = false,
    children,
    onChange,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<div
  {...restProps}
  role="menu"
  class="sui menu {className}"
  {hidden}
  aria-hidden={hidden}
  aria-disabled={disabled}
  onChange={(/** @type {CustomEvent} */ event) => {
    onChange?.(event);
  }}
  use:activateGroup
>
  {@render children?.()}
</div>

<style lang="scss">
  .menu {
    display: flex;
    flex-direction: column;
    margin: 0;
    border-width: var(--sui-menu-border-width, 1px);
    border-style: var(--sui-menu-border-style, solid);
    border-color: var(--sui-menu-border-width, var(--sui-secondary-border-color));
    border-radius: var(--sui-menu-border-radius, 4px);
    padding: var(--sui-menu-padding, 4px);

    :global([role='separator']) {
      margin: var(--sui-menu-divider-margin, 4px);
      background-color: var(--sui-menu-divider-color, var(--sui-control-border-color));
    }
  }
</style>
