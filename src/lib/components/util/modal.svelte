<!--
  @component
  A generic modal top-layer helper based on the HTML `<dialog>` element.
-->
<script>
  import { getAllContexts, mount, onMount, tick, unmount } from 'svelte';
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
   * Focus the `<dialog>` element.
   */
  export const focus = () => {
    dialog?.focus();
  };

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
  /**
   * Whether the modal is being displayed. This is enabled just before the opening transition
   * starts, and disabled right after the closing transition is complete.
   * @type {boolean}
   */
  let visible = $state(false);

  /**
   * Whether the `<dialog>` element is in the DOM tree. Unless {@link keepContent} is enabled, the
   * element is mounted on demand, and unmounted once the closing transition is complete.
   * @type {boolean}
   */
  const mounted = $derived(keepContent || visible);

  /**
   * Whether the modal has been requested to open. Unlike the {@link open} prop, this is a plain
   * variable updated synchronously at the very beginning of `openDialog`/`closeDialog`, so either
   * of them can bail out early when the requested state is already in effect.
   * @type {boolean}
   */
  let requestedOpen = false;

  /**
   * Monotonically increasing counter used to detect stale async operations. Incremented at the
   * start of each `openDialog`/`closeDialog` call; any suspended continuation that finds its
   * captured value no longer matches the current counter knows it has been superseded and exits
   * without mutating state.
   * @type {number}
   */
  let generation = 0;

  /**
   * Get the longest time from a computed CSS time list, such as `transition-duration`.
   * @param {string} value Comma-separated CSS time values in seconds, e.g. `0.4s, 0.15s`.
   * @returns {number} Time in milliseconds.
   */
  const getLongestTime = (value) =>
    Math.max(0, ...value.split(',').map((time) => Number.parseFloat(time) || 0)) * 1000;

  /**
   * Resolve once the transition is complete.
   * @returns {Promise<void>} Nothing.
   */
  const waitForTransition = async () => {
    // Let the CSS class change be applied first, so the duration below is read from the new state
    await tick();

    if (!dialog) {
      return;
    }

    const { transitionDuration, transitionDelay } = getComputedStyle(dialog);
    // Fall back to a timer, so the modal is never stuck half-open (and, more importantly, never
    // left mounted) in case `transitionend` is never fired, e.g. when the transition is removed by
    // the consumer’s CSS or the element is not rendered at all
    const timeout = getLongestTime(transitionDuration) + getLongestTime(transitionDelay) + 100;
    const controller = new AbortController();
    const { signal } = controller;

    dialog.addEventListener(
      'transitionend',
      (event) => {
        if (event.target === dialog) {
          controller.abort();
        }
      },
      { signal },
    );

    const timer = window.setTimeout(() => controller.abort(), timeout);

    await new Promise((resolve) => {
      signal.addEventListener('abort', () => resolve(undefined));
    });

    window.clearTimeout(timer);
  };

  /**
   * Show the modal.
   */
  const openDialog = async () => {
    if (requestedOpen) {
      return;
    }

    requestedOpen = true;
    generation += 1;

    const gen = generation;

    onOpening?.(new CustomEvent('Opening'));
    visible = true;
    // Wait for the `<dialog>` element to be added to the DOM tree
    await tick();

    if (gen !== generation || !dialog || dialog.open) return;

    dialog.showModal();
    onOpen?.(new CustomEvent('Open'));
    // Force a style recalculation, so the browser has a state to transition from. This is required
    // because the element may have just been added to the DOM tree.
    dialog.getBoundingClientRect();
    setOpenClass = true;
    await waitForTransition();
    if (gen !== generation) return;
    setActiveClass = true;
  };

  /**
   * Hide the modal.
   */
  const closeDialog = async () => {
    if (!requestedOpen) {
      return;
    }

    requestedOpen = false;
    generation += 1;

    const gen = generation;
    const wasOpen = setOpenClass;
    const returnValue = dialog?.returnValue ?? '';

    onClosing?.(new CustomEvent('Closing'));

    if (dialog?.open) {
      // Prevent a button behind the `<dialog>` from being clicked erroneously (Svelte bug)
      document.body.inert = true;
      dialog.close();
      document.body.inert = false;
    }

    setActiveClass = false;
    setOpenClass = false;

    // Only wait for the closing transition if the dialog was visually open (i.e. the `.open` CSS
    // class was set). If the dialog was closed before the opening transition even started, there is
    // no CSS transition in progress and `transitionend` will never fire.
    if (wasOpen) {
      await waitForTransition();
    }

    if (gen !== generation) return;

    // Unmount the `<dialog>` element unless `keepContent` is enabled
    visible = false;

    if (returnValue === 'ok') {
      onOk?.(new CustomEvent('Ok'));
    }

    if (returnValue === 'cancel') {
      onCancel?.(new CustomEvent('Cancel'));
    }

    onClose?.(new CustomEvent('Close', { detail: { returnValue } }));

    if (dialog) {
      dialog.returnValue = '';
    }
  };

  /**
   * The context available to this component. The `<dialog>` element is rendered in a separate
   * component tree created with `mount()`, which would otherwise start with an empty context, so
   * this is forwarded to keep `getContext()` working for the modal content.
   * @type {Map<any, any>}
   */
  const context = getAllContexts();

  onMount(() => {
    const placeholder = mount(Placeholder, {
      target: document.querySelector('.sui.app-shell') ?? document.body,
      // eslint-disable-next-line no-use-before-define
      props: { children: dialogSnippet },
      context,
    });

    // onUnmount
    return () => {
      dialog?.close();
      unmount(placeholder);
    };
  });

  // This must be declared after `onMount()` above, because effects run in declaration order, and
  // `openDialog()` expects the placeholder holding the `<dialog>` element to be already mounted
  $effect(() => {
    if (open) {
      openDialog();
    } else {
      closeDialog();
    }
  });
</script>

{#snippet dialogSnippet()}
  {#if mounted}
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
      {@render children?.()}
    </dialog>
  {/if}
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
