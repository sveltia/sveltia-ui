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
   * withSearch?: boolean,
   * lateTabStop?: boolean,
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
    withSearch = false,
    lateTabStop = false,
    hasPopup = true,
    /* eslint-enable prefer-const */
  } = $props();

  /** @type {HTMLButtonElement | undefined} */
  let anchor = $state();
</script>

<button bind:this={anchor} aria-haspopup={hasPopup ? 'menu' : undefined}>Anchor</button>
<Popup {anchor} {position} {touchOptimized} {showBackdrop} bind:open bind:hovered {onOpen}>
  {#if withSearch}
    <input type="search" tabindex="0" aria-label="Search" class="search" />
    <div role="listbox" tabindex="0" class="list" aria-label="Options"></div>
  {:else if lateTabStop}
    <!-- Like a menu, whose items only get their tab stop once the group has been activated -->
    <div
      role="menu"
      tabindex="-1"
      class="list"
      {@attach (menu) => {
        const timer = setTimeout(() => {
          menu.querySelector('.item')?.setAttribute('tabindex', '0');
        }, 50);

        return () => clearTimeout(timer);
      }}
    >
      <button role="menuitem" class="other">Other</button>
      <button role="menuitem" class="item">Item</button>
    </div>
  {:else if withTabStop}
    <div role="menu" tabindex="-1" class="list">
      <div role="menuitem" tabindex="0" class="item">Item</div>
    </div>
  {:else}
    <p class="plain">Plain content</p>
  {/if}
</Popup>
