<!--
  @component
  Menu of the operations on a table: inserting and deleting rows and columns, and deleting the whole
  table. It’s opened from the toolbar or the button on the selected table cell.
-->
<script>
  import { _ } from '@sveltia/i18n';
  import { getContext } from 'svelte';
  import Divider from '../../divider/divider.svelte';
  import MenuItem from '../../menu/menu-item.svelte';
  import Menu from '../../menu/menu.svelte';
  import { focusEditor } from '../core.js';
  import { isRightToLeftTable, $runTableAction as runTableAction } from '../table.js';
  import { waitForMenuToClose } from './menu.js';

  /**
   * @import { TextEditorStore } from '#lib/typedefs.js';
   * @import { TableAction } from '../table.js';
   */

  /**
   * @typedef {object} Props
   * @property {string} cellKey Key of the table cell to run the operations on.
   */

  /** @type {Props} */
  let {
    /* eslint-disable prefer-const */
    cellKey,
    /* eslint-enable prefer-const */
  } = $props();

  /** @type {TextEditorStore} */
  const editorStore = getContext('editorStore');

  /**
   * Menu items, grouped by what they do. Each item has the operation and the key of its label.
   * @type {[TableAction, string][][]}
   */
  const ITEM_GROUPS = [
    [
      ['insert-row-above', 'insert_row_above'],
      ['insert-row-below', 'insert_row_below'],
    ],
    [
      ['insert-column-left', 'insert_column_left'],
      ['insert-column-right', 'insert_column_right'],
    ],
    [
      ['delete-row', 'delete_row'],
      ['delete-column', 'delete_column'],
      ['delete-table', 'delete_table'],
    ],
  ];

  /**
   * Run the given operation on the cell, then move the focus back to the editor.
   * @param {TableAction} action Operation.
   * @param {HTMLElement} item Menu item chosen.
   */
  const runAction = async (action, item) => {
    const { editor } = editorStore;

    // The menu is only shown for a cell in the editor
    /* v8 ignore next 3 */
    if (!editor) {
      return;
    }

    const cell = editor.getElementByKey(cellKey);
    const rtl = !!cell && isRightToLeftTable(cell);

    editor.update(() => {
      runTableAction(action, cellKey, { rtl });
    });

    await waitForMenuToClose(item);
    await focusEditor(editor);
  };
</script>

<Menu ariaLabel={_('_sui.text_editor.table_options')}>
  {#each ITEM_GROUPS as items, index (index)}
    {#if index > 0}
      <Divider />
    {/if}
    {#each items as [action, labelKey] (action)}
      <MenuItem
        label={_(`_sui.text_editor.${labelKey}`)}
        onclick={(/** @type {MouseEvent} */ event) => {
          runAction(action, /** @type {HTMLElement} */ (event.currentTarget));
        }}
      />
    {/each}
  {/each}
</Menu>
