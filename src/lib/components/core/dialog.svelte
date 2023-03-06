<!--
  @component
  @see https://w3c.github.io/aria/#dialog
  @see https://w3c.github.io/aria-practices/#dialog_modal
-->
<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import Button from './button.svelte';
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
  let showContent = false;
  let showContentTimer = 0;

  $: {
    if (dialog) {
      if (open) {
        window.clearTimeout(showContentTimer);
        showContent = true;

        if (modal) {
          dialog.showModal();
        } else {
          dialog.show();
        }
      } else {
        dialog.close();

        showContentTimer = window.setTimeout(() => {
          showContent = false;
        }, 500);

        if (dialog.returnValue === 'ok') {
          dispatch('ok');
        }

        if (dialog.returnValue === 'cancel') {
          dispatch('cancel');
        }

        dispatch('close', dialog.returnValue);
      }
    }
  }

  onMount(() => {
    // Avoid nested dialogs
    (document.querySelector('.sui.app-shell') || document.body).appendChild(dialog);
  });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<dialog
  bind:this={dialog}
  class="sui dialog {className} {size}"
  on:click={({ target }) => {
    if (closeOnBackdropClick && target?.matches('dialog')) {
      dialog.returnValue = 'cancel';
      open = false;
    }
  }}
  on:cancel={() => {
    // Cancelled with the Escape key
    open = false;
  }}
>
  <form method="dialog" on:submit|preventDefault>
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
                class="ternary iconic"
                iconName="close"
                iconLabel={$_('sui._.close')}
                on:click={() => {
                  dialog.returnValue = 'close';
                  open = false;
                }}
              />
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
    background-color: var(--popup-backdrop-color);
    backdrop-filter: blur(8px);
    transition: all 200ms;

    &:not([open]) {
      opacity: 0;
      pointer-events: none !important;

      form {
        transform: scale(90%);
      }

      :global(*) {
        pointer-events: none !important;
      }
    }

    &[open] {
      opacity: 1;

      form {
        transform: scale(100%);
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
      background-color: var(--secondary-background-color);
      box-shadow: 0 8px 16px var(--popup-shadow-color);
      transition: all 200ms;
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
      font-size: 16px;
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
