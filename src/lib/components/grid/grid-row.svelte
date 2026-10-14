<!--
  @component
  The interactive version of `<TableRow>`.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr
  @see https://w3c.github.io/aria/#row
-->
<script>
  import { getContext } from 'svelte';
  import TablePart from '../table/table-part.svelte';

  /**
   * @import { Snippet } from 'svelte';
   * @import { Attachment } from 'svelte/attachments';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {boolean} [selected] Whether to select the widget. An alias of the `aria-selected`
   * attribute. Ignored on a header or footer row inside `<GridHead>` or `<GridFoot>`, which can
   * never be selected.
   * @property {Snippet} [children] Primary slot content.
   * @property {(event: CustomEvent) => void} [onChange] Custom `Change` event handler.
   * @property {(event: CustomEvent) => void} [onSelect] Custom `Select` event handler.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    selected = false,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /**
   * Whether the row is a header or footer row inside `<GridHead>` or `<GridFoot>`. The grid’s arrow
   * keys still land on it, but it can’t be selected, so it has no `aria-selected` state, even one
   * passed as an attribute, and is marked for the group service to leave out of the selection.
   */
  const isUnselectableRow = getContext('sui:grid-unselectable-rows') === true;

  const attributes = $derived.by(() => {
    if (!isUnselectableRow) {
      return { ...restProps, 'aria-selected': selected };
    }

    const { 'aria-selected': _ariaSelected, ...rest } = restProps;

    return { ...rest, 'data-selectable': 'false' };
  });

  /**
   * Move the focus from a header row to the first sort button in it when the row is activated,
   * which the grid does by clicking the focused row on Enter. The arrow keys move from row to row,
   * so this is how a keyboard user gets from the header row to the sort buttons, and on from there
   * with Tab. A click on a cell is left alone, as the button covers its sortable cell.
   * @type {Attachment}
   */
  const focusSortButton = (element) => {
    /**
     * Handle the `click` event on the row.
     * @param {Event} event `click` event.
     */
    const listener = (event) => {
      const button = /** @type {HTMLElement | null} */ (element.querySelector('.sort-button'));

      if (event.target === element && button) {
        // The grid would otherwise move the focus back to the row it has just clicked
        event.stopPropagation();
        button.focus();
      }
    };

    element.addEventListener('click', listener);

    return () => {
      element.removeEventListener('click', listener);
    };
  };
</script>

{#if isUnselectableRow}
  <TablePart {...attributes} role="row" kind="grid-row" tabindex="0" {@attach focusSortButton} />
{:else}
  <TablePart {...attributes} role="row" kind="grid-row" tabindex="0" />
{/if}
