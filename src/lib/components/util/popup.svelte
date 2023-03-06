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

  let showContent = false;
  let showContentTimer = 0;

  let style = writable({
    inset: undefined,
    zIndex: undefined,
    width: undefined,
    height: undefined,
  });

  $: {
    if (anchor && dialog) {
      ({ open, style } = activatePopup(anchor, dialog, position));
    }
  }

  $: {
    if (dialog) {
      if ($open) {
        window.clearTimeout(showContentTimer);
        showContent = true;

        dialog.showModal();
      } else {
        showContentTimer = window.setTimeout(() => {
          showContent = false;
        }, 500);

        dialog.close();
      }
    }
  }

  onMount(() => {
    // Avoid nested dialogs
    (document.querySelector('.sui.app-shell') || document.body).appendChild(dialog);
  });
</script>

<dialog class="sui popup" bind:this={dialog} class:open={$open}>
  <!-- Prevent the first item in the slot, e.g. a menu item, from being focused by adding `tabindex`
    to the container -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <div
    tabindex="0"
    class="content"
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
    .content {
      outline-width: 0 !important;
    }

    &:not(.open) {
      pointer-events: none;

      .content {
        opacity: 0;
        transform: translateY(-8px);
        pointer-events: none;
      }
    }
  }

  .content {
    position: fixed;
    overflow-y: auto;
    color: var(--primary-foreground-color);
    background-color: var(--secondary-background-color);
    backdrop-filter: blur(16px);
    box-shadow: 0 8px 16px var(--popup-shadow-color);
    will-change: opacity, transform;
    transform: translateY(2px);
    transition-property: opacity, transform;
    transition-duration: 200ms;
    // Add .1s delay before the position can be determined
    transition-delay: 100ms;
  }
</style>
