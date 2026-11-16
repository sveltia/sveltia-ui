// Adopted from https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/plugins/MarkdownTransformers/index.ts

/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable jsdoc/require-returns-description */
/* eslint-disable jsdoc/require-param-description */

import {
  $convertFromMarkdownString as convertFromMarkdownString,
  $convertToMarkdownString as convertToMarkdownString,
  LINK as LEXICAL_LINK,
  TRANSFORMERS,
} from '@lexical/markdown';
import {
  $createTableCellNode as createTableCellNode,
  $createTableNode as createTableNode,
  $createTableRowNode as createTableRowNode,
  $isTableCellNode as isTableCellNode,
  $isTableNode as isTableNode,
  $isTableRowNode as isTableRowNode,
  TableCellHeaderStates,
  TableCellNode,
  TableNode,
  TableRowNode,
} from '@lexical/table';
import { $isParagraphNode as isParagraphNode, $isTextNode as isTextNode } from 'lexical';

import { findCodeSpans } from '../markdown/index.js';
import { BLOCK_SYNTAX_ESCAPE } from './block-escape.js';
import { LEADING_INLINE_CODE } from './inline-code.js';
import { LINK } from './link.js';
import { RAW_HTML, RAW_SYNTAX } from './raw-syntax.js';

/**
 * @import { ElementTransformer, TextMatchTransformer, Transformer } from '@lexical/markdown';
 * @import { ElementFormatType, ElementNode } from 'lexical';
 */

const TABLE_ROW_REG_EXP = /^(?:\|)(.+)(?:\|)\s?$/;
/**
 * Regular expression to match a delimiter row, like `| --- | :-: |`. Each cell needs a hyphen, so a
 * row of empty cells, like `|  |  |`, is an empty header row, not a delimiter row.
 * @see https://github.github.com/gfm/#delimiter-row
 */
const TABLE_ROW_DIVIDER_REG_EXP = /^(?:\|[ \t]*:?-+:?[ \t]*)+\|\s?$/;
/**
 * Delimiter row cell for each column alignment, which is kept as the format of the column’s cells.
 * @type {Record<string, string>}
 */
const ALIGNMENT_DELIMITERS = { left: ':---', center: ':---:', right: '---:' };

/**
 * Get the alignment of a column from its delimiter row cell, like `:-:`.
 * @param {string} delimiter Delimiter row cell.
 * @returns {ElementFormatType} Alignment, or an empty string for the default.
 */
const getColumnAlignment = (delimiter) => {
  const text = delimiter.trim();
  const left = text.startsWith(':');
  const right = text.endsWith(':');

  return left && right ? 'center' : left ? 'left' : right ? 'right' : '';
};

/**
 * Regular expression to match `\n` in a cell, which stands for a line break unless its backslash is
 * escaped, like `\\n`. The backslashes before it, if any, are captured in pairs.
 */
const CELL_LINE_BREAK_REG_EXP = /(?<!\\)((?:\\\\)*)\\n/g;

/**
 * Replace the given text in a cell except within code spans, where it’s literal.
 * @param {string} text Markdown of a cell.
 * @param {(text: string) => string} replace Function to replace the text outside code spans.
 * @returns {string} Replaced Markdown.
 */
const replaceOutsideCodeSpans = (text, replace) => {
  let result = '';
  let index = 0;

  findCodeSpans(text).forEach(({ start, end }) => {
    result += replace(text.slice(index, start)) + text.slice(start, end);
    index = end;
  });

  return result + replace(text.slice(index));
};

/**
 * Returns the number of columns in the table.
 * @internal
 * @param {TableNode} table
 * @returns {number}
 */
export const getTableColumnsSize = (table) => {
  const row = table.getFirstChild();

  return isTableRowNode(row) ? row.getChildrenSize() : 0;
};

/**
 * Creates a table cell with the given text content.
 * @param {string} textContent
 * @param {Transformer[]} transformers Transformers to import the cell content with.
 * @returns {TableCellNode}
 */
const createTableCell = (textContent, transformers) => {
  // `\n` is a line break in the cell, except within inline code, where it’s literal, or after an
  // escaped backslash. An escaped pipe is part of the cell, even within inline code, like GitHub
  // Flavored Markdown. The spaces around the content only separate it from the pipes
  textContent = replaceOutsideCodeSpans(textContent.trim(), (text) =>
    text.replace(CELL_LINE_BREAK_REG_EXP, '$1\n'),
  ).replace(/\\\|/g, '|');

  const cell = createTableCellNode(TableCellHeaderStates.NO_STATUS);

  convertFromMarkdownString(textContent, transformers, cell);

  return cell;
};

/**
 * Maps the given text content to an array of table cells.
 * @internal
 * @param {string} textContent
 * @param {Transformer[]} transformers Transformers to import the cell content with.
 * @returns {TableCellNode[] | null}
 */
export const mapToTableCells = (textContent, transformers) => {
  const [, match] = textContent.match(TABLE_ROW_REG_EXP) ?? [];

  if (!match) {
    return null;
  }

  // Split the row at the pipes that are not escaped, which are preceded by an even number of
  // backslashes
  return match.split(/(?<=(?<!\\)(?:\\\\)*)\|/).map((text) => createTableCell(text, transformers));
};

/**
 * Export a table row to Markdown, followed by a delimiter row if it’s a header row.
 * @param {TableRowNode} row Table row.
 * @param {Transformer[]} transformers Transformers to export the cell content with.
 * @returns {string[]} Lines.
 */
const exportTableRow = (row, transformers) => {
  /** @type {string[]} */
  const rowOutput = [];
  /** @type {TableCellNode[]} */
  const cells = [];
  let isHeaderRow = false;

  row.getChildren().forEach((cell) => {
    // It’s TableCellNode so it’s just to make flow happy
    if (isTableCellNode(cell)) {
      rowOutput.push(
        // A backslash followed by `n` in text, like that in `C:\new`, is escaped, so it’s not read
        // as a line break; it means the same in Markdown. Inline code is left as is, as `\n` is
        // literal there
        replaceOutsideCodeSpans(convertToMarkdownString(transformers, cell), (text) =>
          text.replace(CELL_LINE_BREAK_REG_EXP, '$1\\\\n'),
        )
          // Escape a pipe, which would otherwise end the cell, even within inline code
          .replace(/\|/g, '\\|')
          .replace(/\n/g, '\\n')
          .trim(),
      );
      cells.push(cell);

      if (cell.__headerState === TableCellHeaderStates.ROW) {
        isHeaderRow = true;
      }
    }
  });

  const lines = [`| ${rowOutput.join(' | ')} |`];

  if (isHeaderRow) {
    lines.push(
      `| ${cells.map((cell) => ALIGNMENT_DELIMITERS[cell.getFormatType()] ?? '---').join(' | ')} |`,
    );
  }

  return lines;
};

/**
 * Turn the last row of the table before a delimiter row into the header row, and remove the
 * delimiter row. Nothing happens if there is no such table.
 * @param {ElementNode} parentNode Paragraph holding the delimiter row.
 * @param {string} textContent Delimiter row, like `| --- | :-: |`.
 */
const $applyHeaderRow = (parentNode, textContent) => {
  const table = parentNode.getPreviousSibling();

  if (!table || !isTableNode(table)) {
    return;
  }

  const rows = table.getChildren();
  const lastRow = rows[rows.length - 1];

  if (!lastRow || !isTableRowNode(lastRow)) {
    return;
  }

  const alignments = textContent.trim().slice(1, -1).split('|').map(getColumnAlignment);

  // Add header state to row cells, and the column alignment, which the rows that follow take from
  // the header row
  lastRow.getChildren().forEach((cell, index) => {
    if (!isTableCellNode(cell)) {
      return;
    }

    cell.setHeaderStyles(TableCellHeaderStates.ROW, TableCellHeaderStates.ROW);
    cell.setFormat(alignments[index] ?? '');
  });

  // Remove line
  parentNode.remove();
};

/**
 * Take the table rows from the paragraphs right before the given one, removing those paragraphs.
 * @param {ElementNode} parentNode Paragraph holding the current table row.
 * @param {Transformer[]} transformers Transformers to import the cell content with.
 * @returns {TableCellNode[][]} Cells of each row, in the document order.
 */
const $takePrecedingRows = (parentNode, transformers) => {
  /** @type {TableCellNode[][]} */
  const rows = [];
  let sibling = parentNode.getPreviousSibling();

  while (sibling) {
    if (!isParagraphNode(sibling)) {
      break;
    }

    if (sibling.getChildrenSize() !== 1) {
      break;
    }

    const firstChild = sibling.getFirstChild();

    if (!isTextNode(firstChild)) {
      break;
    }

    const cells = mapToTableCells(firstChild.getTextContent(), transformers);

    if (!cells) {
      break;
    }

    rows.unshift(cells);

    const previousSibling = sibling.getPreviousSibling();

    sibling.remove();
    sibling = previousSibling;
  }

  return rows;
};

/**
 * Create a table from the given rows, padding the shorter ones with empty cells.
 * @param {TableCellNode[][]} rows Cells of each row.
 * @param {Transformer[]} transformers Transformers to import the empty cell content with.
 * @param {number} [columnsSize] Number of columns. The cells beyond it are dropped. The default is
 * the number of cells in the longest row.
 * @returns {TableNode} Table.
 */
const $createTable = (
  rows,
  transformers,
  columnsSize = Math.max(...rows.map((cells) => cells.length)),
) => {
  const table = createTableNode();

  rows.forEach((cells) => {
    const tableRow = createTableRowNode();

    table.append(tableRow);

    for (let i = 0; i < columnsSize; i += 1) {
      tableRow.append(i < cells.length ? cells[i] : createTableCell('', transformers));
    }
  });

  return table;
};

/**
 * Put a new table with the given rows in place of the given paragraph, or add the rows to the table
 * right before it if that has a header row or the same number of columns. Like GitHub Flavored
 * Markdown, a row with fewer cells than the header row is padded with empty cells, and the cells
 * beyond it are dropped. The rows then take the column alignment from the header.
 * @param {ElementNode} parentNode Paragraph to replace.
 * @param {TableCellNode[][]} rows Cells of each row.
 * @param {Transformer[]} transformers Transformers to import the empty cell content with.
 * @see https://github.github.com/gfm/#tables-extension-
 */
const $insertImportedTable = (parentNode, rows, transformers) => {
  const previousSibling = parentNode.getPreviousSibling();
  const headerRow = isTableNode(previousSibling) ? previousSibling.getFirstChild() : null;
  const headerCells = isTableRowNode(headerRow) ? headerRow.getChildren() : [];

  const hasHeaderRow = headerCells.some(
    (cell) => isTableCellNode(cell) && cell.hasHeaderState(TableCellHeaderStates.ROW),
  );

  /** @type {TableNode} */
  let table;

  if (
    isTableNode(previousSibling) &&
    (hasHeaderRow ||
      getTableColumnsSize(previousSibling) === Math.max(...rows.map((cells) => cells.length)))
  ) {
    table = $createTable(rows, transformers, headerCells.length);

    table.getChildren().forEach((row) => {
      /** @type {TableRowNode} */ (row).getChildren().forEach((cell, index) => {
        /** @type {TableCellNode} */ (cell).setFormat(
          /** @type {TableCellNode} */ (headerCells[index]).getFormatType(),
        );
      });
    });

    previousSibling.append(...table.getChildren());
    parentNode.remove();
  } else {
    table = $createTable(rows, transformers);
    parentNode.replace(table);
  }

  table.selectEnd();
};

/**
 * Create a table transformer. A cell can only have inline content, so it’s converted with the
 * standard Markdown transformers and the given text match transformers, like those of the inline
 * editor components, which come first to take priority, as they do for the rest of the document.
 * @param {TextMatchTransformer[]} [cellTransformers] Additional transformers for the cell content.
 * @returns {ElementTransformer}
 */
export const createTableTransformer = (cellTransformers = []) => {
  /** @type {Transformer[]} */
  const transformers = [
    ...cellTransformers,
    ...TRANSFORMERS.map((transformer) => (transformer === LEXICAL_LINK ? LINK : transformer)),
    LEADING_INLINE_CODE,
    RAW_HTML,
    RAW_SYNTAX,
  ];

  /** @type {Transformer[]} */
  const exportTransformers = [...transformers, BLOCK_SYNTAX_ESCAPE];

  return {
    dependencies: [TableNode, TableRowNode, TableCellNode],
    export: (node) => {
      if (!isTableNode(node)) {
        return null;
      }

      return node
        .getChildren()
        .flatMap((row) => (isTableRowNode(row) ? exportTableRow(row, exportTransformers) : []))
        .join('\n');
    },
    regExp: TABLE_ROW_REG_EXP,
    replace: (parentNode, _children, [textContent]) => {
      // Header row
      if (TABLE_ROW_DIVIDER_REG_EXP.test(textContent)) {
        $applyHeaderRow(parentNode, textContent);

        return;
      }

      const matchCells = mapToTableCells(textContent, transformers);

      if (!matchCells) {
        return;
      }

      const rows = [...$takePrecedingRows(parentNode, transformers), matchCells];

      $insertImportedTable(parentNode, rows, transformers);
    },
    type: 'element',
  };
};
