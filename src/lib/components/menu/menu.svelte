<!--
  @component
  A menu widget.
  @see https://w3c.github.io/aria/#menu
  @see https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
-->
<script>
  import { createEventDispatcher } from 'svelte';
  import { activateGroup } from '../../services/group';

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

  const dispatch = createEventDispatcher();
</script>

<div
  role="menu"
  class="sui menu {className}"
  hidden={hidden || undefined}
  aria-hidden={hidden}
  aria-disabled={disabled}
  {...$$restProps}
  use:activateGroup
  on:change={(/** @type {CustomEvent} */ event) => {
    dispatch('change', event.detail);
  }}
>
  <slot />
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
