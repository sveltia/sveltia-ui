<script>
  /**
   * CSS class name on the button.
   * @type {String}
   */
  let className = '';

  export { className as class };

  export let name = '';

  export let label = '';
</script>

<span
  class="sui icon material-symbols-outlined {className}"
  aria-label={label || undefined}
  aria-hidden={label ? undefined : true}
>
  {name}
</span>
