<!--
  @component
  The interactive version of `<Table>`.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table
  @see https://w3c.github.io/aria/#grid
-->
<script>
  import { activateGroup } from '../../services/group';

  /**
   * The `class` attribute on the wrapper element.
   * @type {string}
   */
  let className = '';
  export { className as class };
  /**
   * Whether to allow selecting more than one `<GridRow>` and/or `<GridCell>`. An alias of the
   * `aria-multiselectable` attribute.
   * @type {boolean}
   */
  export let multiple = false;

  /** @type {HTMLElement?} */
  export let element = undefined;
</script>

<div
  role="grid"
  class="sui grid {className}"
  aria-multiselectable={multiple}
  {...$$restProps}
  bind:this={element}
  use:activateGroup
  on:change
>
  <slot />
</div>

<style lang="scss">
  .grid {
    display: table;
    width: 100%;

    &:global(.data) {
      border-collapse: collapse;

      :global(.grid-col-header),
      :global(.grid-row-header),
      :global(.grid-cell) {
        border: 1px solid var(--sui-secondary-border-color);
        padding: 8px 8px;
      }
    }
  }
</style>
