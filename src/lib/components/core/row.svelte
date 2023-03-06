<script>
  /**
   * CSS class name on the button.
   * @type {String}
   */
  // eslint-disable-next-line padding-line-between-statements
  let className = '';

  export { className as class };
</script>

<div role="row" tabindex="0" class="sui row {className}" {...$$restProps} on:click>
  <slot />
</div>
