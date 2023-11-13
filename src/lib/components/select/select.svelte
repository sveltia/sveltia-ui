<!--
  @component
  A read-only variant of `<Combobox>`. The equivalent of the HTML `<select>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select
  @see https://w3c.github.io/aria/#combobox
-->
<script>
  import Combobox from './combobox.svelte';

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
   * Whether to disable the widget. An alias of the `aria-required` attribute.
   * @type {boolean}
   */
  export let required = false;
  /**
   * Whether to mark the widget invalid. An alias of the `aria-invalid` attribute.
   * @type {boolean}
   */
  export let invalid = false;
  /**
   * Text label displayed on the readonly item.
   * @type {string}
   */
  export let label = '';
  /**
   * Selected option’s value.
   * @type {(string | number | undefined)}
   */
  export let value = undefined;
</script>

<Combobox
  bind:value
  class="sui select {className}"
  {hidden}
  {disabled}
  readonly={true}
  {required}
  {invalid}
  {label}
  {...$$restProps}
  on:change
>
  <slot />
</Combobox>
