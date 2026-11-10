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
import { BLOCK_BUTTON_TYPES, TEXT_FORMAT_BUTTON_TYPES } from '../constants.js';
import { $getSelectedAlignment } from './alignment.js';
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

  if (anchor.getType() !== 'root') {
    parent = getNearestElementNode(anchor);

    if (isLinkNode(parent)) {
      inlineTypes.push('link');
      // `getNearestNodeOfType()` would return the link itself, so start from its parent to find the
      // block the link is in
      parent = parent.getParent();
    }

    if (isListItemNode(parent)) {
      parent = getNearestNodeOfType(parent, ListNode);
    }
  }

  const blockType = /** @type {TextEditorBlockType} */ (
    (() => {
      if (!parent) {
        return 'paragraph';
      }

      if (isHeadingNode(parent)) {
        return `heading-${parent.getTag().match(/\d/)?.[0]}`;
      }

      if (isListNode(parent)) {
        return parent.getListType() === 'bullet' ? 'bulleted-list' : 'numbered-list';
      }

      if (isQuoteNode(parent)) {
        return 'blockquote';
      }

      if (isCodeNode(parent) || isCodeHighlightNode(parent)) {
        return 'code-block';
      }

      const type = parent.getType();

      if (BLOCK_BUTTON_TYPES.includes(/** @type {any} */ (type))) {
        return type;
      }

      return 'paragraph';
    })()
  );

  return {
    blockNodeKey: parent?.getKey() ?? null,
    blockType,
    inlineTypes,
    tableCellKey: $getSelectedTableCellKey(),
    alignment: $getSelectedAlignment(),
  };
};
