<!--
  @component
  Generic popup helper.
-->
<script>
  import { sleep } from '@sveltia/utils/misc';
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { activatePopup } from '../../services/popup.svelte.js';
  import Modal from './modal.svelte';

  /**
   * @typedef {object} Props
   * @property {string} [class] - The `class` attribute on the content element.
   * @property {boolean} [open] - Whether to open the popup.
   * @property {boolean} [hovered] - Whether the content is hovered.
   * @property {HTMLElement} [anchor] - A reference to the anchor element that opens the popup.
   * Typically a `<button>`.
   * @property {HTMLElement} [content] - A reference to the content element.
   * @property {import('$lib/typedefs').PopupPosition} [position] - Where to show the popup.
   * @property {HTMLElement} [positionBaseElement] - The base element of {@link position}. If
   * omitted, this will be {@link anchor}.
   * @property {HTMLDialogElement} [parentDialogElement] - A reference to a dialog element that is
   * already displayed. This should be provided for a nested popup.
   * @property {boolean} [touchOptimized] - Whether to show the popup at the center of the screen on
   * mobile/tablet and ignore the defined dropdown `position`.
   * @property {import('svelte').Snippet} [children] - Primary slot content.
   * @property {import('svelte').Snippet} [extraContent] - Extra slot content.
   * @property {(event: CustomEvent) => void} [onOpen] - Custom `Open` event handler.
   */

  /**
   * @type {import('$lib/typedefs').ModalProps & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    open = $bindable(false),
    hovered = $bindable(false),
    content = $bindable(undefined),
    class: className,
    showBackdrop = false,
    anchor,
    position = 'bottom-left',
    positionBaseElement = undefined,
    parentDialogElement = undefined,
    touchOptimized = false,
    children,
    onOpen,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /**
   * @type {boolean}
   */
  let initialized = $state(false);
  /**
   * A reference to the `<dialog>` element.
   * @type {HTMLDialogElement | undefined}
   */
  let dialogElement = $state();
  /**
   * Whether the touch is enabled on the user device.
   * @type {boolean}
   */
  let touchEnabled = $state(false);
  /**
   * The type of the content displayed in the popup, defined with the `aria-haspopup` attribute on
   * the anchor element.
   * @type {string | undefined}
   * @see https://w3c.github.io/aria/#aria-haspopup
   */
  let contentType = $state();
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

  let hoveredTimeout = 0;

  /**
   * Initialize the popup.
   */
  const init = () => {
    let openStore = writable(false);

    ({ style, open: openStore } = activatePopup(
      anchor,
      dialogElement,
      position,
      positionBaseElement,
    ));

    openStore.subscribe((_open) => {
      open = _open;
    });

    contentType = anchor?.getAttribute('aria-haspopup') ?? undefined;
    initialized = true;
  };

  $effect(() => {
    if (parentDialogElement && !dialogElement && content) {
      dialogElement = parentDialogElement;
      dialogElement.append(content);
    }
  });

  $effect(() => {
    if (anchor && dialogElement && !initialized) {
      init();
    }
  });

  const touch = $derived(touchOptimized && touchEnabled);

  onMount(() => {
    touchEnabled = globalThis.matchMedia('(pointer: coarse)').matches;
  });
</script>

{#snippet contentWrapper()}
  <div
    bind:this={content}
    hidden={!open}
    role="none"
    class="content {className} {contentType}"
    class:touch
    style:inset={$style.inset}
    style:z-index={$style.zIndex}
    style:min-width={$style.minWidth}
    style:max-width={$style.maxWidth}
    style:max-height={$style.height}
    style:visibility={$style.inset ? undefined : 'hidden'}
    onmouseenter={() => {
      hovered = true;

      if (parentDialogElement) {
        window.clearTimeout(hoveredTimeout);
      }
    }}
    onmouseleave={() => {
      hovered = false;

      if (parentDialogElement) {
        hoveredTimeout = window.setTimeout(() => {
          open = false;
        }, 200);
      }
    }}
  >
    {@render children?.()}
  </div>
{/snippet}

{#if parentDialogElement}
  {@render contentWrapper()}
{:else}
  <Modal
    {...restProps}
    bind:dialog={dialogElement}
    role="none"
    class="popup"
    bind:open
    showBackdrop={showBackdrop ?? touch}
    lightDismiss={true}
    keepContent={true}
    onOpen={async (event) => {
      onOpen?.(event);

      await sleep(100);

      if (!content) {
        return;
      }

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
    {@render contentWrapper()}
  </Modal>
{/if}

<style lang="scss">
  .content {
    position: absolute;
    overflow-y: auto;
    outline-width: 0 !important;
    width: auto;
    color: var(--sui-primary-foreground-color);
    background-color: var(--sui-secondary-background-color-translucent);
    box-shadow: 0 8px 16px var(--sui-popup-shadow-color);
    -webkit-backdrop-filter: blur(16px);
    backdrop-filter: blur(16px);
    transition-property: opacity, transform;

    &.menu {
      border-width: var(--sui-menu-border-width, 1px);
      border-style: var(--sui-menu-border-style, solid);
      border-color: var(--sui-menu-border-width, var(--sui-secondary-border-color));
      border-radius: var(--sui-menu-border-radius, 4px);
      padding: var(--sui-menu-padding, 4px);

      :global(.sui.menu) {
        border-width: 0;
        border-radius: 0;
        padding: 0;
        background-color: transparent;
      }
    }

    &.listbox {
      border-width: var(--sui-listbox-border-width, 1px);
      border-style: var(--sui-listbox-border-style, solid);
      border-color: var(--sui-listbox-border-width, var(--sui-secondary-border-color));
      border-radius: var(--sui-listbox-border-radius, 4px);
      padding: var(--sui-listbox-padding, 4px);

      :global(.sui.listbox) {
        border-width: 0;
        border-radius: 0;
        padding: 0;
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
      transition-duration: 50ms;
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
