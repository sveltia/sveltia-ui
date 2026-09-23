<script>
  import { Button, Dialog, Menu, MenuButton, MenuItem, Option, Select, Toast } from '$lib';
  import Alert from '$lib/components/alert/alert.svelte';
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
  let openCloseOnlyDialog = $state(false);
  let openMenuDialog = $state(false);
  let promptValue = $state('');
  let openToastDialog = $state(false);
  let openNestedToastDialog = $state(false);
  let showDialogToast = $state(false);
  let dialogToastMessage = $state('');
</script>

<svelte:head>
  <title>Dialog – Sveltia UI</title>
</svelte:head>

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
      <Dialog bind:open={openMediumDialog} title="Greeting" size="medium">
        Hello World!
        <!-- Resize the window vertically while this is open to verify the dropdown position is
        recalculated as the dialog re-centers. -->
        <Select>
          <Option label="Banana" />
          <Option label="Mango" />
          <Option label="Apple" />
        </Select>
      </Dialog>
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

<section>
  <h3>Close Button Only</h3>
  <Example>
    <div role="none">
      <Button
        variant="secondary"
        label="Show Close-Only Dialog"
        onclick={() => {
          openCloseOnlyDialog = true;
        }}
      />
      <!-- The dialog has neither an input field nor a primary button to focus, so the `<dialog>`
      element itself receives the focus when it opens. -->
      <Dialog
        bind:open={openCloseOnlyDialog}
        title="Keyboard Shortcuts"
        showClose={true}
        showOk={false}
        showCancel={false}
      >
        Press <kbd>?</kbd> to show this dialog.
      </Dialog>
    </div>
  </Example>
</section>

<section>
  <h3>With a Toast</h3>
  <Example>
    <div role="none">
      <Button
        variant="secondary"
        label="Show Dialog with Toast"
        onclick={() => {
          openToastDialog = true;
        }}
      />
      <!-- The toast is displayed above the dialog, and its button can be clicked, because the toast
      base is moved into the topmost modal dialog while one is open. Hovering over the toast holds
      the countdown. See https://github.com/whatwg/html/issues/9936 for the background. -->
      <Dialog bind:open={openToastDialog} title="Settings" showCancel={false}>
        <div role="none">
          <Button
            variant="secondary"
            label="Remove API Key"
            onclick={() => {
              dialogToastMessage = 'API key removed.';
              showDialogToast = true;
            }}
          />
          <Button
            variant="secondary"
            label="Open Nested Dialog"
            onclick={() => {
              openNestedToastDialog = true;
            }}
          />
        </div>
      </Dialog>
      <Dialog bind:open={openNestedToastDialog} title="Nested Dialog" showCancel={false}>
        <Button
          variant="secondary"
          label="Show Toast"
          onclick={() => {
            dialogToastMessage = 'Shown from the nested dialog.';
            showDialogToast = true;
          }}
        />
      </Dialog>
      <Toast bind:show={showDialogToast}>
        <Alert status="success">
          {dialogToastMessage}
          <Button
            variant="link"
            label="Undo"
            onclick={() => {
              dialogToastMessage = 'Undone.';
            }}
          />
        </Alert>
      </Toast>
    </div>
  </Example>
</section>

<section>
  <h3>Opened from a Menu</h3>
  <Example>
    <div role="none">
      <MenuButton variant="tertiary" label="Open Menu">
        {#snippet popup()}
          <Menu>
            <MenuItem
              label="Show Dialog"
              onclick={() => {
                openMenuDialog = true;
              }}
            />
            <MenuItem label="Item" />
          </Menu>
          <!-- The dialog lives within the popup content, which is unmounted as soon as the menu is
          closed. It must stay alive regardless, because the menu item that opens it inevitably goes
          away with the menu. -->
          <Dialog bind:open={openMenuDialog} title="Menu Dialog">Opened from a menu item!</Dialog>
        {/snippet}
      </MenuButton>
    </div>
  </Example>
</section>
