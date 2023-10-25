<!--
  @component
  Generic popup helper.
-->
<svelte:options accessors={true} />

<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { activatePopup } from './popup';
  import { sleep } from './util';

  /** @type {HTMLElement?} */
  export let anchor = undefined;

  /**
   * Reference to the popup element.
   * @type {HTMLDialogElement?}
   */
  export let dialog = undefined;

  /**
   * Reference to the content element.
   * @type {HTMLElement?}
   */
  export let content = undefined;

  /**
   * Where to show the dropdown menu.
   * @type {PopupPosition}
   */
  export let position = 'bottom-left';

  export let open = writable(false);

  let showDialog = false;
  let showContent = false;
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
    (document.querySelector('.sui.app-shell') || document.body).appendChild(dialog);
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

  // Call the function only when the `$open` prop is changed
  // @ts-ignore
  $: toggleDialog($open);

  onMount(() => {
    dialog.remove();

    // onUnmount
    return () => {
      dialog?.close();
      dialog?.remove();
    };
  });
</script>

<dialog class="sui popup" bind:this={dialog} class:open={showDialog} {...$$restProps}>
  <div
    bind:this={content}
    class="content {contentType}"
    style:inset={$style.inset}
    style:z-index={$style.zIndex}
    style:min-width={$style.width}
    style:max-height={$style.height}
    style:visibility={$style.inset ? undefined : 'hidden'}
  >
    {#if showContent}
      <slot />
    {/if}
  </div>
</dialog>

<style lang="scss">
  .popup {
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
      }
    }
  }
</style>
