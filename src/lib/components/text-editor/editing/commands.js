/**
 * Commands of the code editor, lists and indentation, and the helper to combine the cleanup
 * handlers of the registered listeners.
 */

import {
  CodeNode,
  $createCodeNode as createCodeNode,
  $isCodeNode as isCodeNode,
} from '@lexical/code-core';
import {
  $handleListInsertParagraph as handleListInsertParagraph,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  $insertList as insertList,
  $isListItemNode as isListItemNode,
} from '@lexical/list';
import { $getNearestNodeOfType as getNearestNodeOfType } from '@lexical/utils';
import {
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_NORMAL,
  DELETE_CHARACTER_COMMAND,
  FORMAT_TEXT_COMMAND,
  $getSelection as getSelection,
  INDENT_CONTENT_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  KEY_ENTER_COMMAND,
  $isElementNode as isElementNode,
  $isRangeSelection as isRangeSelection,
  $isTextNode as isTextNode,
  OUTDENT_CONTENT_COMMAND,
  RootNode,
  TextNode,
} from 'lexical';
import { getNearestElementNode } from './selection.js';
import { HTML_ONLY_FORMAT_TYPES, isHtmlOnlyButton } from '../constants.js';
import { mergeUnregisters } from '../utils.js';

/**
 * @import { LexicalEditor, TextFormatType } from 'lexical';
 * @import { ListType } from '@lexical/list';
 * @import {
 * TextEditorBlockType,
 * TextEditorConfig,
 * TextEditorValueFormat,
 * } from '#lib/typedefs.js';
 */

/**
 * Register the commands and transform specific to the code editor, which only holds a single code
 * block.
 * @param {LexicalEditor} editor Editor instance.
 * @param {string} defaultLanguage Default language of the code block.
 * @returns {() => void} Cleanup handler.
 */
export const registerCodeEditorCommands = (editor, defaultLanguage) =>
  mergeUnregisters(
    // Pressing Backspace at the very beginning of a code block converts it to a paragraph by
    // default (`CodeNode.collapseAtStart()`), which makes no sense when the editor only holds a
    // single code block, so ignore it
    editor.registerCommand(
      DELETE_CHARACTER_COMMAND,
      (isBackward) => {
        const selection = getSelection();

        if (!isBackward || !isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const { offset } = selection.anchor;
        const node = selection.anchor.getNode();
        const codeNode = isCodeNode(node) ? node : getNearestNodeOfType(node, CodeNode);

        return (
          !!codeNode &&
          offset === 0 &&
          (node.is(codeNode) || !!codeNode.getFirstDescendant()?.is(node))
        );
      },
      COMMAND_PRIORITY_LOW,
    ),
    // Pressing Enter after two blank lines at the end of a code block exits it by default
    // (`CodeExtension`), adding a paragraph after it, which would be left out of the code. Insert a
    // new line instead, which `CodeNode.insertNewAfter()` does without exiting when the extension
    // is in place. This has to take priority over the extension’s own handler
    editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        const selection = getSelection();

        if (!isRangeSelection(selection)) {
          return false;
        }

        event?.preventDefault();

        return editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
      },
      COMMAND_PRIORITY_NORMAL,
    ),
    // Make sure the editor always has a single code block. This runs within the same update that
    // made the change, so the user never gets a chance to type in anything else
    editor.registerNodeTransform(RootNode, (root) => {
      const children = root.getChildren();

      if (children.length === 1 && isCodeNode(children[0])) {
        return;
      }

      const [firstChild] = children;

      if (children.length === 1 && isElementNode(firstChild)) {
        const node = createCodeNode(defaultLanguage);

        // Keep the content and the selection
        firstChild.replace(node, true);
      } else if (children.length === 0) {
        const node = createCodeNode(defaultLanguage);

        root.append(node);
        node.selectStart();
      }
    }),
  );

/**
 * List buttons, along with the command to insert the list and its type.
 * @type {[TextEditorBlockType, typeof INSERT_UNORDERED_LIST_COMMAND, ListType][]}
 */
const LIST_COMMANDS = [
  ['bulleted-list', INSERT_UNORDERED_LIST_COMMAND, 'bullet'],
  ['numbered-list', INSERT_ORDERED_LIST_COMMAND, 'number'],
];

/**
 * Register the commands for the enabled list buttons.
 * @param {LexicalEditor} editor Editor instance.
 * @param {TextEditorConfig['enabledButtons']} enabledButtons Enabled buttons.
 * @returns {() => void} Cleanup handler.
 */
export const registerListCommands = (editor, enabledButtons = []) => {
  const enabledLists = LIST_COMMANDS.filter(([button]) => enabledButtons.includes(button));

  return mergeUnregisters(
    ...enabledLists.map(([, command, listType]) =>
      editor.registerCommand(
        command,
        () => {
          insertList(listType);

          return true;
        },
        COMMAND_PRIORITY_NORMAL,
      ),
    ),
    // https://github.com/facebook/lexical/blob/main/packages/lexical-react/src/shared/useList.ts
    enabledLists.length
      ? editor.registerCommand(
          INSERT_PARAGRAPH_COMMAND,
          () => handleListInsertParagraph(),
          COMMAND_PRIORITY_NORMAL,
        )
      : undefined,
  );
};

/**
 * Remove the given format from all the text in the selection, including the text partly selected,
 * or from the text to be typed at the caret. Unlike Lexical’s own toggle, which follows the text at
 * the start of the selection, it never applies the format.
 * @param {TextFormatType} type Format type.
 */
const $removeFormat = (type) => {
  const selection = getSelection();

  if (
    !isRangeSelection(selection) ||
    !(
      selection.hasFormat(type) ||
      selection.getNodes().some((node) => isTextNode(node) && node.hasFormat(type))
    )
  ) {
    return;
  }

  // Align every node with a format that doesn’t have it
  selection.formatText(type, 0);
};

/**
 * Keep the HTML-only text formats, like underline, out of the editor unless their buttons are
 * enabled for HTML. Lexical applies underline with the Ctrl/Cmd+U shortcut on its own, and pasted
 * HTML can bring it in as well.
 * - For Markdown, which has no syntax for them and would drop them when saved, the formats are
 *   removed from any text that gets them, and the shortcut does nothing.
 * - For HTML without the button, the shortcut can only remove an existing format, like one in the
 *   stored value or in pasted text, which would otherwise have no button to undo it.
 * @param {LexicalEditor} editor Editor instance.
 * @param {object} args Arguments.
 * @param {TextEditorValueFormat} args.format Value format.
 * @param {TextEditorConfig['enabledButtons']} args.enabledButtons Enabled buttons.
 * @returns {() => void} Cleanup handler.
 */
export const registerFormatGuard = (editor, { format, enabledButtons = [] }) => {
  if (format !== 'html') {
    return mergeUnregisters(
      editor.registerNodeTransform(TextNode, (node) => {
        HTML_ONLY_FORMAT_TYPES.forEach((type) => {
          if (node.hasFormat(type)) {
            node.toggleFormat(type);
          }
        });
      }),
      editor.registerCommand(FORMAT_TEXT_COMMAND, isHtmlOnlyButton, COMMAND_PRIORITY_CRITICAL),
    );
  }

  return editor.registerCommand(
    FORMAT_TEXT_COMMAND,
    (type) => {
      if (!isHtmlOnlyButton(type) || enabledButtons.includes(type)) {
        return false;
      }

      $removeFormat(type);

      return true;
    },
    COMMAND_PRIORITY_CRITICAL,
  );
};

/**
 * Register a handler for the Tab key that indents a list item, or unindents it with Shift.
 * `editor.registerCommand(KEY_TAB_COMMAND, listener, priority)` doesn’t work for some reason, so
 * listen to the `keydown` event on the root element instead.
 * @param {LexicalEditor} editor Editor instance.
 * @returns {() => void} Cleanup handler.
 */
export const registerTabIndentation = (editor) =>
  editor.registerRootListener((root) => {
    if (!root) {
      return undefined;
    }

    /**
     * Handle Tab indentation shortcuts.
     * @param {KeyboardEvent} event Keydown event.
     */
    const onKeydown = (event) => {
      editor.update(() => {
        if (event.key === 'Tab') {
          const selection = getSelection();

          if (!isRangeSelection(selection)) {
            return;
          }

          const parent = getNearestElementNode(selection.anchor.getNode());

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
    };

    root.addEventListener('keydown', onKeydown);

    return () => {
      root.removeEventListener('keydown', onKeydown);
    };
  });
