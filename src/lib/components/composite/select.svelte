<!--
  @component
  A read-only variant of `<Combobox>`.
-->
<script>
  import Combobox from './combobox.svelte';

  /**
   * CSS class name on the button.
   * @type {String}
   */
  let className = '';

  export { className as class };

  export let label = '';

  /**
   * Selected option’s value.
   * @type {(String|undefined)}
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
