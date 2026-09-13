<!--
  @component
  Test fixture: a dialog declared within a menu, and opened from one of its items. The menu closes
  as the item is activated, so the dialog has to be kept alive by the modal it was rendered within.
-->
<script>
  import Dialog from '../dialog/dialog.svelte';
  import MenuButton from '../menu/menu-button.svelte';
  import MenuItem from '../menu/menu-item.svelte';
  import Menu from '../menu/menu.svelte';

  let open = $state(false);
</script>

<MenuButton label="Actions">
  {#snippet popup()}
    <Menu>
      <MenuItem
        label="Delete"
        onclick={() => {
          open = true;
        }}
      />
      <Dialog bind:open title="Delete?">Really?</Dialog>
    </Menu>
  {/snippet}
</MenuButton>
