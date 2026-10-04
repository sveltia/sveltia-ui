<!--
  @component
  A menu item widget with a radio. Only one item can be selected within the parent `<Menu>` or
  `<MenuItemGroup>` component.
  @see https://w3c.github.io/aria/#menuitemradio
-->
<script>
  import MenuItemCheckable from './menu-item-checkable.svelte';

  /**
   * @import { ButtonProps, CommonEventHandlers, MenuItemProps } from '#lib/typedefs.js';
   */

  /**
   * @type {ButtonProps & MenuItemProps & CommonEventHandlers & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    checked = $bindable(),
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<MenuItemCheckable {...restProps} bind:checked role="menuitemradio" />
