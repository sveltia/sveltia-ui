<!--
  @component
  The equivalent of the HTML `<tr>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr
  @see https://w3c.github.io/aria/#row
-->
<script>
  /**
   * The `class` attribute on the wrapper element.
   * @type {string}
   */
  let className = '';
  export { className as class };
  /**
   * Whether to select the widget. An alias of the `aria-selected` attribute.
   * @type {boolean}
   */
  export let selected = false;
</script>

<div
  class="sui table-row {className}"
  role="row"
  tabindex="0"
  aria-selected={selected}
  {...$$restProps}
  on:click
  on:select
>
  <slot />
</div>

<style lang="scss">
  .table-row {
    display: table-row;
    height: var(--sui-primary-row-height);
  }
</style>
