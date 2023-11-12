<script>
  import { Divider, Icon, Menu, MenuButton, MenuItem, MenuItemCheckbox, MenuItemRadio } from '$lib';
  import Example from '../../_components/example.svelte';
</script>

<h2>Menu</h2>

<section>
  <h3>Menu Button</h3>
  <Example>
    <div>
      <MenuButton variant="tertiary" label="Open Menu">
        <Icon slot="end-icon" name="arrow_drop_down" />
        <Menu slot="popup">
          <MenuItem label="Item" />
          <MenuItem label="Item" disabled />
          <Divider />
          <MenuItemCheckbox label="Item" checked />
          <MenuItemCheckbox label="Item" checked={false} />
          <Divider />
          <MenuItemRadio label="Item" checked />
          <MenuItemRadio label="Item" checked={false} />
        </Menu>
      </MenuButton>
    </div>
  </Example>
</section>

<section>
  <h3>Menu Button with Nested Menu</h3>
  <Example>
    <div>
      <MenuButton variant="tertiary" label="Open Menu">
        <Icon slot="end-icon" name="arrow_drop_down" />
        <Menu slot="popup">
          <MenuItem label="Item" />
          <MenuItem label="Item">
            <MenuItem label="Child Item 1" />
            <MenuItem label="Child Item 2" />
            <MenuItem label="Child Item 3" />
            <Divider />
            <MenuItemCheckbox label="Child Item 4" checked />
          </MenuItem>
          <MenuItem label="Item" disabled />
          <Divider />
          <MenuItemCheckbox label="Item" checked />
          <MenuItemCheckbox label="Item" checked={false} />
          <Divider />
          <MenuItemRadio label="Item" checked />
          <MenuItemRadio label="Item" checked={false} />
        </Menu>
      </MenuButton>
    </div>
  </Example>
</section>

<section>
  <h3>Menu Bar</h3>
</section>

<section>
  <h3>With Groups</h3>
</section>

<section>
  <h3>Context Menu</h3>
</section>

<section>
  <h3>Contained Menu</h3>
</section>

<section>
  <h3>Disabled</h3>
  <Example>
    <div>
      <MenuButton variant="tertiary" label="Open Menu" disabled>
        <Icon slot="end-icon" name="arrow_drop_down" />
        <Menu slot="popup">
          <MenuItem label="Item" />
          <MenuItem label="Item" disabled />
          <Divider />
          <MenuItemCheckbox label="Item" checked />
          <MenuItemCheckbox label="Item" checked={false} />
          <Divider />
          <MenuItemRadio label="Item" checked />
          <MenuItemRadio label="Item" checked={false} />
        </Menu>
      </MenuButton>
    </div>
  </Example>
</section>
