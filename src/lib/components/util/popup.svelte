<!--
  @component
  Generic popup helper.
-->
<svelte:options accessors={true} />

<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { activatePopup } from '../helpers/popup';

  /** @type {(HTMLElement|undefined)} */
  export let anchor = undefined;

  /**
   * Reference to the popup element.
   * @type {(HTMLElement|undefined)}
   */
  export let dialog = undefined;

  /**
   * Where to show the dropdown menu.
   * @type {PopupPosition}
   */
  export let position = 'bottom-left';

  export let open = writable(false);

  let showDialog = false;
  let showContent = false;
  let contentType;
  let closeDialogTimer = 0;

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

  const openDialog = () => {
    window.clearTimeout(closeDialogTimer);
    (document.querySelector('.sui.app-shell') || document.body).appendChild(dialog);
    showContent = true;
    dialog.showModal();

    window.requestAnimationFrame(() => {
      showDialog = true;
    });
  };

  const closeDialog = () => {
    showDialog = false;

    closeDialogTimer = window.setTimeout(() => {
      showContent = false;
      dialog?.close();
      dialog?.remove();
    }, 500);
  };

  $: {
    if (dialog) {
      if ($open) {
        openDialog();
      } else {
        closeDialog();
      }
    }
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

<dialog class="sui popup" bind:this={dialog} class:open={showDialog} {...$$restProps}>
  <!-- Prevent the first item in the slot, e.g. a menu item, from being focused by adding `tabindex`
    to the container -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <div
    tabindex="0"
    class="content {contentType}"
    style:inset={$style.inset}
    style:z-index={$style.zIndex}
    style:min-width={$style.width}
    style:max-height={$style.height}
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
    color: var(--primary-foreground-color);
    background-color: var(--secondary-background-color-translucent);
    backdrop-filter: blur(16px);
    box-shadow: 0 8px 16px var(--popup-shadow-color);
    will-change: opacity, transform;
    transition-property: opacity, transform;

    &.listbox,
    &.menu {
      border-width: 1px;
      border-style: solid;
      border-color: var(--secondary-border-color);
      border-radius: 4px;

      :global(.sui.listbox),
      :global(.sui.menu) {
        border-width: 0;
        border-radius: 0;
      }
    }
  }
</style>
