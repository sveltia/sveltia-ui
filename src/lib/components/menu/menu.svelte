<!--
  @component
  A menu widget.
  @see https://w3c.github.io/aria/#menu
  @see https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
-->
<script>
  import { activateGroup } from '../../services/group.svelte.js';

  /**
   * @import { ContainerProps, WidgetStateProps } from '#lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {string} [ariaLabel] The `aria-label` attribute on the wrapper element.
   * @property {(event: CustomEvent) => void} [onChange] Custom `Change` event handler.
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
  aria-label={ariaLabel}
  onChange={(/** @type {CustomEvent} */ event) => {
    onChange?.(event);
  }}
  {@attach activateGroup()}
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
    border-color: var(--sui-menu-border-color, var(--sui-secondary-border-color));
    border-radius: var(--sui-menu-border-radius, 4px);
    padding: var(--sui-menu-padding, 4px);

    :global {
      [role='separator'] {
        margin: var(--sui-menu-divider-margin, 4px);
        width: auto;
        background-color: var(--sui-menu-divider-color, var(--sui-control-border-color));
      }
    }
  }
</style>
