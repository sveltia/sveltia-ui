<!--
  @component
  Toast/snackbar notification. Use the Popover API if possible to acquire a non-modal top layer.
  @see https://w3c.github.io/aria/#alert
  @see https://developer.chrome.com/blog/introducing-popover-api/
  @see https://github.com/whatwg/html/issues/9936
-->
<script module>
  /**
   * Modal dialogs currently open, the topmost last. While a modal dialog is open, the rest of the
   * document is inert, including a popover stacked on top of the dialog, so the toast base has to
   * live inside the topmost dialog to stay interactive and be announced by screen readers.
   * @type {HTMLDialogElement[]}
   */
  const modals = [];

  /**
   * Get the element the toast base should be placed in.
   * @returns {HTMLElement} Topmost modal dialog, the app shell, or the `<body>`.
   */
  const getHost = () => {
    // Drop the dialogs that have been closed or removed without us noticing
    modals.splice(
      0,
      modals.length,
      ...modals.filter((dialog) => dialog.isConnected && dialog.matches(':modal')),
    );

    return modals.at(-1) ?? document.querySelector('.sui.app-shell') ?? document.body;
  };

  /**
   * Move the toast base to the top of the top layer if it has any toast, or close it otherwise.
   * It has to be reopened, because a modal dialog opened after the base is stacked on top of it.
   * @param {HTMLElement} base Toast base.
   */
  const raiseBase = (base) => {
    // Skip if the browser doesn’t support the Popover API
    /* v8 ignore next */
    if (!base.showPopover) {
      return;
    }

    if (base.matches(':popover-open')) {
      base.hidePopover();
    }

    if (base.querySelector('.toast')) {
      base.showPopover();
    }
  };

  /**
   * Move the toast base to the host returned by {@link getHost}, if it’s not there yet. Use
   * `moveBefore()` where supported, so the base stays open and the focus stays in a toast.
   * @param {HTMLElement} base Toast base.
   * @returns {boolean} Whether the base has been moved.
   */
  const moveBase = (base) => {
    const host = getHost();

    if (base.parentElement === host) {
      return false;
    }

    const { moveBefore } = /** @type {any} */ (host);

    if (typeof moveBefore === 'function' && base.isConnected) {
      moveBefore.call(host, base, null);
    } else {
      host.appendChild(base);
    }

    return true;
  };

  /**
   * Toast base shared by all the toasts. It’s created by the first toast mounted and removed with
   * the last one unmounted, rather than rendered by a component, so it doesn’t go away with the
   * toast that happened to create it.
   * @type {HTMLElement | undefined}
   */
  let base;
  /**
   * Number of the toasts currently mounted.
   */
  let mountCount = 0;

  /**
   * Move the base into a modal dialog that has just been opened.
   * @param {Event} event `toggle` event.
   */
  const onToggle = (event) => {
    const { target, newState } = /** @type {ToggleEvent} */ (event);

    if (
      base &&
      target instanceof HTMLDialogElement &&
      newState === 'open' &&
      target.matches(':modal') &&
      !modals.includes(target)
    ) {
      modals.push(target);
      moveBase(base);
      raiseBase(base);
    }
  };

  /**
   * Move the base out of a modal dialog that is being closed, before the dialog is possibly
   * removed from the DOM tree along with the base. `beforetoggle` is fired synchronously when the
   * dialog is closed; `close` is a fallback for browsers that don’t fire it on a dialog.
   * @param {Event} event `beforetoggle` or `close` event.
   */
  const onClose = (event) => {
    const { target } = event;

    if (
      !base ||
      !(target instanceof HTMLDialogElement) ||
      (event.type === 'beforetoggle' && /** @type {ToggleEvent} */ (event).newState !== 'closed')
    ) {
      return;
    }

    const index = modals.indexOf(target);

    if (index > -1) {
      modals.splice(index, 1);
    }

    if (target.contains(base) && moveBase(base) && !base.matches(':popover-open')) {
      raiseBase(base);
    }
  };

  /**
   * Get the toast base, creating it if needed, and start keeping it in the topmost modal dialog.
   * Call {@link releaseBase} once done.
   * @returns {HTMLElement} Toast base.
   */
  const acquireBase = () => {
    mountCount += 1;

    if (!base) {
      base = document.createElement('div');
      base.setAttribute('role', 'none');
      base.className = 'sui toast-base enabled';
      base.popover = 'manual';
      modals.push(...document.querySelectorAll(/** @type {'dialog'} */ ('dialog:modal')));
      // These events don’t bubble, so listen in the capture phase
      document.addEventListener('toggle', onToggle, true);
      document.addEventListener('beforetoggle', onClose, true);
      document.addEventListener('close', onClose, true);
    }

    moveBase(base);

    return base;
  };

  /**
   * Release the toast base, removing it once no toast uses it.
   */
  const releaseBase = () => {
    mountCount -= 1;

    if (mountCount > 0 || !base) {
      return;
    }

    document.removeEventListener('toggle', onToggle, true);
    document.removeEventListener('beforetoggle', onClose, true);
    document.removeEventListener('close', onClose, true);
    base.remove();
    base = undefined;
    modals.length = 0;
  };
</script>

<script>
  import { onMount, untrack } from 'svelte';

  /**
   * @import { Snippet } from 'svelte';
   * @import { ToastPosition } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {string | number} [id] The toast ID. If updated, the timer that hides
   * the toast will be reset, meaning the same toast can be displayed for a longer period of time.
   * @property {boolean} [show] Whether to show the toast.
   * @property {number} [duration] Duration to automatically hide the toast. Use `0` to hide it
   * manually from the consumer. The countdown is held while the pointer is over the toast or the
   * focus is inside it, and starts over once it leaves.
   * @property {ToastPosition} [position] Position of the toast.
   * @property {Snippet} [children] Primary slot content.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    show = $bindable(false),
    id = undefined,
    duration = 5000,
    position = 'auto',
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /**
   * @type {HTMLElement | undefined}
   */
  let popover = $state();
  /**
   * @type {HTMLElement | undefined}
   */
  let toast = $state();
  /**
   * @type {number}
   */
  let timerId = $state(0);
  /**
   * Whether the pointer is over the toast or the focus is inside it. The auto-hide countdown is
   * held while it is, so a toast with a control in it can’t vanish from under the user (WCAG
   * 2.2.1).
   * @type {boolean}
   */
  let held = $state(false);
  /**
   * Whether the content is in the DOM tree. It lags behind {@link show} on the way out, so the
   * toast can fade before the content goes. On the way in, the content is inserted rather than
   * unhidden: a live region is only announced when its content arrives.
   * @type {boolean}
   */
  let rendered = $state(false);

  onMount(() => {
    popover = acquireBase();

    return () => {
      // eslint-disable-next-line svelte/no-dom-manipulating
      toast?.remove();
      releaseBase();
    };
  });

  onMount(() => {
    if (position !== 'auto') {
      return undefined;
    }

    const mql = globalThis.matchMedia('(width < 1024px)');

    // eslint-disable-next-line jsdoc/require-jsdoc
    const setMode = () => {
      // In the RTL layout, a `bottom-right`-positioned toast is actually displayed in the
      // bottom-left corner thanks to the `inset-inline-start/end` CSS properties
      position = mql.matches ? 'bottom-center' : 'bottom-right';
    };

    setMode();
    mql.addEventListener('change', setMode);

    return () => {
      mql.removeEventListener('change', setMode);
    };
  });

  $effect(() => {
    // Both are in place by the time the effect first runs; see `onMount()` above
    /* v8 ignore next */
    if (!popover || !toast) {
      return;
    }

    // Keep the toast out of the base while it’s hidden, so faded-out toasts don’t pile up there
    if (!rendered) {
      // eslint-disable-next-line svelte/no-dom-manipulating
      toast.remove();
      // A detached element gets no `pointerleave` or `focusout`, so release the hold here, or the
      // countdown would never start the next time the toast is shown
      held = false;

      // Close the base once the last toast is gone
      if (!popover.querySelector('.toast') && popover.matches(':popover-open')) {
        popover.hidePopover();
      }

      return;
    }

    // Make sure the base is in the topmost modal dialog, in case a dialog event has been missed
    moveBase(popover);
    popover.appendChild(toast);
    raiseBase(popover);
  });

  $effect(() => {
    if (show) {
      rendered = true;

      return undefined;
    }

    // Matches the opacity transition below
    const timer = globalThis.setTimeout(() => {
      rendered = false;
    }, 250);

    return () => {
      globalThis.clearTimeout(timer);
    };
  });

  $effect(() => {
    void id;
    void show;
    void duration;
    void held;

    untrack(() => {
      globalThis.clearTimeout(timerId);
    });

    if (show && duration && !held) {
      timerId = /** @type {number} */ (
        /** @type {unknown} */ (
          globalThis.setTimeout(() => {
            show = false;
          }, duration)
        )
      );
    }
  });
</script>

<div
  {...restProps}
  bind:this={toast}
  class={['sui', 'toast', position]}
  aria-hidden={!show}
  onpointerenter={() => {
    held = true;
  }}
  onpointerleave={() => {
    held = false;
  }}
  onfocusin={() => {
    held = true;
  }}
  onfocusout={(event) => {
    held = !!event.relatedTarget && !!toast?.contains(/** @type {Node} */ (event.relatedTarget));
  }}
>
  {#if rendered}
    {@render children?.()}
  {/if}
</div>

<style lang="scss">
  // The base is created outside of the component, so the styles have to be global
  :global(.sui.toast-base) {
    position: fixed;
    inset: 16px;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: flex-end;
    gap: 8px;
    overflow: visible; // For shadow to be visible outside the container
    margin: 0;
    border: 0;
    padding: 0;
    width: auto;
    height: auto;
    background-color: transparent;
    font-family: var(--sui-font-family-default);
    font-size: var(--sui-font-size-default);
    font-weight: var(--sui-font-weight-normal, normal);
    text-align: center;
    pointer-events: none;
    -webkit-user-select: none;
    user-select: none;
  }

  :global {
    body:has(.sui.bottom-navigation:not([inert]:not([hidden]))) .toast-base {
      bottom: calc(var(--sui-bottom-navigation-height) + 16px);
    }
  }

  .toast {
    position: absolute;
    width: max-content;
    max-width: 80dvw;
    opacity: 1;
    transition-duration: 250ms;
    will-change: opacity;

    // The toast is inserted into the base when shown; fade it in from there
    @starting-style {
      opacity: 0;
    }
    // The base is click-through; the toast itself takes the pointer, so a button in it works and
    // hovering it holds the countdown
    pointer-events: auto;

    &[aria-hidden='true'] {
      display: block;
      opacity: 0;
      pointer-events: none;
    }

    &.top-left {
      inset-block-start: 0;
      inset-block-end: auto;
      inset-inline-start: 0;
      inset-inline-end: auto;
    }

    &.top-center {
      inset-block-start: 0;
      inset-block-end: auto;
      inset-inline-start: 50%;
      inset-inline-end: auto;

      &:dir(ltr) {
        transform: translateX(-50%);
      }

      &:dir(rtl) {
        transform: translateX(50%);
      }
    }

    &.top-right {
      inset-block-start: 0;
      inset-block-end: auto;
      inset-inline-start: auto;
      inset-inline-end: 0;
    }

    &.bottom-left {
      inset-block-start: auto;
      inset-block-end: 0;
      inset-inline-start: 0;
      inset-inline-end: auto;
    }

    &.bottom-center {
      inset-block-start: auto;
      inset-block-end: 0;
      inset-inline-start: 50%;
      inset-inline-end: auto;

      &:dir(ltr) {
        transform: translateX(-50%);
      }

      &:dir(rtl) {
        transform: translateX(50%);
      }
    }

    &.bottom-right {
      inset-block-start: auto;
      inset-block-end: 0;
      inset-inline-start: auto;
      inset-inline-end: 0;
    }

    :global {
      .alert {
        box-shadow: 0 8px 16px var(--sui-popup-shadow-color);
      }
    }
  }
</style>
