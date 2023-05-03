<script>
  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = 'tbody';

  export { className as class };
</script>

<div role="rowgroup" class="sui row-group {className}" {...$$restProps}>
  <slot />
</div>
