<!--
  @component
  A button to open a `<Menu>` widget.
  @see https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
-->
<script>
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';
  import Popup from '../util/popup.svelte';

  /**
   * @typedef {object} Props
   * @property {HTMLElement} [popupPositionBaseElement] - The base element of
   * {@link popupPosition}. If omitted, this will be {@link buttonComponent}.
   */

  /**
   * @type {import('$lib/typedefs').ButtonProps & import('$lib/typedefs').CommonEventHandlers &
   * Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    hidden = false,
    disabled = false,
    popupPosition = 'bottom-left',
    popupPositionBaseElement = undefined,
    showPopupBackdrop = false,
    label = '',
    variant = undefined,
    size = 'medium',
    iconic = false,
    children: _children,
    startIcon: _startIcon,
    endIcon: _endIcon,
    popup,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /**
   * Reference to the `<button>` element.
   * @type {HTMLButtonElement | undefined}
   */
  let buttonElement = $state();

  /**
   * Move focus to the `<button>` element.
   */
  export const focus = () => {
    buttonElement?.focus();
  };
</script>

<div role="none" class="wrapper">
  <Button
    {...restProps}
    bind:element={buttonElement}
    class="sui menu-button {className}"
    {hidden}
    {disabled}
    {label}
    {variant}
    {size}
    {iconic}
    aria-haspopup="menu"
  >
    {#snippet startIcon()}
      {@render _startIcon?.()}
    {/snippet}
    {#snippet children()}
      {@render _children?.()}
    {/snippet}
    {#snippet endIcon()}
      {#if _endIcon}
        {@render _endIcon()}
      {:else if iconic}
        <Icon name="more_vert" />
      {:else}
        <Icon name="arrow_drop_down" class="small-arrow" />
      {/if}
    {/snippet}
  </Button>
</div>

<Popup
  anchor={buttonElement}
  position={popupPosition}
  positionBaseElement={popupPositionBaseElement}
  showBackdrop={showPopupBackdrop}
>
  {@render popup?.()}
</Popup>
