<script>
  /**
   * CSS class name on the button.
   * @type {String}
   */
  // eslint-disable-next-line padding-line-between-statements
  let className = '';

  export { className as class };
</script>

<div role="gridcell" class="sui grid-cell {className}" {...$$restProps}>
  <slot />
</div>
