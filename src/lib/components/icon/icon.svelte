<!--
  @component
  A Material Symbols icon.
  @see https://developers.google.com/fonts/docs/material_symbols
-->
<script>
  /**
   * The `class` attribute on the `span` element.
   * @type {string}
   */
  let className = '';
  export { className as class };
  /**
   * Icon name, e.g. `search`, `expand_more`, `close`, etc.
   * @type {string}
   */
  export let name = '';
</script>

<span
  class="sui icon material-symbols-outlined {className}"
  aria-hidden={!('aria-label' in $$restProps)}
  {...$$restProps}
>
  {name}
</span>
