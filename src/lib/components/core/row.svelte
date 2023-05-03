<script>
  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };
</script>

<div role="row" tabindex="0" class="sui row {className}" {...$$restProps} on:click>
  <slot />
</div>
