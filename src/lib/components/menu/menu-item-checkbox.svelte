<!--
  @component
  A menu item widget with a checkbox.
  @see https://w3c.github.io/aria/#menuitemcheckbox
-->
<script>
  import MenuItemCheckable from './menu-item-checkable.svelte';

  /**
   * @import { ButtonProps, CommonEventHandlers, MenuItemProps } from '$lib/typedefs';
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

<MenuItemCheckable {...restProps} bind:checked role="menuitemcheckbox" />
