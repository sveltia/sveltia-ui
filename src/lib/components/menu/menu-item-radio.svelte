<!--
  @component
  A menu item widget with a radio. Only one item can be selected within the parent `<Menu>` or
  `<MenuItemGroup>` component.
  @see https://w3c.github.io/aria/#menuitemradio
-->
<script>
  import Icon from '../icon/icon.svelte';
  import MenuItem from './menu-item.svelte';

  /**
   * The `class` attribute on the wrapper element.
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
   * Whether to check the widget. An alias of the `aria-checked` attribute.
   * @type {boolean}
   */
  export let checked = false;
  /**
   * Text label displayed on the item.
   * @type {string | undefined}
   */
  export let label = '';
  /**
   * Name of `<Icon>` displayed before the label.
   */
  export let iconName = '';
  /**
   * ARIA label of `<Icon>` displayed before the label.
   */
  export let iconLabel = '';
</script>

<MenuItem
  role="menuitemradio"
  class="sui menu-item-radio {className}"
  {label}
  {hidden}
  {disabled}
  aria-checked={checked}
  {iconName}
  {iconLabel}
  {...$$restProps}
  on:click
  on:select
  on:change
  on:change={(event) => {
    checked = /** @type {CustomEvent} */ (event).detail.checked;
  }}
>
  <slot />
  <svelte:component this={checked ? Icon : undefined} slot="end-icon" name="check" />
</MenuItem>
