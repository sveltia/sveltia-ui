/**
 * Helpers for inserting block nodes, like a table or a horizontal rule, into the rich text editor.
 * Functions starting with `$` must be called within an editor update.
 */

import { $createHorizontalRuleNode as createHorizontalRuleNode } from '@lexical/extension';
import { $insertNodeToNearestRoot as insertNodeToNearestRoot } from '@lexical/utils';
import {
  $createParagraphNode as createParagraphNode,
  $getPreviousSelection as getPreviousSelection,
  $getSelection as getSelection,
  $isElementNode as isElementNode,
  $isParagraphNode as isParagraphNode,
  $isRangeSelection as isRangeSelection,
  $isRootNode as isRootNode,
  $setSelection as setSelection,
} from 'lexical';

/**
 * @import { LexicalNode } from 'lexical';
 * @import { HorizontalRuleNode } from '@lexical/extension';
 */

/**
 * Insert the given block node at the selection, which is restored if the focus has moved to the
 * toolbar or a dialog in the meantime. The node takes the place of the empty paragraph the caret is
 * in, rather than leaving the paragraph above it. Otherwise, the block the caret is in is split at
 * the caret, and the node is inserted in between.
 * @template {LexicalNode} T
 * @param {T} node Node.
 * @returns {T} The node, once inserted.
 */
export const $insertBlockNode = (node) => {
  const selection = getSelection() ?? getPreviousSelection();

  if (selection && !getSelection()) {
    setSelection(selection.clone());
  }

  const anchor = isRangeSelection(selection) ? selection.anchor.getNode() : null;

  if (isParagraphNode(anchor) && anchor.isEmpty() && isRootNode(anchor.getParent())) {
    return anchor.replace(node);
  }

  return insertNodeToNearestRoot(node);
};

/**
 * Insert a horizontal rule at the selection, and move the caret to the start of the block after it,
 * or a new paragraph if there’s none to type in.
 * @returns {HorizontalRuleNode} The rule.
 */
export const $insertHorizontalRule = () => {
  const rule = $insertBlockNode(createHorizontalRuleNode());
  const next = rule.getNextSibling();

  if (isElementNode(next)) {
    next.selectStart();
  } else {
    rule.insertAfter(createParagraphNode()).selectStart();
  }

  return rule;
};
