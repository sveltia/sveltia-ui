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
   * Text label displayed on the button.
   * @type {string}
   */
  export let label = '';
  /**
   * The style variant of the button.
   * @type {'primary' | 'secondary' | 'tertiary' | 'ghost' | undefined}
   */
  export let variant = undefined;
  /**
   * The size of the button.
   * @type {'small' | 'medium' | 'large' | undefined}
   */
  export let size = 'medium';
  /**
   * Where to show the dropdown menu.
   * @type {import('$lib/typedefs').PopupPosition}
   */
  export let popupPosition = 'bottom-left';
  /**
   * Whether to show the backdrop for the popup.
   * @type {boolean}
   */
  export let showPopupBackdrop = false;

  /**
   * @type {HTMLElement | undefined}
   */
  let wrapper;
</script>

<div
  role="group"
  class="sui split-button"
  hidden={hidden || undefined}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-label={$_('_sui.split_button.x_options', { values: { name: label } })}
  bind:this={wrapper}
>
  <Button class={className} {hidden} {disabled} {label} {variant} {size} {...$$restProps} on:click>
    <slot name="start-icon" slot="start-icon" />
  </Button>
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
    <slot name="chevron-icon" slot="end-icon">
      <Icon name="arrow_drop_down" class="small-arrow" />
    </slot>
    <slot name="popup" slot="popup" />
  </MenuButton>
</div>

<style lang="scss">
  .split-button {
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
