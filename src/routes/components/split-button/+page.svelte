<script>
  import { SplitButton } from '$lib';
  import MenuItem from '$lib/components/menu/menu-item.svelte';
  import Menu from '$lib/components/menu/menu.svelte';
  import Example from '../../_components/example.svelte';
</script>

<h2>Split Button</h2>

<section>
  <h3>Default</h3>
  <Example>
    <div role="none">
      <SplitButton variant="primary" label="Paste">
        {#snippet popup()}
          <Menu>
            <MenuItem label="Keep Source Formatting" />
            <MenuItem label="Match Formatting" />
            <MenuItem label="Keep Text Only" disabled />
          </Menu>
        {/snippet}
      </SplitButton>
      <SplitButton variant="secondary" label="Paste">
        {#snippet popup()}
          <Menu>
            <MenuItem label="Keep Source Formatting" />
            <MenuItem label="Match Formatting" />
            <MenuItem label="Keep Text Only" disabled />
          </Menu>
        {/snippet}
      </SplitButton>
      <SplitButton variant="tertiary" label="Paste">
        {#snippet popup()}
          <Menu>
            <MenuItem label="Keep Source Formatting" />
            <MenuItem label="Match Formatting" />
            <MenuItem label="Keep Text Only" disabled />
          </Menu>
        {/snippet}
      </SplitButton>
      <SplitButton variant="ghost" label="Paste">
        {#snippet popup()}
          <Menu>
            <MenuItem label="Keep Source Formatting" />
            <MenuItem label="Match Formatting" />
            <MenuItem label="Keep Text Only" disabled />
          </Menu>
        {/snippet}
      </SplitButton>
    </div>
  </Example>
</section>

<section>
  <h3>Position</h3>
  <Example>
    <div role="none">
      <SplitButton variant="primary" label="Paste" popupPosition="bottom-right">
        {#snippet popup()}
          <Menu>
            <MenuItem label="Keep Source Formatting" />
            <MenuItem label="Match Formatting" />
            <MenuItem label="Keep Text Only" disabled />
          </Menu>
        {/snippet}
      </SplitButton>
      <SplitButton variant="secondary" label="Paste" popupPosition="bottom-right">
        {#snippet popup()}
          <Menu>
            <MenuItem label="Keep Source Formatting" />
            <MenuItem label="Match Formatting" />
            <MenuItem label="Keep Text Only" disabled />
          </Menu>
        {/snippet}
      </SplitButton>
      <SplitButton variant="tertiary" label="Paste" popupPosition="bottom-right">
        {#snippet popup()}
          <Menu>
            <MenuItem label="Keep Source Formatting" />
            <MenuItem label="Match Formatting" />
            <MenuItem label="Keep Text Only" disabled />
          </Menu>
        {/snippet}
      </SplitButton>
      <SplitButton variant="ghost" label="Paste" popupPosition="bottom-right">
        {#snippet popup()}
          <Menu>
            <MenuItem label="Keep Source Formatting" />
            <MenuItem label="Match Formatting" />
            <MenuItem label="Keep Text Only" disabled />
          </Menu>
        {/snippet}
      </SplitButton>
    </div>
  </Example>
</section>

<section>
  <h3>Disabled</h3>
  <Example>
    <div role="none">
      <SplitButton variant="primary" label="Paste" disabled>
        {#snippet popup()}
          <Menu>
            <MenuItem label="Keep Source Formatting" />
            <MenuItem label="Match Formatting" />
            <MenuItem label="Keep Text Only" disabled />
          </Menu>
        {/snippet}
      </SplitButton>
      <SplitButton variant="secondary" label="Paste" disabled>
        {#snippet popup()}
          <Menu>
            <MenuItem label="Keep Source Formatting" />
            <MenuItem label="Match Formatting" />
            <MenuItem label="Keep Text Only" disabled />
          </Menu>
        {/snippet}
      </SplitButton>
      <SplitButton variant="tertiary" label="Paste" disabled>
        {#snippet popup()}
          <Menu>
            <MenuItem label="Keep Source Formatting" />
            <MenuItem label="Match Formatting" />
            <MenuItem label="Keep Text Only" disabled />
          </Menu>
        {/snippet}
      </SplitButton>
      <SplitButton variant="ghost" label="Paste" disabled>
        {#snippet popup()}
          <Menu>
            <MenuItem label="Keep Source Formatting" />
            <MenuItem label="Match Formatting" />
            <MenuItem label="Keep Text Only" disabled />
          </Menu>
        {/snippet}
      </SplitButton>
    </div>
  </Example>
</section>
