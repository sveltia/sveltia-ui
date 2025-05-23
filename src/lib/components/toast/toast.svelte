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
   * manually from the consumer.
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

  onMount(() => {
    popover =
      /** @type {HTMLElement} */ (document.querySelector('.sui.toast-base.enabled')) ?? undefined;

    if (popover) {
      popoverBase?.remove();
    } else {
      popover = popoverBase;

      if (popover) {
        popover.classList.add('enabled');
        (document.querySelector('.sui.app-shell') ?? document.body).appendChild(popover);

        // Move the element to top layer
        if (popover.showPopover) {
          popover.popover = 'manual';
          popover.showPopover();
        }
      }
    }

    return () => {
      toast?.remove();
    };
  });

  onMount(() => {
    if (position === 'auto') {
      const mql = globalThis.matchMedia('(width < 1024px)');

      // eslint-disable-next-line jsdoc/require-jsdoc
      const setMode = () => {
        position = mql.matches
          ? 'bottom-center'
          : `bottom-${document.dir === 'rtl' ? 'left' : 'right'}`;
      };

      setMode();
      mql.addEventListener('change', setMode);
    }
  });

  $effect(() => {
    if (popover && toast) {
      popover.appendChild(toast);
    }
  });

  $effect(() => {
    void id;
    void show;
    void duration;

    untrack(() => {
      globalThis.clearTimeout(timerId);
    });

    if (show && duration) {
      timerId = globalThis.setTimeout(() => {
        show = false;
      }, duration);
    }
  });
</script>

<div bind:this={popoverBase} role="none" class="sui toast-base"></div>

<div {...restProps} bind:this={toast} class="sui toast {position}" aria-hidden={!show}>
  {@render children?.()}
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
    box-shadow: 0 8px 16px var(--sui-popup-shadow-color);
    opacity: 1;
    transition-duration: 250ms;
    will-change: opacity;

    &[aria-hidden='true'] {
      display: block;
      opacity: 0;
    }

    &.top-left {
      inset: 0 auto auto 0;
    }

    &.top-center {
      inset: 0 auto auto 50%;
      transform: translateX(-50%);
    }

    &.top-right {
      inset: 0 0 auto auto;
    }

    &.bottom-left {
      inset: auto auto 0 0;
    }

    &.bottom-center {
      inset: auto auto 0 50%;
      transform: translateX(-50%);
    }

    &.bottom-right {
      inset: auto 0 0 auto;
    }
  }
</style>
