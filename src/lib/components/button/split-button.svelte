<!--
  @component
  A combination of a normal `<Button>` (default action) and an arrow-only `<MenuButton>` (different
  actions). For example, Microsoft Word has the Paste button along with the Keep Source Formatting,
  Match Formatting and Keep Text Only options.
  @see https://www.google.com/search?q=split+button&tbm=isch
-->
<script>
  import { _ } from 'svelte-i18n';
  import Icon from '../icon/icon.svelte';
  import MenuButton from '../menu/menu-button.svelte';
  import Button from './button.svelte';

  /**
   * @import { Snippet } from 'svelte';
   * @import { ButtonProps, CommonEventHandlers, PopupPosition } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {PopupPosition} [popupPosition] Where to show the dropdown menu.
   * @property {boolean} [showPopupBackdrop] Whether to show the backdrop for the popup.
   * @property {Snippet} [chevronIcon] Chevron slot content.
   * @property {Snippet} [popup] Popup slot content.
   */

  /**
   * @type {ButtonProps & CommonEventHandlers & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    hidden = false,
    disabled = false,
    label = '',
    variant = undefined,
    size = 'medium',
    popupPosition = 'bottom-left',
    showPopupBackdrop = false,
    chevronIcon,
    popup: _popup,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /**
   * @type {HTMLElement | undefined}
   */
  let wrapper = $state();
</script>

<div
  bind:this={wrapper}
  role="group"
  class="sui split-button"
  {hidden}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-label={$_('_sui.split_button.x_options', { values: { name: label } })}
>
  <Button {...restProps} {hidden} {disabled} {label} {variant} {size}></Button>
  <MenuButton
    iconic
    {hidden}
    {disabled}
    {variant}
    {size}
    aria-label={$_('_sui.split_button.more_options')}
    {popupPosition}
    popupPositionBaseElement={wrapper}
    {showPopupBackdrop}
  >
    {#snippet endIcon()}
      {#if chevronIcon}
        {@render chevronIcon()}
      {:else}
        <Icon name="arrow_drop_down" class="small-arrow" />
      {/if}
    {/snippet}
    {#snippet popup()}
      {@render _popup?.()}
    {/snippet}
  </MenuButton>
</div>

<style lang="scss">
  .split-button {
    flex: none;
    display: inline-flex;
    margin: var(--sui-focus-ring-width);

    :global(button) {
      margin: 0;
    }

    :global(button:not(.menu-button)) {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }

    :global(button.menu-button) {
      border-left-width: 0;
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      aspect-ratio: 3 / 4;
    }
  }
</style>
