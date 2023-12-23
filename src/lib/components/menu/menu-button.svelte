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
   * The base element of {@link popupPosition}. If omitted, this will be {@link buttonComponent}.
   * @type {HTMLElement | undefined}
   */
  export let popupPositionBaseElement = undefined;
  /**
   * Text label displayed on the button.
   * @type {string}
   */
  export let label = '';
  /**
   * The style variant of the button.
   * @type {'primary' | 'secondary' | 'tertiary' | 'ghost' | 'link' | undefined}
   */
  export let variant = undefined;
  /**
   * The size of the button.
   * @type {'small' | 'medium' | 'large'}
   */
  export let size = 'medium';
  /**
   * Whether to only show an icon on the button and trim the padding.
   */
  export let iconic = false;

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

  /**
   * Move focus to the `<button>` element.
   */
  export const focus = () => {
    buttonComponent?.element?.focus();
  };
</script>

<div role="none" class="wrapper">
  <Button
    class="sui menu-button {className}"
    {hidden}
    {disabled}
    {label}
    {variant}
    {size}
    {iconic}
    aria-haspopup="menu"
    {...$$restProps}
    bind:this={buttonComponent}
  >
    <slot name="start-icon" slot="start-icon" />
    <slot />
    <slot name="end-icon" slot="end-icon" />
  </Button>
</div>

<Popup
  anchor={buttonComponent?.element}
  position={popupPosition}
  positionBaseElement={popupPositionBaseElement}
  bind:this={popupComponent}
>
  <slot name="popup" />
</Popup>

<style lang="scss">
  .wrapper {
    display: contents;

    :global(.label + .icon:last-child) {
      margin: 0 -2px;
      font-size: 20px;
    }
  }
</style>
