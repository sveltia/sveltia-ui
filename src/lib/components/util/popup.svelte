<!--
  @component
  Generic popup helper.
-->
<svelte:options accessors={true} />

<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { activatePopup } from '../../services/popup';
  import { sleep } from '../../services/util';

  /**
   * The `class` attribute on the `<button>` element.
   * @type {string}
   */
  let className = '';
  export { className as class };

  /** @type {HTMLElement | undefined} */
  export let anchor = undefined;

  /**
   * Reference to the popup element.
   * @type {HTMLDialogElement | undefined}
   */
  export let dialog = undefined;

  /**
   * Reference to the content element.
   * @type {HTMLElement | undefined}
   */
  export let content = undefined;

  /**
   * Where to show the dropdown menu.
   * @type {PopupPosition}
   */
  export let position = 'bottom-left';

  /**
   * Whether to keep the content when the dialog is not displayed.
   */
  export let keepContent = false;

  /**
   * Whether to show the popup at the center of the screen on mobile/tablet and ignore the defined
   * dropdown `position`.
   * @type {boolean}
   */
  export let touchOptimized = false;

  export let open = writable(false);

  let showDialog = false;
  let showContent = false;
  let touchEnabled = false;
  /** @type {string | undefined} */
  let contentType;

  let style = writable({
    inset: undefined,
    zIndex: undefined,
    width: undefined,
    height: undefined,
  });

  $: {
    if (anchor && dialog) {
      ({ open, style } = activatePopup(anchor, dialog, position));
      contentType = anchor.getAttribute('aria-haspopup');
    }
  }

  /**
   *
   */
  const openDialog = () => {
    (document.querySelector('.sui.app-shell') ?? document.body).appendChild(dialog);
    showContent = true;
    dialog.showModal();

    window.requestAnimationFrame(async () => {
      showDialog = true;
      await sleep(100);

      const target = /** @type {HTMLElement} */ (
        content.querySelector('[tabindex]:not([aria-disabled="true"])')
      );

      if (target) {
        target.focus();
      } else {
        content.tabIndex = -1;
        content.focus();
      }
    });
  };

  /**
   *
   */
  const closeDialog = async () => {
    showDialog = false;

    await new Promise((resolve) => {
      content.addEventListener('transitionend', () => resolve(), { once: true });
    });

    showContent = false;
    dialog?.close();
    dialog?.remove();
  };

  /**
   *
   */
  const toggleDialog = () => {
    if (dialog) {
      if ($open) {
        openDialog();
      } else {
        closeDialog();
      }
    }
  };

  $: {
    void $open;
    toggleDialog();
  }

  onMount(() => {
    dialog.remove();

    touchEnabled = window.matchMedia('(pointer: coarse)').matches;

    // onUnmount
    return () => {
      dialog?.close();
      dialog?.remove();
    };
  });
</script>

<dialog
  class="sui popup {className}"
  role="none"
  bind:this={dialog}
  class:touch={touchOptimized && touchEnabled}
  class:open={showDialog}
  {...$$restProps}
>
  <div
    bind:this={content}
    class="content {contentType}"
    style:inset={$style.inset}
    style:z-index={$style.zIndex}
    style:min-width={$style.width}
    style:max-height={$style.height}
    style:visibility={$style.inset ? undefined : 'hidden'}
  >
    {#if keepContent || showContent}
      <slot />
    {/if}
  </div>
</dialog>

<style lang="scss">
  .popup {
    &.touch {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--sui-popup-backdrop-color);

      .content {
        position: static;
        border-width: 0 !important;
        border-radius: 4px !important;
        padding: 8px;
        min-width: 320px !important;
        max-width: calc(100vw - 32px) !important;
        max-height: calc(100vh - 32px) !important;
      }

      &.open {
        .content {
          transform: scale(100%) !important;
        }
      }

      &:not(.open) {
        .content {
          transform: scale(90%);
        }
      }

      &.combobox {
        :global(.sui.listbox) {
          gap: 4px;
          padding: 8px 4px !important;
        }
      }
    }

    &.open {
      .content {
        opacity: 1;
        transform: translateY(2px);
        transition-duration: 100ms;
      }
    }

    &:not(.open) {
      pointer-events: none;

      .content {
        opacity: 0;
        transform: translateY(-8px);
        pointer-events: none;
        transition-duration: 200ms;
      }
    }
  }

  .content {
    position: fixed;
    overflow-y: auto;
    outline-width: 0 !important;
    color: var(--sui-primary-foreground-color);
    background-color: var(--sui-secondary-background-color-translucent);
    -webkit-backdrop-filter: blur(16px);
    backdrop-filter: blur(16px);
    box-shadow: 0 8px 16px var(--sui-popup-shadow-color);
    will-change: opacity, transform;
    transition-property: opacity, transform;

    &.listbox,
    &.menu {
      border-width: 1px;
      border-style: solid;
      border-color: var(--sui-secondary-border-color);
      border-radius: 4px;

      :global(.sui.listbox),
      :global(.sui.menu) {
        border-width: 0;
        border-radius: 0;
        background-color: transparent;
      }
    }
  }
</style>
