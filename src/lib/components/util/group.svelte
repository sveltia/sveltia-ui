<!--
  @component
  A generic group layout.
  @see https://w3c.github.io/aria/#group
-->
<script>
  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };

  export let ariaLabel = '';
</script>

<div
  class="sui group {className}"
  role="group"
  aria-label={ariaLabel || undefined}
  {...$$restProps}
>
  <slot />
</div>
