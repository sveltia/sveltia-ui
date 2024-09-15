<script>
  import { Button, Dialog } from '$lib';
  import AlertDialog from '$lib/components/dialog/alert-dialog.svelte';
  import ConfirmationDialog from '$lib/components/dialog/confirmation-dialog.svelte';
  import PromptDialog from '$lib/components/dialog/prompt-dialog.svelte';
  import Example from '../../_components/example.svelte';

  let openStandardDialog = $state(false);
  let openAlertDialog = $state(false);
  let openConfirmationDialog = $state(false);
  let openPromptDialog = $state(false);
  let openSmallDialog = $state(false);
  let openMediumDialog = $state(false);
  let openLargeDialog = $state(false);
  let openExtraLargeDialog = $state(false);
  let promptValue = $state('');
</script>

<h2>Dialog</h2>

<section>
  <h3>Variant</h3>
  <Example>
    <div role="none">
      <Button
        variant="secondary"
        label="Show Standard Dialog"
        onclick={() => {
          openStandardDialog = true;
        }}
      />
      <Dialog bind:open={openStandardDialog} title="Greeting">Hello World!</Dialog>
    </div>
    <div role="none">
      <Button
        variant="secondary"
        label="Show Alert Dialog"
        onclick={() => {
          openAlertDialog = true;
        }}
      />
      <AlertDialog bind:open={openAlertDialog} title="Error">
        There was error while saving the entry. Please try again later.
      </AlertDialog>
    </div>
    <div role="none">
      <Button
        variant="secondary"
        label="Show Confirmation Dialog"
        onclick={() => {
          openConfirmationDialog = true;
        }}
      />
      <ConfirmationDialog bind:open={openConfirmationDialog} title="Delete Files">
        Are you sure to delete selected files? This cannot be undone.
      </ConfirmationDialog>
    </div>
    <div role="none">
      <Button
        variant="secondary"
        label="Show Prompt Dialog"
        onclick={() => {
          openPromptDialog = true;
        }}
      />
      <p>Entered value is {promptValue}</p>
      <PromptDialog
        bind:open={openPromptDialog}
        title="API Key"
        bind:value={promptValue}
        textboxAttrs={{ spellcheck: false, 'aria-label': 'API Key' }}
      >
        Enter your API key to use this functionality.
      </PromptDialog>
    </div>
  </Example>
</section>

<section>
  <h3>Size</h3>
  <Example>
    <div role="none">
      <Button
        variant="secondary"
        label="Show Small Dialog"
        onclick={() => {
          openSmallDialog = true;
        }}
      />
      <Dialog bind:open={openSmallDialog} title="Greeting" size="small">Hello World!</Dialog>
    </div>
    <div role="none">
      <Button
        variant="secondary"
        label="Show Medium Dialog"
        onclick={() => {
          openMediumDialog = true;
        }}
      />
      <Dialog bind:open={openMediumDialog} title="Greeting" size="medium">Hello World!</Dialog>
    </div>
    <div role="none">
      <Button
        variant="secondary"
        label="Show Large Dialog"
        onclick={() => {
          openLargeDialog = true;
        }}
      />
      <Dialog bind:open={openLargeDialog} title="Greeting" size="large">Hello World!</Dialog>
    </div>
    <div role="none">
      <Button
        variant="secondary"
        label="Show Extra Large Dialog"
        onclick={() => {
          openExtraLargeDialog = true;
        }}
      />
      <Dialog bind:open={openExtraLargeDialog} title="Greeting" size="x-large">Hello World!</Dialog>
    </div>
  </Example>
</section>
