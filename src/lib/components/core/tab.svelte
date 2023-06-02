<!--
  @component
  @see https://w3c.github.io/aria/#tab
  @see https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
-->
<script>
  import Button from './button.svelte';

  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };
</script>

<Button role="tab" class="sui tab {className}" {...$$restProps}>
  <slot name="start-icon" slot="start-icon" />
  <slot />
  <slot name="end-icon" slot="end-icon" />
</Button>
