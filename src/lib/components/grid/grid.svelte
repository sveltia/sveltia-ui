<!--
  @component
  The interactive version of `<Table>`.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table
  @see https://w3c.github.io/aria/#grid
-->
<script>
  import { activateGroup } from '../../services/group.svelte';

  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {boolean} [selected] Whether to allow selecting more than one `<GridRow>` and/or
   * `<GridCell>`. An alias of the `aria-multiselectable` attribute.
   * @property {boolean} [clickToSelect] Whether to select a row by clicking on it.
   * @property {HTMLElement} [element] A reference to the wrapper element.
   * @property {Snippet} [children] Primary slot content.
   * @property {(event: CustomEvent) => void} [onChange] Custom `Change` event handler.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    element = $bindable(),
    class: className,
    multiple = false,
    clickToSelect = true,
    children,
    onChange,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<div
  bind:this={element}
  {...restProps}
  role="grid"
  class="sui grid {className}"
  aria-multiselectable={multiple}
  onChange={(/** @type {CustomEvent} */ event) => {
    onChange?.(event);
  }}
  use:activateGroup={{ clickToSelect }}
>
  {@render children?.()}
</div>

<style lang="scss">
  .grid {
    display: table;
    margin: var(--sui-focus-ring-width);
    width: calc(100% - var(--sui-focus-ring-width) * 2);

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
