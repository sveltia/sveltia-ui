<script>
  import { Button, Drawer } from '$lib';
  import Example from '../../_components/example.svelte';

  const openStandardDrawer = $state({ top: false, right: false, bottom: false, left: false });
  const openSwipeDismissDrawer = $state({ top: false, right: false, bottom: false, left: false });
  const positions = /** @type {const} */ (['bottom', 'top', 'right', 'left']);
</script>

<svelte:head>
  <title>Drawer – Sveltia UI</title>
</svelte:head>

<h2>Drawer</h2>

<section>
  <h3>Position</h3>
  <Example>
    <div role="none">
      <Button
        variant="secondary"
        label="Show Drawer: right"
        onclick={() => {
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
        onclick={() => {
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
        onclick={() => {
          openStandardDrawer.top = true;
        }}
      />
      <Drawer bind:open={openStandardDrawer.top} title="Drawer" position="top">Hello World!</Drawer>
    </div>
    <div role="none">
      <Button
        variant="secondary"
        label="Show Drawer: bottom"
        onclick={() => {
          openStandardDrawer.bottom = true;
        }}
      />
      <Drawer bind:open={openStandardDrawer.bottom} title="Drawer" position="bottom">
        Hello World!
      </Drawer>
    </div>
  </Example>
</section>

<section>
  <h3>Swipe to Dismiss</h3>
  <Example>
    {#each positions as position (position)}
      <div role="none">
        <Button
          variant="secondary"
          label="Show Drawer with Swipe to Dismiss: {position}"
          onclick={() => {
            openSwipeDismissDrawer[position] = true;
          }}
        />
        <Drawer
          bind:open={openSwipeDismissDrawer[position]}
          title="Drawer"
          {position}
          size="medium"
          swipeDismiss
        >
          Drag the {position === 'top' || position === 'bottom' ? 'handle or the ' : ''}header
          towards the edge to dismiss the drawer.
        </Drawer>
      </div>
    {/each}
  </Example>
</section>
