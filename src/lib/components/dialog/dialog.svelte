<!--
  @component
  A feedback dialog widget based on the HTML `<dialog>` element.
  @see https://w3c.github.io/aria/#dialog
  @see https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
-->
<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { getRandomId } from '$lib/services/util';
  import Button from '../button/button.svelte';
  import Spacer from '../divider/spacer.svelte';
  import Icon from '../icon/icon.svelte';

  /**
   * The `class` attribute on the `<dialog>` element.
   * @type {string}
   */
  let className = '';
  export { className as class };
  /**
   * The `role` attribute on the `<dialog>` element.
   * @type {'dialog' | 'alertdialog'}
   */
  export let role = 'dialog';
  /**
   * Width of the dialog.
   * @type {('small' | 'medium' | 'large' | 'x-large')}
   */
  export let size = 'medium';
  /**
   * Whether to open the dialog.
   * @type {boolean}
   */
  export let open = false;
  /**
   * Whether to make it modal.
   * @type {boolean}
   */
  export let modal = true;
  /**
   * Text label displayed on the header. Required.
   * @type {string}
   */
  export let title;
  /**
   * Whether to show the Close button on the header.
   * @type {boolean}
   */
  export let showClose = false;
  /**
   * Whether to show the OK button on the footer.
   * @type {boolean}
   */
  export let showOk = true;
  /**
   * Text label displayed on the OK button.
   * @type {string}
   */
  export let okLabel = '';
  /**
   * Whether to disable the OK button.
   * @type {boolean}
   */
  export let okDisabled = false;
  /**
   * Whether to show the Cancel button on the footer.
   * @type {boolean}
   */
  export let showCancel = true;
  /**
   * Text label displayed on the Cancel button.
   * @type {string}
   */
  export let cancelLabel = '';
  /**
   * Whether to disable the Cancel button.
   * @type {boolean}
   */
  export let cancelDisabled = false;
  /**
   * Whether to close the modal when the backdrop (outside of the modal) is clicked.
   * @type {boolean}
   */
  export let lightDismiss = false;

  const dispatch = createEventDispatcher();
  const id = getRandomId('dialog');
  /** @type {?HTMLDialogElement} */
  let dialog;
  /** @type {?HTMLFormElement} */
  let form;
  let showDialog = false;
  let showContent = false;

  /**
   *
   */
  const openDialog = async () => {
    (document.querySelector('.sui.app-shell') ?? document.body).appendChild(dialog);
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

  /**
   *
   */
  const closeDialog = async () => {
    showDialog = false;

    await new Promise((resolve) => {
      form.addEventListener('transitionend', () => resolve(), { once: true });
    });

    showContent = false;
    dialog?.close();
    dialog?.remove();

    if (['ok', 'cancel'].includes(dialog?.returnValue)) {
      dispatch(dialog?.returnValue);
    }

    dispatch('close', dialog?.returnValue);
  };

  /**
   *
   */
  const toggleDialog = () => {
    if (dialog) {
      if (open) {
        openDialog();
      } else {
        closeDialog();
      }
    }
  };

  $: {
    void open;
    toggleDialog();
  }

  onMount(() => {
    dialog.remove();

    // onUnmount
    return () => {
      dialog?.close();
      dialog?.remove();
    };
  });
</script>

<dialog
  {id}
  class="sui dialog {className} {size}"
  class:open={showDialog}
  {role}
  aria-label={$$slots.header ? undefined : title}
  aria-labelledby={$$slots.header ? title : `${id}-title`}
  aria-describedby="{id}-body"
  {...$$restProps}
  bind:this={dialog}
  on:click={({ target }) => {
    if (lightDismiss && /** @type {HTMLElement?} */ (target)?.matches('dialog')) {
      dialog.returnValue = 'cancel';
      open = false;
    }
  }}
  on:cancel|preventDefault={() => {
    // Cancelled with the Escape key
    open = false;
  }}
>
  <form role="none" method="dialog" bind:this={form} on:submit|preventDefault>
    {#if showContent}
      {#if title || showClose || $$slots.header || $$slots['header-extra']}
        <div role="none" class="header">
          {#if $$slots.header}
            <slot name="header" />
          {:else}
            <div role="none" id="{id}-title" class="title">
              {title}
            </div>
            <Spacer flex={true} />
            {#if $$slots['header-extra']}
              <slot name="header-extra" />
            {/if}
            {#if showClose}
              <Button
                variant="ghost"
                iconic
                aria-label={$_('_sui.close')}
                aria-controls={id}
                on:click={() => {
                  dialog.returnValue = 'close';
                  open = false;
                }}
              >
                <Icon slot="start-icon" name="close" />
              </Button>
            {/if}
          {/if}
        </div>
      {/if}
      <div role="none" id="{id}-body" class="body">
        <slot />
      </div>
      {#if showOk || showCancel || $$slots.footer || $$slots['footer-extra']}
        <div role="none" class="footer">
          {#if $$slots.footer}
            <slot name="footer" />
          {:else}
            {#if $$slots['footer-extra']}
              <slot name="footer-extra" />
            {/if}
            <Spacer flex={true} />
            {#if showOk}
              <Button
                variant="primary"
                label={okLabel || $_('_sui.ok')}
                disabled={okDisabled}
                on:click={() => {
                  dialog.returnValue = 'ok';
                  open = false;
                }}
              />
            {/if}
            {#if showCancel}
              <Button
                variant="secondary"
                label={cancelLabel || $_('_sui.cancel')}
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
    background-color: var(--sui-popup-backdrop-color);

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
    :global(input[aria-disabled='false']),
    :global(textarea[aria-disabled='false']),
    :global(button[aria-disabled='false']),
    :global([tabindex='0']) {
      pointer-events: all;
    }

    form {
      display: flex;
      flex-direction: column;
      border-radius: 4px;
      max-width: calc(100vw - 32px);
      background-color: var(--sui-secondary-background-color-translucent);
      -webkit-backdrop-filter: blur(32px);
      backdrop-filter: blur(32px);
      box-shadow: 0 8px 16px var(--sui-popup-shadow-color);
      will-change: opacity, transform;
      transition-property: opacity, transform;
    }

    &.small form {
      width: 400px;
      max-height: 400px;

      @media (max-height: 400px) {
        max-height: calc(100vh - 32px);
      }
    }

    &.medium form {
      width: 600px;
      max-height: 600px;

      @media (max-height: 600px) {
        max-height: calc(100vh - 32px);
      }
    }

    &.large form {
      width: 800px;
      max-height: 800px;

      @media (max-height: 800px) {
        max-height: calc(100vh - 32px);
      }
    }

    &.x-large form {
      width: 1000px;
      max-height: 1000px;

      @media (max-height: 1000px) {
        max-height: calc(100vh - 32px);
      }
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
    border-color: var(--sui-secondary-border-color);
    padding: 16px 8px;
    height: 32px;

    .title {
      font-size: var(--sui-font-size-large);
    }
  }

  .footer {
    margin: 0 24px 24px;
  }

  .body {
    overflow: auto;
    margin: 24px 24px;
    white-space: normal;
    line-height: var(--sui-line-height-compact);
  }
</style>
