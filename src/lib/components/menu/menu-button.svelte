<!--
  @component
  A button to open a `<Menu>` widget.
  @see https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
-->
<script>
  import Button from '../button/button.svelte';
  import Popup from '../util/popup.svelte';

  /**
   * The `class` attribute on the `<button>` element.
   * @type {string}
   */
  let className = '';
  export { className as class };
  /**
   * Whether to hide the widget. An alias of the `aria-hidden` attribute.
   * @type {boolean | undefined}
   */
  export let hidden = undefined;
  /**
   * Whether to disable the widget. An alias of the `aria-disabled` attribute.
   * @type {boolean}
   */
  export let disabled = false;
  /**
   * Where to show the dropdown menu.
   * @type {PopupPosition}
   */
  export let popupPosition = 'bottom-left';
  /**
   * Text label displayed on the item.
   * @type {string | undefined}
   */
  export let label = '';

  /**
   * Reference to the `Button` component.
   * @type {Button | undefined}
   */
  let buttonComponent;
  /**
   * Reference to the `Popup` component.
   * @type {Popup | undefined}
   */
  let popupComponent;
</script>

<Button
  class="sui menu-button {className}"
  {label}
  {hidden}
  {disabled}
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
