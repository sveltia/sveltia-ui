<!--
  @component
  Test fixture: a `<MenuButton>` opening a `<Menu>` with various items, including a submenu.
-->
<script>
  import MenuButton from './menu-button.svelte';
  import MenuItemCheckbox from './menu-item-checkbox.svelte';
  import MenuItemRadio from './menu-item-radio.svelte';
  import MenuItem from './menu-item.svelte';
  import Menu from './menu.svelte';

  /**
   * @type {{
   * checked?: boolean,
   * onItemClick?: (event: MouseEvent) => void,
   * onMenuChange?: (event: CustomEvent) => void,
   * }}
   */
  let {
    /* eslint-disable prefer-const */
    checked = $bindable(false),
    onItemClick = undefined,
    onMenuChange = undefined,
    /* eslint-enable prefer-const */
  } = $props();
</script>

<MenuButton label="Actions">
  {#snippet popup()}
    <Menu ariaLabel="Actions" onChange={onMenuChange}>
      <MenuItem label="Rename" onclick={onItemClick} />
      <MenuItem label="Share">
        {#snippet items()}
          <MenuItem label="Copy Link" />
          <MenuItem label="Email" />
        {/snippet}
      </MenuItem>
      <MenuItemCheckbox label="Pinned" bind:checked />
      <MenuItemRadio label="Ascending" checked={true} />
      <MenuItemRadio label="Descending" />
    </Menu>
  {/snippet}
</MenuButton>
