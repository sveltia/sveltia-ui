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

import { BLOCK_SYNTAX_ESCAPE } from './block-escape.js';
import { LEADING_INLINE_CODE } from './inline-code.js';
import { LINK } from './link.js';
import { RAW_HTML, RAW_SYNTAX } from './raw-syntax.js';

/**
 * @import { ElementTransformer, TextMatchTransformer, Transformer } from '@lexical/markdown';
 * @import { ElementFormatType } from 'lexical';
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
  // An escaped pipe is part of the cell, even within inline code, like GitHub Flavored Markdown.
  // The spaces around the content only separate it from the pipes
  textContent = textContent.trim().replace(/\\n/g, '\n').replace(/\\\|/g, '|');

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

      /** @type {string[]} */
      const output = [];

      node.getChildren().forEach((row) => {
        /** @type {string[]} */
        const rowOutput = [];
        /** @type {TableCellNode[]} */
        const cells = [];

        if (!isTableRowNode(row)) {
          return;
        }

        let isHeaderRow = false;

        row.getChildren().forEach((cell) => {
          // It’s TableCellNode so it’s just to make flow happy
          if (isTableCellNode(cell)) {
            rowOutput.push(
              convertToMarkdownString(exportTransformers, cell)
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

        output.push(`| ${rowOutput.join(' | ')} |`);

        if (isHeaderRow) {
          output.push(
            `| ${cells.map((cell) => ALIGNMENT_DELIMITERS[cell.getFormatType()] ?? '---').join(' | ')} |`,
          );
        }
      });

      return output.join('\n');
    },
    regExp: TABLE_ROW_REG_EXP,
    replace: (parentNode, _children, [textContent]) => {
      // Header row
      if (TABLE_ROW_DIVIDER_REG_EXP.test(textContent)) {
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

        // Add header state to row cells, and the column alignment, which the rows that follow take
        // from the header row
        lastRow.getChildren().forEach((cell, index) => {
          if (!isTableCellNode(cell)) {
            return;
          }

          cell.setHeaderStyles(TableCellHeaderStates.ROW, TableCellHeaderStates.ROW);
          cell.setFormat(alignments[index] ?? '');
        });

        // Remove line
        parentNode.remove();

        return;
      }

      const matchCells = mapToTableCells(textContent, transformers);

      if (!matchCells) {
        return;
      }

      const rows = [matchCells];
      let sibling = parentNode.getPreviousSibling();
      let maxCells = matchCells.length;

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

        maxCells = Math.max(maxCells, cells.length);
        rows.unshift(cells);

        const previousSibling = sibling.getPreviousSibling();

        sibling.remove();
        sibling = previousSibling;
      }

      const table = createTableNode();

      rows.forEach((cells) => {
        const tableRow = createTableRowNode();

        table.append(tableRow);

        for (let i = 0; i < maxCells; i += 1) {
          tableRow.append(i < cells.length ? cells[i] : createTableCell('', transformers));
        }
      });

      const previousSibling = parentNode.getPreviousSibling();

      if (isTableNode(previousSibling) && getTableColumnsSize(previousSibling) === maxCells) {
        const headerCells = /** @type {TableRowNode} */ (
          previousSibling.getFirstChild()
        ).getChildren();

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
        parentNode.replace(table);
      }

      table.selectEnd();
    },
    type: 'element',
  };
};
