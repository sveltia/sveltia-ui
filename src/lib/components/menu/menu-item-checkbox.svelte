<!--
  @component
  A menu item widget with a checkbox.
  @see https://w3c.github.io/aria/#menuitemcheckbox
-->
<script>
  import Icon from '../icon/icon.svelte';
  import MenuItem from './menu-item.svelte';

  /**
   * @type {import('$lib/typedefs').ButtonProps & import('$lib/typedefs').MenuItemProps &
   * import('$lib/typedefs').CommonEventHandlers & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    checked = $bindable(false),
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
  role="menuitemcheckbox"
  class="sui menu-item-checkbox {className}"
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
