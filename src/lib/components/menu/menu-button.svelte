<!--
  @component
  A button to open a `<Menu>` widget.
  @see https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
-->
<script>
  import Button from '../button/button.svelte';
  import Popup from '../util/popup.svelte';

  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };

  /**
   * Where to show the dropdown menu.
   * @type {PopupPosition}
   */
  export let popupPosition = 'bottom-left';

  /** @type {?Button} */
  let buttonComponent;
  /** @type {?Popup} */
  let popupComponent;
</script>

<Button
  class="sui menu-button {className}"
  aria-haspopup="menu"
  {...$$restProps}
  bind:this={buttonComponent}
>
  <slot name="start-icon" slot="start-icon" />
  <slot />
  <slot name="end-icon" slot="end-icon" />
</Button>

<Popup anchor={buttonComponent?.element} position={popupPosition} bind:this={popupComponent}>
  <slot name="popup" />
</Popup>
