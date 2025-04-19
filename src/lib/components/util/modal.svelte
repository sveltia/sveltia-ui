<!--
  @component
  A generic modal top-layer helper based on the HTML `<dialog>` element.
-->
<script>
  import { sleep } from '@sveltia/utils/misc';
  import { mount, onMount, unmount } from 'svelte';
  import Placeholder from './placeholder.svelte';

  /**
   * @import { ModalProps } from '$lib/typedefs';
   */

  /**
   * @type {ModalProps & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    open = $bindable(false),
    dialog = $bindable(),
    class: className,
    role = 'dialog',
    showBackdrop = false,
    lightDismiss = false,
    escapeDismiss = true,
    keepContent = false,
    children,
    extraContent,
    onOpening,
    onOpen,
    onClosing,
    onOk,
    onCancel,
    onClose,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /**
   * Close the modal.
   * @param {string} returnValue Return value to be used for `<dialog>`.
   */
  export const close = (returnValue) => {
    if (!dialog) {
      return;
    }

    dialog.returnValue = returnValue;
    open = false;
  };

  let setOpenClass = $state(false);
  let setActiveClass = $state(false);
  let showContent = $state(false);

  /**
   * Resolve once the transition is complete.
   * @returns {Promise<void>} Nothing.
   */
  const waitForTransition = async () =>
    new Promise((resolve) => {
      /**
       * Transition event listener.
       * @param {TransitionEvent} event `transition` event.
       */
      const listener = (event) => {
        if (event.target === dialog) {
          dialog.removeEventListener('transitionend', listener);
          resolve();
        }
      };

      dialog?.addEventListener('transitionend', listener);
    });

  /**
   * Show the modal.
   */
  const openDialog = async () => {
    if (!dialog || dialog?.open) {
      return;
    }

    onOpening?.(new CustomEvent('Opening'));
    showContent = true;
    dialog.showModal();
    onOpen?.(new CustomEvent('Open'));
    await sleep(0);
    setOpenClass = true;
    await waitForTransition();
    setActiveClass = true;
  };

  /**
   * Hide the modal.
   */
  const closeDialog = async () => {
    if (!dialog || !dialog.open) {
      return;
    }

    const { returnValue } = dialog;

    onClosing?.(new CustomEvent('Closing'));
    // Prevent a button behind the `<dialog>` from being clicked erroneously (Svelte bug)
    document.body.inert = true;
    dialog.close();
    document.body.inert = false;
    setActiveClass = false;
    setOpenClass = false;
    await waitForTransition();
    showContent = false;

    if (returnValue === 'ok') {
      onOk?.(new CustomEvent('Ok'));
    }

    if (returnValue === 'cancel') {
      onCancel?.(new CustomEvent('Cancel'));
    }

    onClose?.(new CustomEvent('Close', { detail: { returnValue } }));
    dialog.returnValue = '';
  };

  $effect(() => {
    if (open) {
      openDialog();
    } else {
      closeDialog();
    }
  });

  onMount(() => {
    const placeholder = mount(Placeholder, {
      target: document.querySelector('.sui.app-shell') ?? document.body,
      // eslint-disable-next-line no-use-before-define
      props: { children: dialogSnippet },
    });

    // onUnmount
    return () => {
      dialog?.close();
      unmount(placeholder);
    };
  });
</script>

{#snippet dialogSnippet()}
  <dialog
    bind:this={dialog}
    {...restProps}
    inert={!setOpenClass}
    {role}
    class="sui modal {className}"
    class:backdrop={showBackdrop}
    class:open={setOpenClass}
    class:active={setActiveClass}
    onclick={({ target }) => {
      if (
        dialog &&
        lightDismiss &&
        /** @type {HTMLElement | undefined} */ (target)?.matches('dialog')
      ) {
        dialog.returnValue = 'cancel';
        open = false;
      }
    }}
    oncancel={(event) => {
      event.preventDefault();

      // Escape key is pressed
      if (dialog && escapeDismiss) {
        dialog.returnValue = 'cancel';
        open = false;
      }
    }}
  >
    {@render extraContent?.()}
    {#if showContent || keepContent}
      {@render children?.()}
    {/if}
  </dialog>
{/snippet}

<style lang="scss">
  dialog {
    position: fixed;
    inset: 0;
    z-index: 9999999;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    outline: 0;
    margin: 0;
    border: 0;
    padding: 0;
    width: 100dvw;
    max-width: 100dvw;
    height: 100dvh;
    max-height: 100dvh;
    color: var(--sui-primary-foreground-color);
    background: transparent;
    -webkit-user-select: none;
    user-select: none;
    touch-action: none;
    pointer-events: all;
    cursor: default;

    &::backdrop {
      background: transparent;
    }

    &.backdrop {
      background-color: var(--sui-popup-backdrop-color);
    }

    &.open {
      transition-duration: 50ms;
      opacity: 1;
    }

    &:not(.open) {
      transition-duration: 400ms;
      opacity: 0;
    }

    &[hidden] {
      transition-duration: 1ms !important;
    }

    &:not(.active) {
      pointer-events: none !important;

      :global {
        * {
          transition-duration: 0ms !important;
          pointer-events: none !important;
        }
      }
    }
  }
</style>
