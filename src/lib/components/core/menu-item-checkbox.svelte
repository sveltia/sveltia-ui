<!--
  @component
  @see https://w3c.github.io/aria/#menuitemcheckbox
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

<MenuItem
  class="sui menu-item-checkbox {className}"
  role="menuitemcheckbox"
  {...$$restProps}
  on:click
>
  <slot />
</MenuItem>
