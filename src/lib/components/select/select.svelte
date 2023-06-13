<!--
  @component
  A read-only variant of `<Combobox>`. The equivalent of the HTML `<select>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select
  @see https://w3c.github.io/aria/#combobox
-->
<script>
  import Combobox from './combobox.svelte';

  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };

  export let label = '';

  /**
   * Selected option’s value.
   * @type {string?}
   */
  export let value = undefined;
</script>

<Combobox
  bind:value
  class="sui select {className}"
  {label}
  readOnly={true}
  {...$$restProps}
  on:change
>
  <slot />
</Combobox>
