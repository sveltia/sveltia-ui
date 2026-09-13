<!--
  @component
  Test fixture: a `<Popup>` attached to a plain anchor button, standing in for what `<Button>` and
  `<MenuButton>` do.
-->
<script>
  import Popup from './popup.svelte';

  /**
   * @import { PopupPosition } from '$lib/typedefs';
   */

  /**
   * @type {{
   * open?: boolean,
   * hovered?: boolean,
   * position?: PopupPosition,
   * touchOptimized?: boolean,
   * showBackdrop?: boolean,
   * onOpen?: (event: CustomEvent) => void,
   * withTabStop?: boolean,
   * hasPopup?: boolean,
   * }}
   */
  let {
    /* eslint-disable prefer-const */
    open = $bindable(false),
    hovered = $bindable(false),
    position = 'bottom-left',
    touchOptimized = false,
    showBackdrop = undefined,
    onOpen = undefined,
    withTabStop = true,
    hasPopup = true,
    /* eslint-enable prefer-const */
  } = $props();

  /** @type {HTMLButtonElement | undefined} */
  let anchor = $state();
</script>

<button bind:this={anchor} aria-haspopup={hasPopup ? 'menu' : undefined}>Anchor</button>
<Popup {anchor} {position} {touchOptimized} {showBackdrop} bind:open bind:hovered {onOpen}>
  {#if withTabStop}
    <div role="menu" tabindex="-1" class="list">
      <div role="menuitem" tabindex="0" class="item">Item</div>
    </div>
  {:else}
    <p class="plain">Plain content</p>
  {/if}
</Popup>
