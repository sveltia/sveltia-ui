<!--
  @component
  A variant of `<RadioButton>`, looking like a normal button.
  @see https://w3c.github.io/aria/#radio
  @see https://w3c.github.io/aria-practices/#radiobutton
-->
<script>
  import Button from './button.svelte';

  /**
   * CSS class name on the button.
   * @type {String}
   */
  let className = '';

  export { className as class };

  export let selected = false;
</script>

<Button
  class="sui select-button {className}"
  role="radio"
  aria-checked={selected}
  {...$$restProps}
  on:click
>
  <slot name="start-icon" slot="start-icon" />
  <slot />
  <slot name="end-icon" slot="end-icon" />
</Button>
