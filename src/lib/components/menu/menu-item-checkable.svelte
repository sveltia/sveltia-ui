<!--
  @component
  The checkable menu item behind `<MenuItemCheckbox>` and `<MenuItemRadio>`, which only differ in
  their role. Internal; not exported.
  @see https://w3c.github.io/aria/#menuitemcheckbox
  @see https://w3c.github.io/aria/#menuitemradio
-->
<script>
  import Icon from '../icon/icon.svelte';
  import MenuItem from './menu-item.svelte';

  /**
   * @import { ButtonProps, CommonEventHandlers, MenuItemProps } from '#lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {'menuitemcheckbox' | 'menuitemradio'} role The `role` attribute on the item.
   */

  /**
   * @type {ButtonProps & MenuItemProps & CommonEventHandlers & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    role,
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

  /**
   * The class name for the role, e.g. `menu-item-checkbox`.
   */
  const roleClass = $derived(role === 'menuitemradio' ? 'menu-item-radio' : 'menu-item-checkbox');
</script>

<MenuItem
  {...restProps}
  {role}
  class="sui {roleClass} {className}"
  {label}
  {hidden}
  {disabled}
  aria-checked={checked}
  onChange={(event) => {
    // Update the state first, so the handler sees the new value through a bound `checked`
    checked = event.detail.checked;
    onChange?.(event);
  }}
>
  {#snippet startIcon()}
    {@render _startIcon?.()}
  {/snippet}
  <!-- eslint-disable-next-line svelte/no-useless-children-snippet -->
  {#snippet children()}
    {@render _children?.()}
  {/snippet}
  {#snippet endIcon()}
    {#if checked}
      <Icon name="check" />
    {/if}
  {/snippet}
</MenuItem>
