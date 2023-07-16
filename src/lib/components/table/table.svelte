<!--
  @component
  The equivalent of the HTML `<table>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table
  @see https://w3c.github.io/aria/#grid
-->
<script>
  import { activateGroup } from '../util/group';

  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };

  /** @type {HTMLElement?} */
  export let element = undefined;
</script>

<div
  role="grid"
  class="sui table {className}"
  {...$$restProps}
  bind:this={element}
  use:activateGroup
>
  <slot />
</div>

<style lang="scss">
  .table {
    display: table;
    width: 100%;

    &:global(.data) {
      border-collapse: collapse;

      :global(.table-col-header),
      :global(.table-row-header),
      :global(.table-cell) {
        border: 1px solid var(--sui-secondary-border-color);
        padding: 8px 8px;
      }
    }
  }
</style>
