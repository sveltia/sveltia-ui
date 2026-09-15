<!--
  @component
  Toast/snackbar notification. Use the Popover API if possible to acquire a non-modal top layer.
  @see https://w3c.github.io/aria/#alert
  @see https://developer.chrome.com/blog/introducing-popover-api/
-->
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
  let popoverBase = $state();
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
    popover =
      /** @type {HTMLElement} */ (document.querySelector('.sui.toast-base.enabled')) ?? undefined;

    if (popover) {
      // eslint-disable-next-line svelte/no-dom-manipulating
      popoverBase?.remove();
    } else {
      popover = popoverBase;

      // The base is bound by the time the component is mounted
      /* v8 ignore else */
      if (popover) {
        popover.classList.add('enabled');
        (document.querySelector('.sui.app-shell') ?? document.body).appendChild(popover);

        // Move the element to top layer, unless the browser doesn’t support the Popover API
        /* v8 ignore else */
        if (popover.showPopover) {
          popover.popover = 'manual';
          popover.showPopover();
        }
      }
    }

    return () => {
      // eslint-disable-next-line svelte/no-dom-manipulating
      toast?.remove();
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
    /* v8 ignore else */
    if (popover && toast) {
      popover.appendChild(toast);
    }
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

<div bind:this={popoverBase} role="none" class="sui toast-base"></div>

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
  .toast-base {
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
