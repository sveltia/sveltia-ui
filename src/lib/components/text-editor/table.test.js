import {
  $createTableNodeWithDimensions as createTableNodeWithDimensions,
  $createTableSelection as createTableSelection,
  $isTableNode as isTableNode,
  TableCellHeaderStates,
  TableCellNode,
  TableNode,
  TableRowNode,
} from '@lexical/table';
import {
  $createParagraphNode as createParagraphNode,
  $createTextNode as createTextNode,
  $getNodeByKey as getNodeByKey,
  $getRoot as getRoot,
  $getSelection as getSelection,
  $isParagraphNode as isParagraphNode,
  $setSelection as setSelection,
  createEditor,
} from 'lexical';
import { describe, expect, it } from 'vitest';
import { MAX_TABLE_SIZE } from './constants.js';
import {
  $ensureParagraphAfterTable,
  $getSelectedTableCellKey,
  $getTableCell,
  $insertTable,
  $normalizeTableHeaders,
  $runTableAction,
  createTableMarkdown,
  parseTableSize,
} from './table.js';

/**
 * @import { LexicalEditor } from 'lexical';
 * @import { TableCellNode as TableCell } from '@lexical/table';
 */

/**
 * Create an editor with the table nodes, attached to a root element like the rich text editor.
 * @returns {LexicalEditor} Editor.
 */
const createTestEditor = () => {
  const editor = createEditor({
    nodes: [TableNode, TableRowNode, TableCellNode],
    /**
     * Fail the test on any error.
     * @param {Error} error Error.
     * @throws {Error} Always.
     */
    onError: (error) => {
      throw error;
    },
  });

  const root = document.createElement('div');

  root.contentEditable = 'true';
  document.body.append(root);
  editor.setRootElement(root);

  return editor;
};

/**
 * Run the given function within a discrete editor update, and return its result.
 * @template T
 * @param {LexicalEditor} editor Editor.
 * @param {() => T} fn Function.
 * @returns {T} Result.
 */
const update = (editor, fn) => {
  /** @type {T} */
  let result = /** @type {any} */ (undefined);

  editor.update(
    () => {
      result = fn();
    },
    { discrete: true },
  );

  return result;
};

/**
 * Get the text of every cell of every table in the document, along with whether it’s a header.
 * Header cells are marked with `#`.
 * @param {LexicalEditor} editor Editor.
 * @returns {string[][][]} Tables, rows and cells.
 */
const readTables = (editor) =>
  editor.read(() =>
    getRoot()
      .getChildren()
      .filter(isTableNode)
      .map((table) =>
        /** @type {TableRowNode[]} */ (table.getChildren()).map((row) =>
          /** @type {TableCell[]} */ (row.getChildren()).map(
            (cell) => `${cell.hasHeader() ? '#' : ''}${cell.getTextContent()}`,
          ),
        ),
      ),
  );

/**
 * Get the types of the top level nodes of the document.
 * @param {LexicalEditor} editor Editor.
 * @returns {string[]} Types.
 */
const readBlockTypes = (editor) =>
  editor.read(() =>
    getRoot()
      .getChildren()
      .map((node) => node.getType()),
  );

/**
 * Get the text content of the node the selection is anchored to, along with its type.
 * @param {LexicalEditor} editor Editor.
 * @returns {string | undefined} Description, e.g. `tablecell:B2` or `paragraph:Before`.
 */
const readCaret = (editor) =>
  editor.read(() => {
    const node = getSelection()?.getNodes()[0];
    const cell = $getTableCell(node);
    const target = cell ?? node?.getTopLevelElement() ?? node;

    return target ? `${target.getType()}:${target.getTextContent()}` : undefined;
  });

/**
 * Fill the document with a paragraph, a table with lettered columns and numbered rows, like `A1`,
 * and another paragraph.
 * @param {LexicalEditor} editor Editor.
 * @param {object} [options] Options.
 * @param {number} [options.rows] Number of rows.
 * @param {number} [options.columns] Number of columns.
 * @param {boolean} [options.withParagraphs] Whether to add the paragraphs around the table.
 * @returns {TableNode} Table.
 */
const setUpTable = (editor, { rows = 3, columns = 3, withParagraphs = true } = {}) =>
  update(editor, () => {
    const root = getRoot().clear();
    const table = createTableNodeWithDimensions(rows, columns, { rows: true, columns: false });

    /** @type {TableRowNode[]} */ (table.getChildren()).forEach((row, rowIndex) => {
      /** @type {TableCell[]} */ (row.getChildren()).forEach((cell, columnIndex) => {
        cell
          .clear()
          .append(
            createParagraphNode().append(
              createTextNode(`${String.fromCharCode(65 + columnIndex)}${rowIndex + 1}`),
            ),
          );
      });
    });

    if (withParagraphs) {
      root.append(createParagraphNode().append(createTextNode('Before')));
    }

    root.append(table);

    if (withParagraphs) {
      root.append(createParagraphNode().append(createTextNode('After')));
    }

    return table;
  });

/**
 * Get the key of the cell at the given position of the first table.
 * @param {LexicalEditor} editor Editor.
 * @param {number} row Row index.
 * @param {number} column Column index.
 * @returns {string} Key.
 */
const getCellKey = (editor, row, column) =>
  editor.read(() => {
    const table = /** @type {TableNode} */ (getRoot().getChildren().find(isTableNode));
    const rowNode = /** @type {TableRowNode} */ (table.getChildAtIndex(row));

    return /** @type {TableCell} */ (rowNode.getChildAtIndex(column)).getKey();
  });

describe('parseTableSize()', () => {
  it('accepts a whole number within the range', () => {
    expect(parseTableSize(1)).toBe(1);
    expect(parseTableSize('4')).toBe(4);
    expect(parseTableSize(MAX_TABLE_SIZE)).toBe(MAX_TABLE_SIZE);
  });

  it('rejects anything else', () => {
    expect(parseTableSize(0)).toBeUndefined();
    expect(parseTableSize(MAX_TABLE_SIZE + 1)).toBeUndefined();
    expect(parseTableSize(2.5)).toBeUndefined();
    expect(parseTableSize(undefined)).toBeUndefined();
    expect(parseTableSize('two')).toBeUndefined();
  });
});

describe('createTableMarkdown()', () => {
  it('creates an empty table with a header row', () => {
    expect(createTableMarkdown(3, 2)).toBe(
      ['|  |  |', '| --- | --- |', '|  |  |', '|  |  |'].join('\n'),
    );
  });

  it('creates a table with just the header row', () => {
    expect(createTableMarkdown(1, 1)).toBe(['|  |', '| --- |'].join('\n'));
  });
});

describe('$getTableCell() and $getSelectedTableCellKey()', () => {
  it('finds the cell the caret is in', () => {
    const editor = createTestEditor();

    setUpTable(editor);

    const key = getCellKey(editor, 1, 2);

    expect(
      update(editor, () => {
        /** @type {TableCell} */ (getNodeByKey(key)).selectEnd();

        return $getSelectedTableCellKey();
      }),
    ).toBe(key);
  });

  it('returns the focus cell of a table selection', () => {
    const editor = createTestEditor();
    const table = setUpTable(editor);
    const anchorKey = getCellKey(editor, 0, 0);
    const focusKey = getCellKey(editor, 1, 1);

    expect(
      update(editor, () => {
        const selection = createTableSelection();

        selection.set(table.getKey(), anchorKey, focusKey);
        setSelection(selection);

        return $getSelectedTableCellKey();
      }),
    ).toBe(focusKey);
  });

  it('returns `null` outside a table or without a selection', () => {
    const editor = createTestEditor();

    setUpTable(editor);

    expect(update(editor, () => $getSelectedTableCellKey())).toBeNull();
    expect(
      update(editor, () => {
        getRoot().getFirstChildOrThrow().selectEnd();

        return $getSelectedTableCellKey();
      }),
    ).toBeNull();
    expect(update(editor, () => $getTableCell(null))).toBeNull();
  });
});

describe('$insertTable()', () => {
  it('replaces the empty paragraph the caret is in, with the caret in the first cell', () => {
    const editor = createTestEditor();

    update(editor, () => {
      getRoot()
        .clear()
        .append(createParagraphNode().append(createTextNode('Before')));
      getRoot().append(createParagraphNode()).getLastChildOrThrow().selectStart();
    });

    expect(update(editor, () => $insertTable(2, 3))).toBe(true);
    // The rich text editor adds a paragraph after the table with a transform
    expect(readBlockTypes(editor)).toEqual(['paragraph', 'table']);
    expect(readTables(editor)).toEqual([
      [
        ['#', '#', '#'],
        ['', '', ''],
      ],
    ]);
    expect(readCaret(editor)).toBe('tablecell:');
    expect(update(editor, () => $getSelectedTableCellKey())).toBe(getCellKey(editor, 0, 0));
  });

  it('splits a paragraph with text at the caret', () => {
    const editor = createTestEditor();

    update(editor, () => {
      getRoot()
        .clear()
        .append(createParagraphNode().append(createTextNode('BeforeAfter')));
      /** @type {any} */ (getRoot().getFirstDescendant()).select(6, 6);
    });

    expect(update(editor, () => $insertTable(1, 1))).toBe(true);
    expect(readBlockTypes(editor)).toEqual(['paragraph', 'table', 'paragraph']);
    expect(editor.read(() => getRoot().getTextContent())).toContain('Before');
    expect(editor.read(() => getRoot().getLastChildOrThrow().getTextContent())).toBe('After');
  });

  it('restores the selection kept from the previous update', () => {
    const editor = createTestEditor();

    update(editor, () => {
      getRoot()
        .clear()
        .append(createParagraphNode().append(createTextNode('Before')), createParagraphNode())
        .getLastChildOrThrow()
        .selectStart();
    });

    expect(
      update(editor, () => {
        // Lose the selection, as the editor can when the focus moves to the dialog
        setSelection(null);

        return $insertTable(1, 2);
      }),
    ).toBe(true);
    // The table takes the place of the empty paragraph the caret was in
    expect(readBlockTypes(editor)).toEqual(['paragraph', 'table']);
    expect(readTables(editor)).toEqual([[['#', '#']]]);
    expect(readCaret(editor)).toBe('tablecell:');
  });

  it('appends the table to the document without a selection', () => {
    const editor = createTestEditor();

    update(editor, () => {
      getRoot()
        .clear()
        .append(createParagraphNode().append(createTextNode('Text')));
    });

    expect(update(editor, () => $insertTable(1, 1))).toBe(true);
    expect(readBlockTypes(editor)).toEqual(['paragraph', 'table', 'paragraph']);
  });

  it('refuses to insert a table into another table', () => {
    const editor = createTestEditor();

    setUpTable(editor);

    const key = getCellKey(editor, 0, 0);

    expect(
      update(editor, () => {
        /** @type {TableCell} */ (getNodeByKey(key)).selectStart();

        return $insertTable(2, 2);
      }),
    ).toBe(false);
    expect(readTables(editor)).toHaveLength(1);
  });

  it('refuses to insert a table while several cells are selected', () => {
    const editor = createTestEditor();
    const table = setUpTable(editor);
    const anchorKey = getCellKey(editor, 0, 0);
    const focusKey = getCellKey(editor, 1, 1);

    expect(
      update(editor, () => {
        const selection = createTableSelection();

        selection.set(table.getKey(), anchorKey, focusKey);
        setSelection(selection);

        return $insertTable(2, 2);
      }),
    ).toBe(false);
    expect(readTables(editor)).toHaveLength(1);
    expect(readBlockTypes(editor)).toEqual(['paragraph', 'table', 'paragraph']);
  });
});

describe('$ensureParagraphAfterTable()', () => {
  it('adds a paragraph after a table at the end of the document', () => {
    const editor = createTestEditor();
    const table = setUpTable(editor, { withParagraphs: false });

    update(editor, () => {
      $ensureParagraphAfterTable(/** @type {TableNode} */ (getNodeByKey(table.getKey())));
    });

    expect(readBlockTypes(editor)).toEqual(['table', 'paragraph']);
  });

  it('leaves a table followed by another block alone', () => {
    const editor = createTestEditor();
    const table = setUpTable(editor);

    update(editor, () => {
      $ensureParagraphAfterTable(/** @type {TableNode} */ (getNodeByKey(table.getKey())));
    });

    expect(readBlockTypes(editor)).toEqual(['paragraph', 'table', 'paragraph']);
  });
});

describe('$normalizeTableHeaders()', () => {
  it('makes the first row the only header row', () => {
    const editor = createTestEditor();
    const table = setUpTable(editor);

    update(editor, () => {
      const node = /** @type {TableNode} */ (getNodeByKey(table.getKey()));
      const rows = /** @type {TableRowNode[]} */ (node.getChildren());

      // Move the header row down, and give the first column a header as well
      rows[1].insertAfter(rows[0]);
      /** @type {TableCell} */ (rows[2].getFirstChildOrThrow()).setHeaderStyles(
        TableCellHeaderStates.COLUMN,
      );
      $normalizeTableHeaders(node);
    });

    expect(readTables(editor)).toEqual([
      [
        ['#A2', '#B2', '#C2'],
        ['A1', 'B1', 'C1'],
        ['A3', 'B3', 'C3'],
      ],
    ]);
  });
});

describe('$runTableAction()', () => {
  /**
   * Set up a table, put the caret in the given cell, and run the given action on it.
   * @param {import('./table.js').TableAction} action Action.
   * @param {object} [options] Options.
   * @param {[number, number]} [options.cell] Row and column of the cell.
   * @param {boolean} [options.rtl] Whether the table is laid out from right to left.
   * @param {boolean} [options.withParagraphs] Whether to add the paragraphs around the table.
   * @param {number} [options.rows] Number of rows.
   * @param {number} [options.columns] Number of columns.
   * @returns {LexicalEditor} Editor.
   */
  const run = (action, { cell = [1, 1], rtl, ...tableOptions } = {}) => {
    const editor = createTestEditor();

    setUpTable(editor, tableOptions);

    const key = getCellKey(editor, ...cell);

    expect(update(editor, () => $runTableAction(action, key, { rtl }))).toBe(true);

    return editor;
  };

  it('inserts a row above or below the cell', () => {
    expect(readTables(run('insert-row-above'))[0].map((row) => row[0])).toEqual([
      '#A1',
      '',
      'A2',
      'A3',
    ]);
    expect(readTables(run('insert-row-below'))[0].map((row) => row[0])).toEqual([
      '#A1',
      'A2',
      '',
      'A3',
    ]);
  });

  it('inserts a column to the left or right of the cell', () => {
    expect(readTables(run('insert-column-left'))[0][1]).toEqual(['A2', '', 'B2', 'C2']);
    expect(readTables(run('insert-column-right'))[0][1]).toEqual(['A2', 'B2', '', 'C2']);
  });

  it('swaps the sides in a right-to-left table', () => {
    expect(readTables(run('insert-column-left', { rtl: true }))[0][1]).toEqual([
      'A2',
      'B2',
      '',
      'C2',
    ]);
    expect(readTables(run('insert-column-right', { rtl: true }))[0][1]).toEqual([
      'A2',
      '',
      'B2',
      'C2',
    ]);
  });

  it('deletes the row or column of the cell', () => {
    const rowEditor = run('delete-row');

    expect(readTables(rowEditor)[0].map((row) => row[0])).toEqual(['#A1', 'A3']);
    expect(readCaret(rowEditor)).toBe('tablecell:A3');

    const columnEditor = run('delete-column');

    expect(readTables(columnEditor)[0][0]).toEqual(['#A1', '#C1']);
    expect(readCaret(columnEditor)).toBe('tablecell:C2');
  });

  it('deletes the table along with its last row or column', () => {
    const rowEditor = run('delete-row', { rows: 1, cell: [0, 0] });

    expect(readBlockTypes(rowEditor)).toEqual(['paragraph', 'paragraph']);
    expect(readCaret(rowEditor)).toBe('paragraph:Before');

    const columnEditor = run('delete-column', { columns: 1, cell: [0, 0] });

    expect(readBlockTypes(columnEditor)).toEqual(['paragraph', 'paragraph']);
    expect(readCaret(columnEditor)).toBe('paragraph:Before');
  });

  it('deletes the table, moving the caret to the block before it', () => {
    const editor = run('delete-table');

    expect(readBlockTypes(editor)).toEqual(['paragraph', 'paragraph']);
    expect(readCaret(editor)).toBe('paragraph:Before');
  });

  it('moves the caret to the block after the table if there’s none before it', () => {
    const editor = createTestEditor();

    setUpTable(editor);
    update(editor, () => {
      getRoot().getFirstChildOrThrow().remove();
    });

    const key = getCellKey(editor, 0, 0);

    update(editor, () => $runTableAction('delete-table', key));

    expect(readBlockTypes(editor)).toEqual(['paragraph']);
    expect(readCaret(editor)).toBe('paragraph:After');
  });

  it('leaves an empty paragraph where the only table was', () => {
    const editor = run('delete-table', { withParagraphs: false });

    expect(readBlockTypes(editor)).toEqual(['paragraph']);
    expect(editor.read(() => isParagraphNode(getSelection()?.getNodes()[0]))).toBe(true);
  });

  it('keeps a selection spanning several cells of the same table', () => {
    const editor = createTestEditor();
    const table = setUpTable(editor);
    const anchorKey = getCellKey(editor, 1, 0);
    const focusKey = getCellKey(editor, 2, 2);

    update(editor, () => {
      const selection = createTableSelection();

      selection.set(table.getKey(), anchorKey, focusKey);
      setSelection(selection);
    });

    update(editor, () => {
      // Lose the selection, as the editor can when the focus moves to the menu
      setSelection(null);
      $runTableAction('delete-row', anchorKey);
    });

    expect(readTables(editor)[0]).toEqual([['#A1', '#B1', '#C1']]);
  });

  it('deletes the table if the selection spans all the columns to delete', () => {
    const editor = createTestEditor();
    const table = setUpTable(editor, { rows: 2, columns: 2 });
    const anchorKey = getCellKey(editor, 0, 1);
    const focusKey = getCellKey(editor, 1, 0);

    update(editor, () => {
      const selection = createTableSelection();

      selection.set(table.getKey(), anchorKey, focusKey);
      setSelection(selection);
    });

    update(editor, () => $runTableAction('delete-column', anchorKey));

    expect(readTables(editor)).toEqual([]);
  });

  it('moves the caret to the cell if the selection is elsewhere', () => {
    const editor = createTestEditor();

    setUpTable(editor);
    update(editor, () => {
      getRoot().getFirstChildOrThrow().selectEnd();
    });

    const key = getCellKey(editor, 2, 0);

    update(editor, () => $runTableAction('delete-row', key));

    expect(readTables(editor)[0].map((row) => row[0])).toEqual(['#A1', 'A2']);
  });

  it('does nothing if the cell is gone', () => {
    const editor = createTestEditor();

    setUpTable(editor);

    expect(update(editor, () => $runTableAction('delete-table', 'missing'))).toBe(false);
    expect(readTables(editor)).toHaveLength(1);
  });
});
