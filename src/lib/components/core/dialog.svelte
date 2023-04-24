<!--
  @component
  @see https://w3c.github.io/aria/#dialog
  @see https://w3c.github.io/aria-practices/#dialog_modal
-->
<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import Button from './button.svelte';
  import Icon from './icon.svelte';
  import Spacer from './spacer.svelte';

  /**
   * CSS class name on the button.
   * @type {String}
   */
  let className = '';

  export { className as class };

  export let open = false;

  export let title = '';

  /**
   * Width of the dialog.
   * @type {('small'|'medium'|'large')}
   */
  export let size = 'medium';

  export let modal = true;

  export let showCancel = true;

  export let showOk = true;

  export let showClose = false;

  export let okLabel = '';

  export let okDisabled = false;

  export let cancelLabel = '';

  export let cancelDisabled = false;

  export let closeOnBackdropClick = false;

  const dispatch = createEventDispatcher();
  /** @type {?HTMLDialogElement} */
  let dialog;
  /** @type {?HTMLFormElement} */
  let form;
  let showDialog = false;
  let showContent = false;

  const openDialog = async () => {
    (document.querySelector('.sui.app-shell') || document.body).appendChild(dialog);
    showContent = true;

    if (modal) {
      dialog.showModal();
    } else {
      dialog.show();
    }

    window.requestAnimationFrame(() => {
      showDialog = true;
    });
  };

  const closeDialog = async () => {
    showDialog = false;

    if (dialog.returnValue === 'ok') {
      dispatch('ok');
    }

    if (dialog.returnValue === 'cancel') {
      dispatch('cancel');
    }

    dispatch('close', dialog.returnValue);

    await new Promise((resolve) => {
      form.addEventListener('transitionend', () => resolve(), { once: true });
    });

    showContent = false;
    dialog?.close();
    dialog?.remove();
  };

  const toggleDialog = () => {
    if (dialog) {
      if (open) {
        openDialog();
      } else {
        closeDialog();
      }
    }
  };

  // Call the function only when the `open` prop is changed
  $: toggleDialog(open);

  onMount(() => {
    dialog.remove();

    // onUnmount
    return () => {
      dialog?.close();
      dialog?.remove();
    };
  });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<dialog
  bind:this={dialog}
  class="sui dialog {className} {size}"
  class:open={showDialog}
  on:click={({ target }) => {
    if (closeOnBackdropClick && target?.matches('dialog')) {
      dialog.returnValue = 'cancel';
      open = false;
    }
  }}
  on:cancel|preventDefault={() => {
    // Cancelled with the Escape key
    open = false;
  }}
>
  <form method="dialog" bind:this={form} on:submit|preventDefault>
    {#if showContent}
      {#if title || showClose || $$slots.header || $$slots['header-extra']}
        <div class="header">
          {#if $$slots.header}
            <slot name="header" />
          {:else}
            <div class="title">
              {title}
            </div>
            <Spacer flex={true} />
            {#if $$slots['header-extra']}
              <slot name="header-extra" />
            {/if}
            {#if showClose}
              <Button
                class="tertiary iconic"
                on:click={() => {
                  dialog.returnValue = 'close';
                  open = false;
                }}
              >
                <Icon slot="start-icon" name="close" label={$_('sui._.close')} />
              </Button>
            {/if}
          {/if}
        </div>
      {/if}
      <div class="main">
        <slot />
      </div>
      {#if showOk || showCancel || $$slots.footer || $$slots['footer-extra']}
        <div class="footer">
          {#if $$slots.footer}
            <slot name="footer" />
          {:else}
            {#if $$slots['footer-extra']}
              <slot name="footer-extra" />
            {/if}
            <Spacer flex={true} />
            {#if showOk}
              <Button
                class="primary"
                label={okLabel || $_('sui._.ok')}
                disabled={okDisabled}
                on:click={() => {
                  dialog.returnValue = 'ok';
                  open = false;
                }}
              />
            {/if}
            {#if showCancel}
              <Button
                class="secondary"
                label={cancelLabel || $_('sui._.cancel')}
                disabled={cancelDisabled}
                on:click={() => {
                  dialog.returnValue = 'cancel';
                  open = false;
                }}
              />
            {/if}
          {/if}
        </div>
      {/if}
    {/if}
  </form>
</dialog>

<style lang="scss">
  dialog {
    display: flex;
    justify-content: center;
    align-items: center;
    outline: 0;
    background-color: var(--popup-backdrop-color);

    &.open {
      form {
        opacity: 1;
        transform: scale(100%);
        transition-duration: 100ms;
      }
    }

    &:not(.open) {
      pointer-events: none !important;

      form {
        opacity: 0;
        transform: scale(90%);
        pointer-events: none;
        transition-duration: 200ms;
      }

      :global(*) {
        pointer-events: none !important;
      }
    }

    :global(a),
    :global(input),
    :global(textarea),
    :global(button),
    :global([tabindex='0']) {
      pointer-events: all;
    }

    form {
      display: flex;
      flex-direction: column;
      border-radius: 4px;
      background-color: var(--secondary-background-color-translucent);
      backdrop-filter: blur(16px);
      box-shadow: 0 8px 16px var(--popup-shadow-color);
      will-change: opacity, transform;
      transition-property: opacity, transform;
    }

    &.small form {
      width: 400px;
      max-height: 400px;
    }

    &.medium form {
      width: 600px;
      max-height: 600px;
    }

    &.large form {
      width: 800px;
      max-height: 800px;
    }

    &.x-large form {
      width: 1000px;
      max-height: 1000px;
    }
  }

  .header,
  .footer {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .header {
    box-sizing: content-box;
    margin: 0 16px;
    border-width: 0 0 1px;
    border-color: var(--secondary-border-color);
    padding: 16px 8px;
    height: 32px;

    .title {
      font-size: var(--font-size--large);
    }
  }

  .footer {
    margin: 0 24px 24px;
  }

  .main {
    overflow: auto;
    margin: 24px 24px;
    white-space: normal;
  }
</style>
