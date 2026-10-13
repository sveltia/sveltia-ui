/**
 * Text alignment helpers for the rich text editor. Alignment is only available for HTML, as
 * Markdown has no syntax for it. Functions starting with `$` must be called within an editor update
 * or read.
 */

import { $findMatchingParent as findMatchingParent } from '@lexical/utils';
import {
  $getSelection as getSelection,
  $isElementNode as isElementNode,
  $isRangeSelection as isRangeSelection,
} from 'lexical';

/**
 * @import { ElementFormatType, ElementNode } from 'lexical';
 */

/**
 * Get the text alignment of the block the selection’s anchor is in, like a paragraph, a heading or
 * a list item.
 * @returns {ElementFormatType} Alignment. An empty string means the default alignment, as well as
 * no selection.
 */
export const $getSelectedAlignment = () => {
  const selection = getSelection();

  if (!isRangeSelection(selection)) {
    return '';
  }

  const block = /** @type {ElementNode | null} */ (
    findMatchingParent(
      selection.anchor.getNode(),
      (node) => isElementNode(node) && !node.isInline(),
    )
  );

  // The caret can be on the root itself, between blocks, like next to a horizontal rule
  return block?.getFormatType() ?? '';
};
