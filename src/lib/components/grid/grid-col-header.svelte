<!--
  @component
  The interactive version of `<TableColHeader>`. With `sortOrder` set, the header becomes sortable:
  its content is wrapped in a button that indicates the current order and requests a new one.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th
  @see https://w3c.github.io/aria/#columnheader
  @see https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/
-->
<script>
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';
  import TablePart from '../table/table-part.svelte';

  /**
   * @import { Snippet } from 'svelte';
   * @import { Attachment } from 'svelte/attachments';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {'ascending' | 'descending' | 'none'} [sortOrder] The order the column is sorted in,
   * or `none` if it can be sorted but currently isn’t. An alias of the `aria-sort` attribute, which
   * is only set on the sorted column, as the sortable table pattern recommends. When set, the
   * content is rendered in a button that requests a new order with `onSort`; the button covers the
   * whole cell, padding included. Leave it out for a header that can’t be sorted.
   * @property {Snippet} [children] Primary slot content.
   * @property {(event: CustomEvent<{ sortOrder: 'ascending' | 'descending' }>) => void} [onSort]
   * Custom `Sort` event handler, called when the sort button is clicked. `detail.sortOrder` is the
   * suggested next order: `descending` if the column is currently sorted in ascending order,
   * otherwise `ascending`. The consumer sorts the rows and updates `sortOrder` accordingly.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    sortOrder = undefined,
    children,
    onSort,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /**
   * Keep the sort button’s clicks and activation keys from the `<Grid>`, which would otherwise
   * select or focus the header row, or prevent the key’s default action, and call `onSort` instead.
   * Native listeners are used because the grid listens on its own element, which a delegated Svelte
   * event handler would only reach after the grid has handled the event. The arrow keys are left
   * alone, so they still move from the header row to the data rows.
   * @type {Attachment}
   */
  const handleSortButton = (element) => {
    /**
     * Handle the `click` event on the button.
     * @param {Event} event `click` event.
     */
    const onClick = (event) => {
      event.stopPropagation();
      onSort?.(
        new CustomEvent('Sort', {
          detail: { sortOrder: sortOrder === 'ascending' ? 'descending' : 'ascending' },
        }),
      );
    };

    /**
     * Handle the `keydown` event on the button.
     * @param {Event} event `keydown` event.
     */
    const onKeyDown = (event) => {
      const { key } = /** @type {KeyboardEvent} */ (event);

      if (key === 'Enter' || key === ' ') {
        event.stopPropagation();
      }
    };

    element.addEventListener('click', onClick);
    element.addEventListener('keydown', onKeyDown);

    return () => {
      element.removeEventListener('click', onClick);
      element.removeEventListener('keydown', onKeyDown);
    };
  };
</script>

{#if sortOrder === undefined}
  <TablePart {...restProps} role="columnheader" kind="grid-col-header" class={className}>
    {@render children?.()}
  </TablePart>
{:else}
  <TablePart
    {...restProps}
    role="columnheader"
    kind="grid-col-header"
    class={className ? `sortable ${className}` : 'sortable'}
    aria-sort={sortOrder === 'none' ? undefined : sortOrder}
  >
    <Button class="sort-button" {@attach handleSortButton}>
      {@render children?.()}
      {#snippet endIcon()}
        <Icon
          class="sort-icon {sortOrder}"
          name={sortOrder === 'descending' ? 'arrow_downward' : 'arrow_upward'}
        />
      {/snippet}
    </Button>
  </TablePart>
{/if}

<style lang="scss">
  // The header is rendered by `<TablePart>` and the button by `<Button>`, so neither is an element
  // of this component, and the rules are global. The `.sui` class keeps them to the library’s own
  // elements
  :global {
    // Positioned with no specificity, so a consumer can make the header sticky instead; either way,
    // it’s the containing block of the button’s hit area below
    :where(.sui.grid-col-header.sortable) {
      position: relative;
    }

    .sui.grid-col-header.sortable > .sui.button.sort-button {
      justify-content: flex-start;
      margin: 0;
      border-radius: 0;
      padding: 0;
      width: 100%;
      height: auto;
      color: inherit;
      font: inherit;
      text-align: start;

      // Stretch the hit area over the whole cell, including its padding, so a click anywhere on the
      // header sorts the column
      &::after {
        position: absolute;
        inset: 0;
        content: '';
      }

      .sort-icon {
        flex: none;
        font-size: 16px;
        transition: opacity 200ms;

        // An unsorted column only hints at its sort button on hover and focus
        &.none {
          opacity: 0;
        }
      }

      &:is(:hover, :focus-visible) .sort-icon.none {
        opacity: 0.4;
      }

      // A touch screen has no hover to reveal it, so it’s always shown there
      @media (hover: none) {
        .sort-icon.none {
          opacity: 0.4;
        }
      }
    }
  }
</style>
