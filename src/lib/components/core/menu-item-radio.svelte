<!--
  @component
  @see https://w3c.github.io/aria/#menuitemradio
-->
<script>
  import MenuItem from './menu-item.svelte';

  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };
</script>

<MenuItem class="sui menu-item-radio {className}" role="menuitemradio" {...$$restProps} on:click>
  <slot />
</MenuItem>
