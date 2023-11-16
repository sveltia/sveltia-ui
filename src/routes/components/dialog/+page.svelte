<script>
  import { Button, Dialog } from '$lib';
  import Example from '../../_components/example.svelte';

  let openStandardDialog = false;
</script>

<h2>Dialog</h2>

<section>
  <h3>Standard</h3>
  <Example>
    <div role="none">
      <Button
        variant="secondary"
        label="Show Dialog"
        on:click={() => {
          openStandardDialog = true;
        }}
      />
      <Dialog bind:open={openStandardDialog} title="Standard Dialog">Hello</Dialog>
    </div>
  </Example>
</section>

<section>
  <h3>Alert</h3>
</section>

<section>
  <h3>Confirm</h3>
</section>

<section>
  <h3>Prompt</h3>
</section>
