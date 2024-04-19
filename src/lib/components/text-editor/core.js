import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { createEmptyHistoryState, registerHistory } from '@lexical/history';
import {
  LinkNode,
  TOGGLE_LINK_COMMAND,
  $isLinkNode as isLinkNode,
  toggleLink,
} from '@lexical/link';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  insertList,
  $isListItemNode as isListItemNode,
  $isListNode as isListNode,
} from '@lexical/list';
import {
  TRANSFORMERS,
  $convertFromMarkdownString as convertFromMarkdownString,
  $convertToMarkdownString as convertToMarkdownString,
} from '@lexical/markdown';
import {
  HeadingNode,
  QuoteNode,
  $isHeadingNode as isHeadingNode,
  $isQuoteNode as isQuoteNode,
  registerRichText,
} from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { $getNearestNodeOfType as getNearestNodeOfType } from '@lexical/utils';
import {
  COMMAND_PRIORITY_NORMAL,
  ElementNode,
  createEditor,
  $getSelection as getSelection,
  $isRangeSelection as isRangeSelection,
} from 'lexical';
import { blockButtonTypes, textFormatButtonTypes } from '$lib/components/text-editor';

/**
 * Lexical editor configuration.
 * @type {import('lexical').CreateEditorArgs}
 */
const editorConfig = {
  namespace: 'editor',
  nodes: [
    HeadingNode,
    QuoteNode,
    LinkNode,
    ListNode,
    ListItemNode,
    CodeNode,
    CodeHighlightNode,
    TableNode,
    TableCellNode,
    TableRowNode,
  ],
  theme: {
    text: {
      /**
       * Enable bold+italic styling.
       * @see https://github.com/facebook/lexical/discussions/4381
       */
      italic: 'italic',
    },
  },
};

/**
 * Listen to changes on the editor.
 * @param {import('lexical').LexicalEditor} editor - Editor instance.
 */
const onEditorUpdate = (editor) => {
  const selection = getSelection();

  if (!isRangeSelection(selection)) {
    return;
  }

  const anchor = selection.anchor.getNode();
  /** @type {ElementNode | null} */
  let parent = null;
  /** @type {TextEditorInlineType[]} */
  const selectionInlineTypes = textFormatButtonTypes.filter((type) => selection.hasFormat(type));

  if (anchor.getType() !== 'root') {
    parent = anchor instanceof ElementNode ? anchor : getNearestNodeOfType(anchor, ElementNode);

    if (isLinkNode(parent)) {
      selectionInlineTypes.push('link');
      parent = getNearestNodeOfType(parent, ElementNode);
    }

    if (isListItemNode(parent)) {
      parent = getNearestNodeOfType(parent, ListNode);
    }
  }

  const selectionBlockType = /** @type {TextEditorBlockType} */ (
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

      const type = parent.getType();

      if (blockButtonTypes.includes(/** @type {any} */ (type))) {
        return type;
      }

      return 'paragraph';
    })()
  );

  editor.getRootElement()?.dispatchEvent(
    new CustomEvent('Update', {
      detail: {
        value: convertToMarkdownString(TRANSFORMERS),
        selectionBlockType,
        selectionInlineTypes,
      },
    }),
  );
};

/**
 * Initialize the Lexical editor.
 * @returns {import('lexical').LexicalEditor} Editor instance.
 */
export const initEditor = () => {
  const editor = createEditor(editorConfig);

  registerRichText(editor);
  registerHistory(editor, createEmptyHistoryState(), 1000);

  editor.registerCommand(
    TOGGLE_LINK_COMMAND,
    (payload) => {
      toggleLink(typeof payload === 'string' ? payload : null);
      return true;
    },
    COMMAND_PRIORITY_NORMAL,
  );

  editor.registerCommand(
    INSERT_UNORDERED_LIST_COMMAND,
    () => {
      insertList(editor, 'bullet');
      return true;
    },
    COMMAND_PRIORITY_NORMAL,
  );

  editor.registerCommand(
    INSERT_ORDERED_LIST_COMMAND,
    () => {
      insertList(editor, 'number');
      return true;
    },
    COMMAND_PRIORITY_NORMAL,
  );

  editor.registerUpdateListener(({ editorState }) => {
    if (editor?.isComposing()) {
      return;
    }

    editorState.read(() => {
      onEditorUpdate(editor);
    });
  });

  return editor;
};

/**
 * Convert Markdown to Lexical nodes.
 * @param {import('lexical').LexicalEditor} editor - Editor instance.
 * @param {string} value - Current Markdown value.
 * @returns {Promise<void>} Nothing.
 * @throws {Error} Failed to convert the value to Lexical nodes.
 */
export const convertMarkdown = async (editor, value) =>
  new Promise((resolve, reject) => {
    editor.update(() => {
      try {
        convertFromMarkdownString(value, TRANSFORMERS);
        resolve(void 0);
      } catch {
        reject(new Error('Failed to convert Markdown'));
      }
    });
  });
