import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { registerDragonSupport } from '@lexical/dragon';
import { createEmptyHistoryState, registerHistory } from '@lexical/history';
import {
  LinkNode,
  TOGGLE_LINK_COMMAND,
  $isLinkNode as isLinkNode,
  $toggleLink as toggleLink,
} from '@lexical/link';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  $handleListInsertParagraph as handleListInsertParagraph,
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
  INDENT_CONTENT_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  createEditor,
  $getSelection as getSelection,
  $isRangeSelection as isRangeSelection,
} from 'lexical';
import { blockButtonTypes, textFormatButtonTypes } from '.';

const allTransformers = [...TRANSFORMERS];

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
    list: {
      nested: {
        listitem: 'nested',
      },
    },
  },
};

/**
 * Get the current selection’s block and inline level types.
 * @returns {{ blockType: import('$lib/typedefs').TextEditorBlockType,
 * inlineTypes: import('$lib/typedefs').TextEditorInlineType[] }} Types.
 */
const getSelectionTypes = () => {
  const selection = getSelection();

  if (!isRangeSelection(selection)) {
    return { blockType: 'paragraph', inlineTypes: [] };
  }

  const anchor = selection.anchor.getNode();
  /** @type {ElementNode | null} */
  let parent = null;
  /** @type {import('$lib/typedefs').TextEditorInlineType[]} */
  const inlineTypes = textFormatButtonTypes.filter((type) => selection.hasFormat(type));

  if (anchor.getType() !== 'root') {
    parent = anchor instanceof ElementNode ? anchor : getNearestNodeOfType(anchor, ElementNode);

    if (isLinkNode(parent)) {
      inlineTypes.push('link');
      parent = getNearestNodeOfType(parent, ElementNode);
    }

    if (isListItemNode(parent)) {
      parent = getNearestNodeOfType(parent, ListNode);
    }
  }

  const blockType = /** @type {import('$lib/typedefs').TextEditorBlockType} */ (
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

  return { blockType, inlineTypes };
};

/**
 * Listen to changes made on the editor and trigger the Update event.
 * @param {import('lexical').LexicalEditor} editor - Editor instance.
 */
const onEditorUpdate = (editor) => {
  const { blockType, inlineTypes } = getSelectionTypes();

  editor.getRootElement()?.dispatchEvent(
    new CustomEvent('Update', {
      detail: {
        value: convertToMarkdownString(
          // Use underscores for italic text in Markdown instead of asterisks
          allTransformers.filter((/** @type {any} */ { tag }) => tag !== '*'),
        ),
        selectionBlockType: blockType,
        selectionInlineTypes: inlineTypes,
      },
    }),
  );
};

/**
 * Initialize the Lexical editor.
 * @param {object} [options] - Options.
 * @param {import('$lib/typedefs').TextEditorComponent[]} [options.components] - Editor components.
 * @returns {import('lexical').LexicalEditor} Editor instance.
 */
export const initEditor = ({ components } = {}) => {
  components?.forEach(({ node, transformer }) => {
    /** @type {any[]} */ (editorConfig.nodes).unshift(node);
    allTransformers.unshift(transformer);
  });

  const editor = createEditor(editorConfig);

  registerRichText(editor);
  registerDragonSupport(editor);
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

  // https://github.com/facebook/lexical/blob/main/packages/lexical-react/src/shared/useList.ts
  editor.registerCommand(
    INSERT_PARAGRAPH_COMMAND,
    () => handleListInsertParagraph(),
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

  // `editor.registerCommand(KEY_TAB_COMMAND, listener, priority)` doesn’t work for some reason, so
  // use another method
  editor.registerRootListener((root) => {
    if (root) {
      root.addEventListener('keydown', (event) => {
        editor.update(() => {
          if (event.key === 'Tab') {
            const selection = getSelection();

            if (!isRangeSelection(selection)) {
              return;
            }

            const anchor = selection.anchor.getNode();

            const parent =
              anchor instanceof ElementNode ? anchor : getNearestNodeOfType(anchor, ElementNode);

            if (isListItemNode(parent) && parent.canIndent()) {
              if (!event.shiftKey) {
                event.preventDefault();
                editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
              } else if (parent.getIndent() > 0) {
                event.preventDefault();
                editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
              }
            }
          }
        });
      });
    }
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
        convertFromMarkdownString(value, allTransformers);
        resolve(void 0);
      } catch (ex) {
        reject(new Error('Failed to convert Markdown', { cause: ex }));
      }
    });
  });

/**
 * Move focus to the editor so the user can start editing immediately.
 * @param {import('lexical').LexicalEditor} editor - Editor instance.
 * @returns {Promise<void>} Nothing.
 */
export const focusEditor = async (editor) =>
  new Promise((resolve) => {
    editor.focus(() => {
      resolve(undefined);
    });
  });
