<!--
  @component
  A generic modal top-layer helper based on the HTML `<dialog>` element.
-->
<svelte:options accessors={true} />

<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { sleep } from '$lib/services/util';

  /**
   * The `class` attribute on the `<dialog>` element.
   * @type {string}
   */
  let className = '';
  export { className as class };
  /**
   * The `role` attribute on the `<dialog>` element.
   * @type {'dialog' | 'alertdialog' | 'none'}
   */
  export let role = 'dialog';
  /**
   * Whether to show the modal.
   * @type {boolean}
   */
  export let open = false;
  /**
   * Whether to show the backdrop.
   * @type {boolean}
   */
  export let showBackdrop = false;
  /**
   * Whether to close the modal when the backdrop (outside of the modal) is clicked.
   * @type {boolean}
   */
  export let lightDismiss = false;
  /**
   * Whether to close the modal when the Escape key is pressed.
   * @type {boolean}
   */
  export let escapeDismiss = true;
  /**
   * Whether to keep the content in the DOM tree when the modal is not displayed.
   * @type {boolean}
   */
  export let keepContent = false;
  /**
   * A reference to the `<dialog>` element.
   * @type {HTMLDialogElement | undefined}
   */
  export let dialog = undefined;
  /**
   * Close the modal.
   * @param {string} returnValue - Return value to be used for `<dialog>`.
   */
  export const close = (returnValue) => {
    if (!dialog) {
      return;
    }

    dialog.returnValue = returnValue;
    open = false;
  };

  const dispatch = createEventDispatcher();
  let setOpenClass = false;
  let setActiveClass = false;
  let showContent = false;

  /**
   * Resolve once the transition is complete.
   * @returns {Promise<void>} Nothing.
   */
  const waitForTransition = async () =>
    new Promise((resolve) => {
      /**
       * Transition event listener.
       * @param {TransitionEvent} event - `transition` event.
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
    if (!dialog) {
      return;
    }

    dispatch('opening');
    (document.querySelector('.sui.app-shell') ?? document.body).appendChild(dialog);
    showContent = true;
    dialog.showModal();
    dispatch('open');
    await sleep(100);
    setOpenClass = true;
    await waitForTransition();
    setActiveClass = true;
  };

  /**
   * Hide the modal.
   */
  const closeDialog = async () => {
    if (!dialog) {
      return;
    }

    dispatch('closing');
    setActiveClass = false;
    setOpenClass = false;
    await waitForTransition();
    showContent = false;
    dialog.close();
    dialog.remove();

    if (['ok', 'cancel'].includes(dialog.returnValue)) {
      dispatch(dialog?.returnValue);
    }

    dispatch('close', dialog.returnValue);
    dialog.returnValue = '';
  };

  /**
   * Toggle the modal.
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
    void dialog;
    toggleDialog();
  }

  onMount(() => {
    dialog?.remove();

    // onUnmount
    return () => {
      dialog?.close();
      dialog?.remove();
    };
  });
</script>

<dialog
  {role}
  class="sui modal {className}"
  class:backdrop={showBackdrop}
  class:open={setOpenClass}
  class:active={setActiveClass}
  {...$$restProps}
  bind:this={dialog}
  on:click={({ target }) => {
    if (
      dialog &&
      lightDismiss &&
      /** @type {HTMLElement | undefined} */ (target)?.matches('dialog')
    ) {
      dialog.returnValue = 'cancel';
      open = false;
    }
  }}
  on:cancel|preventDefault={() => {
    // Escape key is pressed
    if (dialog && escapeDismiss) {
      dialog.returnValue = 'cancel';
      open = false;
    }
  }}
>
  <slot name="extra-content" />
  {#if showContent || keepContent}
    <slot />
  {/if}
</dialog>

<style lang="scss">
  dialog {
    position: fixed;
    inset: 0;
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

    &:not(.active) {
      pointer-events: none !important;

      :global(*) {
        pointer-events: none !important;
      }
    }
  }
</style>
