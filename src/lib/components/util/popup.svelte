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
  import Modal from './modal.svelte';

  /**
   * The `class` attribute on the content element.
   * @type {string}
   */
  let className = '';
  export { className as class };
  /**
   * Whether to open the popup.
   * @type {import('svelte/store').Writable<boolean>}
   */
  export let open = writable(false);
  /**
   * A reference to the anchor element that opens the popup. Typically a `<button>`.
   * @type {HTMLElement}
   */
  export let anchor;
  /**
   * A reference to the content element.
   * @type {HTMLElement}
   */
  export let content = undefined;
  /**
   * Where to show the popup.
   * @type {PopupPosition}
   */
  export let position = 'bottom-left';
  /**
   * Whether to show the popup at the center of the screen on mobile/tablet and ignore the defined
   * dropdown `position`.
   * @type {boolean}
   */
  export let touchOptimized = false;

  /**
   * A reference to the modal component.
   * @type {Modal}
   */
  let modal;
  /**
   * Whether the touch is enabled on the user device.
   * @type {boolean}
   */
  let touchEnabled = false;
  /**
   * The type of the content displayed in the popup, defined with the `aria-haspopup` attribute on
   * the anchor element.
   * @type {string}
   * @see https://w3c.github.io/aria/#aria-haspopup
   */
  let contentType;
  /**
   * Style to be applied to the content.
   * @type {import('svelte/store').Writable<any>}
   */
  let style = writable({
    inset: undefined,
    zIndex: undefined,
    width: undefined,
    height: undefined,
  });

  $: {
    if (anchor && modal?.dialog) {
      ({ open, style } = activatePopup(anchor, modal.dialog, position));
      contentType = anchor.getAttribute('aria-haspopup');
    }
  }

  $: touch = touchOptimized && touchEnabled;

  onMount(() => {
    touchEnabled = window.matchMedia('(pointer: coarse)').matches;
  });
</script>

<Modal
  role="none"
  class="popup"
  bind:open={$open}
  showBackdrop={touch}
  lightDismiss={true}
  keepContent={true}
  bind:this={modal}
  {...$$restProps}
  on:opening
  on:open
  on:ok
  on:cancel
  on:closing
  on:close
  on:open={async () => {
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
  }}
>
  <div
    role="none"
    class="content {className} {contentType}"
    class:touch
    style:inset={$style.inset}
    style:z-index={$style.zIndex}
    style:min-width={$style.width}
    style:max-height={$style.height}
    style:visibility={$style.inset ? undefined : 'hidden'}
    bind:this={content}
  >
    <slot />
  </div>
</Modal>

<style lang="scss">
  .content {
    position: absolute;
    overflow-y: auto;
    outline-width: 0 !important;
    color: var(--sui-primary-foreground-color);
    background-color: var(--sui-secondary-background-color-translucent);
    box-shadow: 0 8px 16px var(--sui-popup-shadow-color);
    -webkit-backdrop-filter: blur(16px);
    backdrop-filter: blur(16px);
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

    &.touch {
      position: static;
      border-width: 0 !important;
      border-radius: 4px !important;
      padding: 8px;
      min-width: 320px !important;
      max-width: calc(100dvw - 32px) !important;
      max-height: calc(100dvh - 32px) !important;

      :global(dialog.open) & {
        transform: scale(100%) !important;
      }

      :global(dialog:not(.open)) & {
        transform: scale(90%);
      }

      &.combobox {
        :global(.sui.listbox) {
          gap: 4px;
          padding: 8px 4px !important;
        }
      }
    }

    :global(dialog.open) & {
      transition-duration: 150ms;
      opacity: 1;
      transform: translateY(2px);
    }

    :global(dialog:not(.open)) & {
      transition-duration: 300ms;
      opacity: 0;
      transform: translateY(-8px);
    }
  }
</style>
