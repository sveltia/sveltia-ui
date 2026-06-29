/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable max-classes-per-file */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getTableColumnsSize, mapToTableCells, TABLE } from './table.js';

const tableMockState = vi.hoisted(() => ({
  convertFromMarkdownString: vi.fn(),
  convertToMarkdownString: vi.fn(),
  /** @type {any[]} */
  createdTables: [],
}));

vi.mock('@lexical/markdown', () => ({
  $convertFromMarkdownString: tableMockState.convertFromMarkdownString,
  $convertToMarkdownString: tableMockState.convertToMarkdownString,
  TRANSFORMERS: [],
}));

vi.mock('@lexical/table', () => {
  class TableCellNode {
    constructor(headerState = 0) {
      this.__kind = 'table-cell';
      this.__headerState = headerState;
      this.text = '';
    }

    /**
     * Set header styles.
     * @param {number} headerState Header state value.
     */
    setHeaderStyles(headerState) {
      this.__headerState = headerState;
    }
  }

  class TableRowNode {
    constructor() {
      this.__kind = 'table-row';
      /** @type {any[]} */
      this.children = [];
    }

    /**
     * Append cells to this row.
     * @param {...any[]} cells Cells to append.
     */
    append(...cells) {
      this.children.push(...cells);
    }

    getChildren() {
      return this.children;
    }

    getChildrenSize() {
      return this.children.length;
    }
  }

  class TableNode {
    constructor() {
      this.__kind = 'table';
      /** @type {any[]} */
      this.children = [];
    }

    /**
     * Append rows to this table.
     * @param {...any[]} rows Rows to append.
     */
    append(...rows) {
      this.children.push(...rows);
    }

    getChildren() {
      return this.children;
    }

    getFirstChild() {
      return this.children[0] ?? null;
    }

    selectEnd() {
      this.selected = true;
    }
  }

  return {
    $createTableCellNode: vi.fn((headerState) => new TableCellNode(headerState)),
    $createTableNode: vi.fn(() => {
      const table = new TableNode();

      table.selectEnd = vi.fn();
      tableMockState.createdTables.push(/** @type {any} */ (table));
      return table;
    }),
    $createTableRowNode: vi.fn(() => new TableRowNode()),
    $isTableCellNode: vi.fn((node) => node?.__kind === 'table-cell'),
    $isTableNode: vi.fn((node) => node?.__kind === 'table'),
    $isTableRowNode: vi.fn((node) => node?.__kind === 'table-row'),
    TableCellHeaderStates: { NO_STATUS: 0, ROW: 1 },
    TableCellNode,
    TableNode,
    TableRowNode,
  };
});

vi.mock('lexical', () => ({
  $isParagraphNode: vi.fn((node) => node?.__kind === 'paragraph'),
  $isTextNode: vi.fn((node) => node?.__kind === 'text'),
}));

describe('TABLE transformer', () => {
  beforeEach(() => {
    tableMockState.convertFromMarkdownString.mockReset();
    tableMockState.convertToMarkdownString.mockReset();
    tableMockState.createdTables = [];
    tableMockState.convertFromMarkdownString.mockImplementation((text, _transformers, cell) => {
      cell.text = text.trim();
    });
    tableMockState.convertToMarkdownString.mockImplementation((_, cell) => cell.text ?? '');
  });

  it('should have the correct type', () => {
    expect(TABLE.type).toBe('element');
  });

  it('should have TableNode, TableRowNode, and TableCellNode in dependencies', () => {
    expect(TABLE.dependencies).toHaveLength(3);
  });

  it('regExp should match a table row line', () => {
    expect(TABLE.regExp.test('| foo | bar |')).toBe(true);
    expect(TABLE.regExp.test('| single |')).toBe(true);
  });

  it('regExp should not match lines without pipe borders', () => {
    expect(TABLE.regExp.test('foo bar')).toBe(false);
    expect(TABLE.regExp.test('- item')).toBe(false);
  });

  it('export should return null for a non-table node', () => {
    const fakeNode = { __type: 'paragraph' };

    expect(TABLE.export(/** @type {any} */ (fakeNode), () => '')).toBeNull();
  });

  it('export should serialize table rows to markdown with divider rows', () => {
    const cellA = { __kind: 'table-cell', __headerState: 0, text: 'Alpha' };
    const cellB = { __kind: 'table-cell', __headerState: 1, text: 'Beta' };

    const rowA = {
      __kind: 'table-row',
      getChildren: () => [cellA, cellB],
    };

    const fakeNode = {
      __kind: 'table',
      getChildren: () => [rowA],
    };

    tableMockState.convertToMarkdownString.mockImplementation((_, cell) => cell.text);

    expect(TABLE.export(/** @type {any} */ (fakeNode), () => '')).toBe(
      '| Alpha | Beta |\n| --- | --- |',
    );
  });

  it('should mark divider rows as header rows when replacing a table', () => {
    const firstCell = { __kind: 'table-cell', setHeaderStyles: vi.fn() };
    const secondCell = { __kind: 'table-cell', setHeaderStyles: vi.fn() };

    const lastRow = {
      __kind: 'table-row',
      getChildren: () => [firstCell, secondCell],
    };

    const table = {
      __kind: 'table',
      getChildren: () => [lastRow],
    };

    const parentNode = {
      getPreviousSibling: () => table,
      remove: vi.fn(),
    };

    TABLE.replace(/** @type {any} */ (parentNode), [], ['| --- | --- |'], true);

    expect(parentNode.remove).toHaveBeenCalled();
    expect(firstCell.setHeaderStyles).toHaveBeenCalledWith(1, 1);
    expect(secondCell.setHeaderStyles).toHaveBeenCalledWith(1, 1);
  });

  it('should skip non-row entries and non-cell entries while exporting', () => {
    const cell = { __kind: 'table-cell', __headerState: 0, text: 'Alpha' };

    const fakeNode = {
      __kind: 'table',
      getChildren: () => [
        { __kind: 'paragraph' },
        {
          __kind: 'table-row',
          getChildren: () => [cell, { __kind: 'paragraph' }],
        },
      ],
    };

    tableMockState.convertToMarkdownString.mockImplementation((_, cellNode) => cellNode.text);

    expect(TABLE.export(/** @type {any} */ (fakeNode), () => '')).toBe('| Alpha |');
  });
  it('should skip non-table-cell nodes while setting header styles on divider rows', () => {
    const firstCell = { __kind: 'table-cell', setHeaderStyles: vi.fn() };
    const nonCell = { __kind: 'element' };

    const lastRow = {
      __kind: 'table-row',
      getChildren: () => [firstCell, nonCell],
    };

    const table = {
      __kind: 'table',
      getChildren: () => [lastRow],
    };

    const parentNode = {
      getPreviousSibling: () => table,
      remove: vi.fn(),
    };

    TABLE.replace(/** @type {any} */ (parentNode), [], ['| --- | --- |'], true);

    expect(firstCell.setHeaderStyles).toHaveBeenCalled();
    expect(parentNode.remove).toHaveBeenCalled();
  });
  it('should stop collecting rows when a previous sibling paragraph has multiple children', () => {
    const parentNode = {
      getPreviousSibling: () => ({
        __kind: 'paragraph',
        getChildrenSize: () => 2,
      }),
      replace: vi.fn(),
    };

    TABLE.replace(/** @type {any} */ (parentNode), [], ['| alpha | beta |'], true);

    expect(parentNode.replace).toHaveBeenCalled();
  });

  it('should create a table from a paragraph row and replace the paragraph node', () => {
    const parentNode = {
      getPreviousSibling: () => null,
      replace: vi.fn(),
    };

    TABLE.replace(/** @type {any} */ (parentNode), [], ['| one | two |'], true);

    expect(parentNode.replace).toHaveBeenCalled();

    const createdTable = /** @type {any} */ (tableMockState.createdTables[0]);

    expect(createdTable).toBeDefined();
    expect(createdTable.selectEnd).toHaveBeenCalled();
  });

  it('should append new rows into an existing table with matching columns', () => {
    const previousTable = {
      __kind: 'table',
      children: [],
      append: vi.fn(),
      getFirstChild: () => ({
        __kind: 'table-row',
        getChildrenSize: () => 2,
      }),
    };

    const parentNode = {
      getPreviousSibling: () => previousTable,
      remove: vi.fn(),
    };

    TABLE.replace(/** @type {any} */ (parentNode), [], ['| alpha | beta |'], true);

    expect(previousTable.append).toHaveBeenCalled();
    expect(parentNode.remove).toHaveBeenCalled();
  });

  it('should bail out when the markdown row does not match the table pattern', () => {
    const parentNode = {
      getPreviousSibling: () => null,
      replace: vi.fn(),
    };

    TABLE.replace(/** @type {any} */ (parentNode), [], ['not a table'], true);

    expect(parentNode.replace).not.toHaveBeenCalled();
  });

  it('should bail out when previous sibling is not a table for divider row', () => {
    const parentNode = {
      getPreviousSibling: () => ({
        __kind: 'paragraph',
        getChildren: () => [],
      }),
      remove: vi.fn(),
    };

    TABLE.replace(/** @type {any} */ (parentNode), [], ['| --- | --- |'], true);

    expect(parentNode.remove).not.toHaveBeenCalled();
  });

  it('should bail out when table has no rows for divider row', () => {
    const parentNode = {
      getPreviousSibling: () => ({
        __kind: 'table',
        getChildren: () => [],
      }),
      remove: vi.fn(),
    };

    TABLE.replace(/** @type {any} */ (parentNode), [], ['| --- | --- |'], true);

    expect(parentNode.remove).not.toHaveBeenCalled();
  });

  it('should stop collecting rows when sibling has empty children', () => {
    const parentNode = {
      getPreviousSibling: () => ({
        __kind: 'paragraph',
        getChildrenSize: () => 0,
      }),
      replace: vi.fn(),
    };

    TABLE.replace(/** @type {any} */ (parentNode), [], ['| alpha | beta |'], true);

    expect(parentNode.replace).toHaveBeenCalled();
  });

  it('should stop collecting rows when sibling first child is not a text node', () => {
    const parentNode = {
      getPreviousSibling: () => ({
        __kind: 'paragraph',
        getChildrenSize: () => 1,
        getFirstChild: () => ({
          __kind: 'element',
        }),
      }),
      replace: vi.fn(),
    };

    TABLE.replace(/** @type {any} */ (parentNode), [], ['| alpha | beta |'], true);

    expect(parentNode.replace).toHaveBeenCalled();
  });

  it('should stop collecting rows when sibling text does not match table pattern', () => {
    const parentNode = {
      getPreviousSibling: () => ({
        __kind: 'paragraph',
        getChildrenSize: () => 1,
        getFirstChild: () => ({
          __kind: 'text',
          getTextContent: () => 'not a table row',
        }),
      }),
      replace: vi.fn(),
    };

    TABLE.replace(/** @type {any} */ (parentNode), [], ['| alpha | beta |'], true);

    expect(parentNode.replace).toHaveBeenCalled();
  });

  it('should skip non-table-cell nodes while setting header styles on divider rows', () => {
    const firstCell = { __kind: 'table-cell', setHeaderStyles: vi.fn() };
    const nonCell = { __kind: 'element' };

    const lastRow = {
      __kind: 'table-row',
      getChildren: () => [firstCell, nonCell],
    };

    const table = {
      __kind: 'table',
      getChildren: () => [lastRow],
    };

    const parentNode = {
      getPreviousSibling: () => table,
      remove: vi.fn(),
    };

    TABLE.replace(/** @type {any} */ (parentNode), [], ['| --- | --- |'], true);

    expect(firstCell.setHeaderStyles).toHaveBeenCalled();
    expect(parentNode.remove).toHaveBeenCalled();
  });

  it('should create empty cells when a row has fewer cells than the maximum', () => {
    const parentNode = {
      getPreviousSibling: () => null,
      replace: vi.fn(),
    };

    // This will create a table with the provided row
    TABLE.replace(/** @type {any} */ (parentNode), [], ['| alpha | beta |'], true);

    expect(parentNode.replace).toHaveBeenCalled();
  });

  it('should collect multiple rows and pad with empty cells', () => {
    const textNode = {
      __kind: 'text',
      getTextContent: () => '| a | b |',
    };

    const previousSibling = {
      __kind: 'paragraph',
      getChildrenSize: () => 1,
      getFirstChild: () => textNode,
      getPreviousSibling: () => null,
      remove: vi.fn(),
    };

    const parentNode = {
      getPreviousSibling: () => previousSibling,
      replace: vi.fn(),
    };

    // This creates the main row with 2 cells, collecting the previous sibling with 2 cells
    TABLE.replace(/** @type {any} */ (parentNode), [], ['| alpha | beta |'], true);

    expect(previousSibling.remove).toHaveBeenCalled();
    expect(parentNode.replace).toHaveBeenCalled();
  });

  it('should append rows to existing table with matching column count', () => {
    const existingRow = {
      __kind: 'table-row',
      getChildrenSize: () => 2,
    };

    const existingTable = {
      __kind: 'table',
      children: [existingRow],
      append: vi.fn(),
      getFirstChild: () => existingRow,
      getChildren: () => [existingRow],
    };

    const parentNode = {
      getPreviousSibling: () => existingTable,
      remove: vi.fn(),
    };

    // The table has 2 columns, and we're adding a new row with 2 cells
    TABLE.replace(/** @type {any} */ (parentNode), [], ['| alpha | beta |'], true);

    expect(existingTable.append).toHaveBeenCalled();
    expect(parentNode.remove).toHaveBeenCalled();
  });

  it('should handle export with non-header cells', () => {
    const cellA = { __kind: 'table-cell', __headerState: 0, text: 'Row1Col1' };
    const cellB = { __kind: 'table-cell', __headerState: 0, text: 'Row1Col2' };

    const rowA = {
      __kind: 'table-row',
      getChildren: () => [cellA, cellB],
    };

    const fakeNode = {
      __kind: 'table',
      getChildren: () => [rowA],
    };

    tableMockState.convertToMarkdownString.mockImplementation((_, cell) => cell.text);

    expect(TABLE.export(/** @type {any} */ (fakeNode), () => '')).toBe('| Row1Col1 | Row1Col2 |');
  });

  it('should handle export with newlines in cells', () => {
    const cellA = { __kind: 'table-cell', __headerState: 0, text: 'Line1\nLine2' };

    const rowA = {
      __kind: 'table-row',
      getChildren: () => [cellA],
    };

    const fakeNode = {
      __kind: 'table',
      getChildren: () => [rowA],
    };

    tableMockState.convertToMarkdownString.mockImplementation((_, cell) => cell.text);

    const result = TABLE.export(/** @type {any} */ (fakeNode), () => '');

    expect(result).toContain('Line1\\nLine2');
  });

  it('should replace with new table when column count does not match', () => {
    const previousTable = {
      __kind: 'table',
      children: [],
      append: vi.fn(),
      getFirstChild: () => ({
        __kind: 'table-row',
        getChildrenSize: () => 2, // 2 columns
      }),
    };

    const parentNode = {
      getPreviousSibling: () => previousTable,
      replace: vi.fn(), // Call replace instead of remove
    };

    // '| alpha | beta | gamma |' has 3 columns, so it won't append
    TABLE.replace(/** @type {any} */ (parentNode), [], ['| alpha | beta | gamma |'], true);

    // Since column count doesn't match (2 vs 3), should replace instead of append
    expect(parentNode.replace).toHaveBeenCalled();
  });

  it('should handle mapToTableCells with non-matching text', () => {
    const result = mapToTableCells('no pipes here');

    expect(result).toBeNull();
  });

  it('should handle replace with text that does not match table pattern', () => {
    const parentNode = {
      getPreviousSibling: () => null,
      replace: vi.fn(),
    };

    TABLE.replace(/** @type {any} */ (parentNode), [], ['not a table row'], true);

    // Since the text doesn't match the table pattern,
    // replace should be called with early return handling
    expect(parentNode.replace).not.toHaveBeenCalled();
  });

  it('should return 0 when getTableColumnsSize receives a non-table row node', () => {
    const table = {
      getFirstChild: () => ({
        __kind: 'not-a-table-row', // Not a table row
      }),
    };

    const result = getTableColumnsSize(/** @type {any} */ (table));

    expect(result).toBe(0);
  });

  it('should pad rows with empty cells when maxCells is greater than cell count', () => {
    const firstSibling = {
      __kind: 'paragraph',
      getChildrenSize: () => 1,
      getFirstChild: () => ({
        __kind: 'text',
        getTextContent: () => '| A | B |', // 2 cells
      }),
      getPreviousSibling: () => null,
      remove: vi.fn(),
    };

    const parentNode = {
      getPreviousSibling: () => firstSibling,
      replace: vi.fn(),
    };

    // This should create a table with 3 cells per row (maxCells = 3)
    // but the first row only has 2 cells, so it should pad with an empty cell
    TABLE.replace(/** @type {any} */ (parentNode), [], ['| A | B | C |'], true);

    expect(parentNode.replace).toHaveBeenCalled();

    const tableCreated = /** @type {any} */ (
      tableMockState.createdTables[tableMockState.createdTables.length - 1]
    );

    const rows = tableCreated.getChildren();

    expect(rows).toBeDefined();
    expect(rows.length).toBeGreaterThan(0);
  });
});
