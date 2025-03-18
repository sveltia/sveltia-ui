<!--
  @component
  A Material Symbols icon.
  @see https://developers.google.com/fonts/docs/material_symbols
-->
<script>
  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the `span` element.
   * @property {string} [name] Icon name, e.g. `search`, `expand_more`, `close`, etc.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    name,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<span
  {...restProps}
  class="sui icon material-symbols-outlined {className}"
  aria-hidden={!('aria-label' in restProps)}
>
  {name}
</span>

<style lang="scss">
  .icon.small-arrow {
    overflow: hidden;
    width: 12px;
    text-indent: -6px;
  }
</style>
