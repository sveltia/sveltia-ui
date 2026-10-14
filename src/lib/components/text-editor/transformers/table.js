// Adopted from https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/plugins/MarkdownTransformers/index.ts

/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable jsdoc/require-returns-description */
/* eslint-disable jsdoc/require-param-description */

import {
  $convertFromMarkdownString as convertFromMarkdownString,
  $convertToMarkdownString as convertToMarkdownString,
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

/**
 * @import { ElementTransformer, TextMatchTransformer, Transformer } from '@lexical/markdown';
 */

const TABLE_ROW_REG_EXP = /^(?:\|)(.+)(?:\|)\s?$/;
const TABLE_ROW_DIVIDER_REG_EXP = /^(\| ?:?-*:? ?)+\|\s?$/;

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
  const transformers = [...cellTransformers, ...TRANSFORMERS];
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

            if (cell.__headerState === TableCellHeaderStates.ROW) {
              isHeaderRow = true;
            }
          }
        });

        output.push(`| ${rowOutput.join(' | ')} |`);

        if (isHeaderRow) {
          output.push(`| ${rowOutput.map(() => '---').join(' | ')} |`);
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

        // Add header state to row cells
        lastRow.getChildren().forEach((cell) => {
          if (!isTableCellNode(cell)) {
            return;
          }

          cell.setHeaderStyles(TableCellHeaderStates.ROW, TableCellHeaderStates.ROW);
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
