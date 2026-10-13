/**
 * Table editing helpers for the rich text editor: inserting a table, and the row and column
 * operations offered by the table menu. Functions starting with `$` must be called within an editor
 * update.
 */

import {
  $createTableNodeWithDimensions as createTableNodeWithDimensions,
  $deleteTableColumnAtSelection as deleteTableColumnAtSelection,
  $deleteTableRowAtSelection as deleteTableRowAtSelection,
  $findTableNode as findTableNode,
  $insertTableColumnAtSelection as insertTableColumnAtSelection,
  $insertTableRowAtSelection as insertTableRowAtSelection,
  $isTableCellNode as isTableCellNode,
  $isTableRowNode as isTableRowNode,
  $isTableSelection as isTableSelection,
  TableCellHeaderStates,
} from '@lexical/table';
import { $findMatchingParent as findMatchingParent } from '@lexical/utils';
import {
  $createParagraphNode as createParagraphNode,
  $getNodeByKey as getNodeByKey,
  $getPreviousSelection as getPreviousSelection,
  $getSelection as getSelection,
  $isElementNode as isElementNode,
  $isRangeSelection as isRangeSelection,
  $isRootNode as isRootNode,
  $setSelection as setSelection,
} from 'lexical';
import { $insertBlockNode } from './block.js';
import { MAX_TABLE_SIZE } from './constants.js';

/**
 * @import { LexicalNode, RangeSelection } from 'lexical';
 * @import { TableCellNode, TableNode, TableRowNode, TableSelection } from '@lexical/table';
 */

/**
 * Operation offered by the table menu.
 * @typedef {'insert-row-above' | 'insert-row-below' | 'insert-column-left' |
 * 'insert-column-right' | 'delete-row' | 'delete-column' | 'delete-table'} TableAction
 */

/**
 * Get the number of rows or columns for a new table from the given input, which can be anything
 * the user has entered: a whole number from 1 to {@link MAX_TABLE_SIZE}.
 * @param {unknown} value Input value.
 * @returns {number | undefined} Number, or `undefined` if the value is not a valid size.
 */
export const parseTableSize = (value) => {
  const number = Number(value);

  return Number.isInteger(number) && number >= 1 && number <= MAX_TABLE_SIZE ? number : undefined;
};

/**
 * Create the Markdown of a new empty table with a header row, to insert it in the plain text mode.
 * The cells are written the same way the rich text editor exports them, so switching the mode
 * doesn’t change the value.
 * @param {number} rows Number of rows, including the header row.
 * @param {number} columns Number of columns.
 * @returns {string} Markdown.
 */
export const createTableMarkdown = (rows, columns) => {
  const row = `| ${Array(columns).fill('').join(' | ')} |`;
  const divider = `| ${Array(columns).fill('---').join(' | ')} |`;

  return [row, divider, ...Array(rows - 1).fill(row)].join('\n');
};

/**
 * Check if the table the given cell element is in is laid out from right to left. The columns
 * follow the direction of the table, while each cell can have a direction of its own.
 * @param {HTMLElement} cell Cell element.
 * @returns {boolean} Result.
 */
export const isRightToLeftTable = (cell) => {
  const table = cell.closest('table');

  return !!table && getComputedStyle(table).direction === 'rtl';
};

/**
 * Get the table cell that contains the given node.
 * @param {LexicalNode | null | undefined} node Node.
 * @returns {TableCellNode | null} Cell, if any.
 */
export const $getTableCell = (node) =>
  node ? /** @type {TableCellNode | null} */ (findMatchingParent(node, isTableCellNode)) : null;

/**
 * Get the key of the table cell the selection’s focus is in. The focus is where the user has moved
 * the caret last, including when they have selected several cells.
 * @returns {string | null} Key, or `null` if the selection is not in a table.
 */
export const $getSelectedTableCellKey = () => {
  const selection = getSelection();

  if (!isRangeSelection(selection) && !isTableSelection(selection)) {
    return null;
  }

  return $getTableCell(selection.focus.getNode())?.getKey() ?? null;
};

/**
 * Insert a new empty table with a header row at the selection, and move the caret to its first
 * cell. A table can’t be inserted into another table, as neither Markdown nor the editor supports
 * nested tables.
 * @param {number} rows Number of rows, including the header row.
 * @param {number} columns Number of columns.
 * @returns {boolean} Whether the table has been inserted.
 */
export const $insertTable = (rows, columns) => {
  const selection = getSelection() ?? getPreviousSelection();

  if (
    (isRangeSelection(selection) || isTableSelection(selection)) &&
    findTableNode(selection.anchor.getNode())
  ) {
    return false;
  }

  const table = $insertBlockNode(
    createTableNodeWithDimensions(rows, columns, { rows: true, columns: false }),
  );

  // The table has at least one row and one column
  /** @type {TableRowNode} */ (table.getFirstChildOrThrow()).getFirstChildOrThrow().selectStart();

  return true;
};

/**
 * Add an empty paragraph after the given table if it’s the last block of the document. The caret
 * can’t otherwise be moved below the table, so nothing could be added after it. An empty paragraph
 * at the end is left out of the Markdown and HTML values, so this doesn’t change them.
 * @param {TableNode} table Table.
 */
export const $ensureParagraphAfterTable = (table) => {
  if (!table.getNextSibling() && isRootNode(table.getParent())) {
    table.insertAfter(createParagraphNode());
  }
};

/**
 * Make the first row of the given table the header row, and the other rows plain rows. A Markdown
 * table always has exactly one header row on top, so this keeps the table in the editor in line
 * with its Markdown, even after a row has been inserted above the header or the header removed.
 * @param {TableNode} table Table.
 */
export const $normalizeTableHeaders = (table) => {
  table.getChildren().forEach((row, rowIndex) => {
    // The table transform of Lexical removes anything but rows and cells
    /* v8 ignore next 3 */
    if (!isTableRowNode(row)) {
      return;
    }

    const headerState =
      rowIndex === 0 ? TableCellHeaderStates.ROW : TableCellHeaderStates.NO_STATUS;

    row.getChildren().forEach((cell) => {
      if (isTableCellNode(cell) && cell.getHeaderStyles() !== headerState) {
        cell.setHeaderStyles(headerState);
      }
    });
  });
};

/**
 * Move the caret out of the given table, which is about to be removed: to the end of the block
 * before it, the start of the block after it, or a new paragraph if there’s neither to type in.
 * @param {TableNode} table Table.
 */
const $moveCaretOutOfTable = (table) => {
  const previous = table.getPreviousSibling();
  const next = table.getNextSibling();

  if (isElementNode(previous)) {
    previous.selectEnd();
  } else if (isElementNode(next)) {
    next.selectStart();
  } else {
    table.insertAfter(createParagraphNode()).selectStart();
  }
};

/**
 * Check if the given operation deletes rows or columns.
 * @param {TableAction} action Operation.
 * @returns {action is 'delete-row' | 'delete-column'} Result.
 */
const isDeleteAction = (action) => action === 'delete-row' || action === 'delete-column';

/**
 * Check if the selection spans all the rows or all the columns of the given table, depending on the
 * action, in which case deleting them deletes the whole table. Merged cells are disabled, so the
 * table is a plain grid, where the index of a row or cell tells its position.
 * @param {TableNode} table Table the selection is in.
 * @param {'delete-row' | 'delete-column'} action Operation.
 * @returns {boolean} Result.
 */
const $selectionSpansTable = (table, action) => {
  const selection = /** @type {RangeSelection | TableSelection} */ (getSelection());

  const cells = /** @type {TableCellNode[]} */ (
    [selection.anchor, selection.focus].map((point) => $getTableCell(point.getNode()))
  );

  const [start, end] = cells
    .map((cell) =>
      action === 'delete-row'
        ? cell.getParentOrThrow().getIndexWithinParent()
        : cell.getIndexWithinParent(),
    )
    .sort((a, b) => a - b);

  return (
    end - start + 1 === (action === 'delete-row' ? table.getChildrenSize() : table.getColumnCount())
  );
};

/**
 * Run the given table menu operation on the cell with the given key. If the selection is already
 * in the same table, it’s kept, so an operation applies to all the selected rows or columns.
 * Otherwise, the caret is moved to the cell first.
 * @param {TableAction} action Operation.
 * @param {string} cellKey Key of the cell the menu has been opened for.
 * @param {object} [options] Options.
 * @param {boolean} [options.rtl] Whether the table is laid out from right to left, in which case
 * the left column comes after the cell rather than before it.
 * @returns {boolean} Whether the operation has been run. It’s not if the cell is gone.
 */
export const $runTableAction = (action, cellKey, { rtl = false } = {}) => {
  const cell = getNodeByKey(cellKey);

  if (!isTableCellNode(cell)) {
    return false;
  }

  const table = /** @type {TableNode} */ (findTableNode(cell));
  const selection = getSelection() ?? getPreviousSelection();

  if (
    (isRangeSelection(selection) || isTableSelection(selection)) &&
    findTableNode(selection.anchor.getNode())?.is(table) &&
    findTableNode(selection.focus.getNode())?.is(table)
  ) {
    if (!getSelection()) {
      setSelection(selection.clone());
    }
  } else {
    cell.selectStart();
  }

  if (
    action === 'delete-table' ||
    (isDeleteAction(action) && $selectionSpansTable(table, action))
  ) {
    // Deleting every row or column deletes the table, which Lexical does by moving the caret to
    // the previous node, even if that’s a decorator or there’s none, where the user can’t type
    $moveCaretOutOfTable(table);
    table.remove();
  } else if (action === 'delete-row') {
    deleteTableRowAtSelection();
  } else if (action === 'delete-column') {
    deleteTableColumnAtSelection();
  } else if (action === 'insert-row-above' || action === 'insert-row-below') {
    insertTableRowAtSelection(action === 'insert-row-below');
  } else {
    // In a right-to-left table, the left column comes after the cell
    insertTableColumnAtSelection((action === 'insert-column-right') !== rtl);
  }

  return true;
};
