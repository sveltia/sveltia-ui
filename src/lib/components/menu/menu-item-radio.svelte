<!--
  @component
  A menu item widget with a radio. Only one item can be selected within the parent `<Menu>` or
  `<MenuItemGroup>` component.
  @see https://w3c.github.io/aria/#menuitemradio
-->
<script>
  import Icon from '../icon/icon.svelte';
  import MenuItem from './menu-item.svelte';

  /**
   * @import { ButtonProps, CommonEventHandlers, MenuItemProps } from '$lib/typedefs';
   */

  /**
   * @type {ButtonProps & MenuItemProps & CommonEventHandlers & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    checked = $bindable(),
    class: className,
    hidden = false,
    disabled = false,
    label = '',
    children: _children,
    startIcon: _startIcon,
    onChange,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<MenuItem
  {...restProps}
  role="menuitemradio"
  class="sui menu-item-radio {className}"
  {label}
  {hidden}
  {disabled}
  aria-checked={checked}
  onChange={(event) => {
    onChange?.(event);
    checked = event.detail.checked;
  }}
>
  {#snippet startIcon()}
    {@render _startIcon?.()}
  {/snippet}
  {#snippet children()}
    {@render _children?.()}
  {/snippet}
  {#snippet endIcon()}
    {#if checked}
      <Icon name="check" />
    {/if}
  {/snippet}
</MenuItem>
