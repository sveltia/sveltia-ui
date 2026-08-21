<!--
  @component
  A generic modal top-layer helper based on the HTML `<dialog>` element.
-->
<script module>
  /**
   * Context key used by a modal to keep the modal it’s rendered within mounted.
   * @type {symbol}
   */
  const RETAINER_KEY = Symbol('sui-modal-retainer');
</script>

<script>
  import {
    getAllContexts,
    getContext,
    mount,
    onMount,
    setContext,
    tick,
    unmount,
    untrack,
  } from 'svelte';
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
    restoreFocus = true,
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
   * Focus the `<dialog>` element. It has `tabindex="-1"`, so it can receive focus programmatically,
   * allowing assistive technology to announce the modal’s label and description.
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
   * The number of descendant modals that are currently being displayed. A popup’s content is
   * unmounted as soon as the popup closes, which would also destroy any modal declared alongside
   * it, such as a dialog opened from a menu item. Because the menu item inevitably goes away with
   * the menu, the dialog has to outlive it, so the content is held until the dialog is done with.
   * @type {number}
   */
  let retainCount = $state(0);

  /**
   * The retainer of the modal this modal is rendered within, if any. This has to be read before the
   * `setContext()` call below, which would otherwise shadow it with this modal’s own retainer.
   * @type {{ retain: () => void, release: () => void } | undefined}
   */
  const parentRetainer = getContext(RETAINER_KEY);

  // This has to be set before `getAllContexts()` below, so the content, which is rendered in a
  // separate component tree, can reach it. The counter is updated within `untrack()`, because
  // incrementing it reads it first, which would otherwise make it a dependency of the calling
  // descendant’s effect and send that effect into an endless retain/release loop.
  setContext(RETAINER_KEY, {
    /**
     * Keep this modal mounted on behalf of a descendant modal.
     */
    retain: () => {
      untrack(() => {
        retainCount += 1;
      });
    },
    /**
     * Release a hold previously acquired with `retain`.
     */
    release: () => {
      untrack(() => {
        retainCount -= 1;
      });
    },
  });

  /**
   * Whether the `<dialog>` element is in the DOM tree. Unless {@link keepContent} is enabled, the
   * element is mounted on demand, and unmounted once the closing transition is complete.
   * @type {boolean}
   */
  const mounted = $derived(keepContent || visible || retainCount > 0);

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
   * The element that had the focus just before the modal was opened. The focus is moved back to it
   * once the modal is closed.
   * @type {HTMLElement | undefined}
   */
  let lastActiveElement;

  /**
   * Timer used to defer the focus restoration in {@link moveFocusBack}.
   * @type {number | undefined}
   */
  let restoreFocusTimer;

  /**
   * Move the focus back to the element that had it before the modal was opened. This is done
   * manually rather than relying on the browser’s own focus restoration, because the modal is
   * closed while `<body>` is `inert`, which prevents the focus from being restored.
   */
  const moveFocusBack = () => {
    const element = lastActiveElement;

    lastActiveElement = undefined;

    if (!restoreFocus || !element) {
      return;
    }

    // Wait for the current task to finish before moving the focus. The modal is typically closed
    // from within an event handler, and the event that triggered it is still being processed:
    // Firefox dispatches `keypress` to whatever holds the focus at that point, so restoring it
    // synchronously would let the Enter key that submitted the modal activate the button that
    // opened it, immediately reopening the modal.
    restoreFocusTimer = window.setTimeout(() => {
      const { activeElement } = document;

      if (!element.isConnected) {
        return;
      }

      // Only take the focus back if it’s still inside the modal, or nowhere because the modal took
      // it down with itself. If it has already moved on, pulling it back would undo what happened.
      if (!activeElement || activeElement === document.body || dialog?.contains(activeElement)) {
        element.focus();
      }
    });
  };

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
    const { activeElement } = document;

    // Cancel a pending restoration from a previous close, which would otherwise pull the focus out
    // of the modal that’s being opened right now
    window.clearTimeout(restoreFocusTimer);
    lastActiveElement = activeElement instanceof HTMLElement ? activeElement : undefined;

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
    // Wait for the `inert` attribute to be removed, then move the focus into the modal. The
    // browser’s own dialog focusing steps don’t do this, because the element is still `inert` when
    // `showModal()` is called above, leaving the focus on `<body>`. A component using this modal,
    // such as `<Dialog>`, may then move the focus to a specific control, like an input field.
    await tick();

    if (gen !== generation || !dialog) return;

    if (!dialog.contains(document.activeElement)) {
      focus();
    }

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

    moveFocusBack();
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
      window.clearTimeout(restoreFocusTimer);
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

  // Hold the enclosing modal, if any, for as long as this one is on screen. `visible` is used
  // rather than `mounted`, so a `keepContent` modal doesn’t pin its ancestor forever
  $effect(() => {
    if (!visible) {
      return undefined;
    }

    parentRetainer?.retain();

    return () => {
      parentRetainer?.release();
    };
  });
</script>

{#snippet dialogSnippet()}
  {#if mounted}
    <dialog
      bind:this={dialog}
      tabindex="-1"
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
