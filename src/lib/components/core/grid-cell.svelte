<script>
  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };
</script>

<div role="gridcell" class="sui grid-cell {className}" {...$$restProps}>
  <slot />
</div>
