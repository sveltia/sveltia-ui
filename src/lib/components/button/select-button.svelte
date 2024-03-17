<!--
  @component
  A variant of `<Radio>`, looking like a normal button.
  @see https://w3c.github.io/aria/#radio
  @see https://www.w3.org/WAI/ARIA/apg/patterns/radio/
-->
<script>
  import Button from './button.svelte';

  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';
  export { className as class };
  /**
   * The `value` attribute on the `<button>` element.
   * @type {string | undefined}
   */
  export let value = undefined;
  /**
   * Whether to select the widget. An alias of the `aria-checked` attribute.
   * Because the UI is a button, we expose `selected` instead of `checked`.
   * @type {boolean}
   */
  export let selected = false;
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
   * @type {boolean}
   */
  export let iconic = false;
</script>

<Button
  role="radio"
  class="sui select-button {className}"
  {value}
  {hidden}
  {disabled}
  {label}
  {variant}
  {size}
  {iconic}
  aria-checked={selected}
  {...$$restProps}
  on:click
  on:dblclick
  on:select
  on:change
  on:change={(event) => {
    selected = event.detail.selected;
  }}
>
  <slot name="start-icon" slot="start-icon" />
  <slot />
  <slot name="end-icon" slot="end-icon" />
</Button>
