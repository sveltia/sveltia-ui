/**
 * The state of the editor selection, for the toolbar.
 */

import {
  $isCodeHighlightNode as isCodeHighlightNode,
  $isCodeNode as isCodeNode,
} from '@lexical/code-core';
import { $isLinkNode as isLinkNode } from '@lexical/link';
import {
  $isListItemNode as isListItemNode,
  $isListNode as isListNode,
  ListNode,
} from '@lexical/list';
import { $isHeadingNode as isHeadingNode, $isQuoteNode as isQuoteNode } from '@lexical/rich-text';
import { $getNearestNodeOfType as getNearestNodeOfType } from '@lexical/utils';
import {
  ElementNode,
  $getSelection as getSelection,
  $isRangeSelection as isRangeSelection,
} from 'lexical';
import { BLOCK_BUTTON_TYPES, LIST_TYPES, TEXT_FORMAT_BUTTON_TYPES } from '../constants.js';
import { $getSelectedAlignment } from './alignment.js';
import { $findSelectedLink } from './link.js';
import { $getSelectedTableCellKey } from './table.js';

/**
 * @import { LexicalNode } from 'lexical';
 * @import {
 * TextEditorBlockType,
 * TextEditorInlineType,
 * TextEditorSelectionState,
 * } from '#lib/typedefs.js';
 */

/**
 * Get the given node itself if it’s an element node, or its nearest element node ancestor.
 * @param {LexicalNode} node Node.
 * @returns {ElementNode | null} Element node.
 */
export const getNearestElementNode = (node) =>
  node instanceof ElementNode ? node : getNearestNodeOfType(node, ElementNode);

/**
 * Get the block type of the given node, for the toolbar.
 * @param {ElementNode | null} node Block node, or its nearest element node.
 * @returns {TextEditorBlockType} Block type.
 */
const getBlockType = (node) => {
  if (!node) {
    return 'paragraph';
  }

  if (isHeadingNode(node)) {
    return /** @type {TextEditorBlockType} */ (`heading-${node.getTag().match(/\d/)?.[0]}`);
  }

  if (isListNode(node)) {
    const listType = node.getListType();

    return /** @type {TextEditorBlockType} */ (
      LIST_TYPES.find((list) => list.listType === listType)?.type
    );
  }

  if (isQuoteNode(node)) {
    return 'blockquote';
  }

  if (isCodeNode(node) || isCodeHighlightNode(node)) {
    return 'code-block';
  }

  const type = node.getType();

  if (BLOCK_BUTTON_TYPES.includes(/** @type {any} */ (type))) {
    return /** @type {TextEditorBlockType} */ (type);
  }

  return 'paragraph';
};

/**
 * Get the current selection’s block node key as well as block and inline level types.
 * @internal
 * @returns {TextEditorSelectionState} Current selection state.
 */
export const getSelectionTypes = () => {
  const selection = getSelection();

  if (!isRangeSelection(selection)) {
    return {
      blockNodeKey: null,
      blockType: 'paragraph',
      inlineTypes: [],
      // Several cells can be selected at once
      tableCellKey: $getSelectedTableCellKey(),
      alignment: '',
    };
  }

  const anchor = selection.anchor.getNode();
  /** @type {ElementNode | null} */
  let parent = null;
  /** @type {TextEditorInlineType[]} */
  const inlineTypes = TEXT_FORMAT_BUTTON_TYPES.filter((type) => selection.hasFormat(type));

  // Same rule as the link editor: the whole selection has to be in the same link
  if ($findSelectedLink()) {
    inlineTypes.push('link');
  }

  if (anchor.getType() !== 'root') {
    parent = getNearestElementNode(anchor);

    // `getNearestNodeOfType()` would return the link itself, so start from its parent to find the
    // block the link is in
    if (isLinkNode(parent)) {
      parent = parent.getParent();
    }

    if (isListItemNode(parent)) {
      parent = getNearestNodeOfType(parent, ListNode);
    }
  }

  const blockType = getBlockType(parent);

  return {
    blockNodeKey: parent?.getKey() ?? null,
    blockType,
    inlineTypes,
    tableCellKey: $getSelectedTableCellKey(),
    alignment: $getSelectedAlignment(),
  };
};
