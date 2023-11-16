<script>
  import { Button, Drawer } from '$lib';
  import Example from '../../_components/example.svelte';

  const openStandardDrawer = { top: false, right: false, bottom: false, left: false };
</script>

<h2>Drawer</h2>

<section>
  <h3>Position</h3>
  <Example>
    <div role="none">
      <Button
        variant="secondary"
        label="Show Drawer: right"
        on:click={() => {
          openStandardDrawer.right = true;
        }}
      />
      <Drawer bind:open={openStandardDrawer.right} title="Drawer" position="right">
        Hello World!
      </Drawer>
    </div>
    <div role="none">
      <Button
        variant="secondary"
        label="Show Drawer: left"
        on:click={() => {
          openStandardDrawer.left = true;
        }}
      />
      <Drawer bind:open={openStandardDrawer.left} title="Drawer" position="left"
        >Hello World!</Drawer
      >
    </div>
    <div role="none">
      <Button
        variant="secondary"
        label="Show Drawer: top"
        on:click={() => {
          openStandardDrawer.top = true;
        }}
      />
      <Drawer bind:open={openStandardDrawer.top} title="Drawer" position="top">Hello World!</Drawer>
    </div>
    <div role="none">
      <Button
        variant="secondary"
        label="Show Drawer: bottom"
        on:click={() => {
          openStandardDrawer.bottom = true;
        }}
      />
      <Drawer bind:open={openStandardDrawer.bottom} title="Drawer" position="bottom">
        Hello World!
      </Drawer>
    </div>
  </Example>
</section>
