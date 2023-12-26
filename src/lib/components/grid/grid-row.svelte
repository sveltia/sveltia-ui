<!--
  @component
  The interactive version of `<TableRow>`.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr
  @see https://w3c.github.io/aria/#row
-->
<script>
  import { createEventDispatcher } from 'svelte';

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

  const dispatch = createEventDispatcher();
</script>

<div
  role="row"
  class="sui grid-row {className}"
  tabindex="0"
  aria-selected={selected}
  {...$$restProps}
  on:click
  on:select={(event) => dispatch('select', event)}
  on:change={(event) => dispatch('change', event)}
>
  <slot />
</div>

<style lang="scss">
  .grid-row {
    display: table-row;
    height: var(--sui-primary-row-height);
  }
</style>
