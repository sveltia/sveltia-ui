// Adopted from https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/plugins/MarkdownTransformers/index.ts

/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable jsdoc/require-returns-description */
/* eslint-disable jsdoc/require-param-description */

import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from '@lexical/markdown';
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  TableCellHeaderStates,
  TableCellNode,
  TableNode,
  TableRowNode,
} from '@lexical/table';
import { $isParagraphNode, $isTextNode } from 'lexical';

/**
 * @import { ElementTransformer } from '@lexical/markdown';
 */

const TABLE_ROW_REG_EXP = /^(?:\|)(.+)(?:\|)\s?$/;
const TABLE_ROW_DIVIDER_REG_EXP = /^(\| ?:?-*:? ?)+\|\s?$/;

/**
 * Returns the number of columns in the table.
 * @param {TableNode} table
 * @returns {number}
 */
function getTableColumnsSize(table) {
  const row = table.getFirstChild();

  return $isTableRowNode(row) ? row.getChildrenSize() : 0;
}

/**
 * Creates a table cell with the given text content.
 * @param {string} textContent
 * @returns {TableCellNode}
 */
const createTableCell = (textContent) => {
  textContent = textContent.replace(/\\n/g, '\n');

  const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);

  $convertFromMarkdownString(textContent, TRANSFORMERS, cell);

  return cell;
};

/**
 * Maps the given text content to an array of table cells.
 * @param {string} textContent
 * @returns {TableCellNode[] | null}
 */
const mapToTableCells = (textContent) => {
  const [, match] = textContent.match(TABLE_ROW_REG_EXP) ?? [];

  if (!match) {
    return null;
  }

  return match.split('|').map((text) => createTableCell(text));
};

/**
 * @type {ElementTransformer}
 */
export const TABLE = {
  dependencies: [TableNode, TableRowNode, TableCellNode],
  export: (node) => {
    if (!$isTableNode(node)) {
      return null;
    }

    /** @type {string[]} */
    const output = [];

    node.getChildren().forEach((row) => {
      /** @type {string[]} */
      const rowOutput = [];

      if (!$isTableRowNode(row)) {
        return;
      }

      let isHeaderRow = false;

      row.getChildren().forEach((cell) => {
        // It’s TableCellNode so it’s just to make flow happy
        if ($isTableCellNode(cell)) {
          rowOutput.push($convertToMarkdownString(TRANSFORMERS, cell).replace(/\n/g, '\\n').trim());

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

      if (!table || !$isTableNode(table)) {
        return;
      }

      const rows = table.getChildren();
      const lastRow = rows[rows.length - 1];

      if (!lastRow || !$isTableRowNode(lastRow)) {
        return;
      }

      // Add header state to row cells
      lastRow.getChildren().forEach((cell) => {
        if (!$isTableCellNode(cell)) {
          return;
        }

        cell.setHeaderStyles(TableCellHeaderStates.ROW, TableCellHeaderStates.ROW);
      });

      // Remove line
      parentNode.remove();

      return;
    }

    const matchCells = mapToTableCells(textContent);

    if (!matchCells) {
      return;
    }

    const rows = [matchCells];
    let sibling = parentNode.getPreviousSibling();
    let maxCells = matchCells.length;

    while (sibling) {
      if (!$isParagraphNode(sibling)) {
        break;
      }

      if (sibling.getChildrenSize() !== 1) {
        break;
      }

      const firstChild = sibling.getFirstChild();

      if (!$isTextNode(firstChild)) {
        break;
      }

      const cells = mapToTableCells(firstChild.getTextContent());

      if (!cells) {
        break;
      }

      maxCells = Math.max(maxCells, cells.length);
      rows.unshift(cells);

      const previousSibling = sibling.getPreviousSibling();

      sibling.remove();
      sibling = previousSibling;
    }

    const table = $createTableNode();

    rows.forEach((cells) => {
      const tableRow = $createTableRowNode();

      table.append(tableRow);

      for (let i = 0; i < maxCells; i += 1) {
        tableRow.append(i < cells.length ? cells[i] : createTableCell(''));
      }
    });

    const previousSibling = parentNode.getPreviousSibling();

    if ($isTableNode(previousSibling) && getTableColumnsSize(previousSibling) === maxCells) {
      previousSibling.append(...table.getChildren());
      parentNode.remove();
    } else {
      parentNode.replace(table);
    }

    table.selectEnd();
  },
  type: 'element',
};
