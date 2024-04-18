<!--
  @component
  A select-only variant of `<Combobox>`. The equivalent of the HTML `<select>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select
  @see https://w3c.github.io/aria/#combobox
  @see https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/
-->
<script>
  import Combobox from '$lib/components/select/combobox.svelte';

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
   * Whether to make the widget read-only. An alias of the `aria-readonly` attribute.
   * @type {boolean}
   */
  export let readonly = false;
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
  {readonly}
  {required}
  {invalid}
  {...$$restProps}
  editable={false}
  on:change
>
  <slot />
</Combobox>
