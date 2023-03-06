<script>
  /**
   * CSS class name on the button.
   * @type {String}
   */
  // eslint-disable-next-line padding-line-between-statements
  let className = 'tbody';

  export { className as class };
</script>

<div role="rowgroup" class="sui row-group {className}" {...$$restProps}>
  <slot />
</div>
