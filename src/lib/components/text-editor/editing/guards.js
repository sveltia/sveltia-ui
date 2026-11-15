/**
 * Guards that keep the formats and blocks a field can’t hold out of the editor, as they could come
 * in anyway with a keyboard shortcut Lexical handles on its own, pasted HTML or a stored value.
 */

import { ListNode } from '@lexical/list';
import {
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_TEXT_COMMAND,
  $getSelection as getSelection,
  $isRangeSelection as isRangeSelection,
  $isTextNode as isTextNode,
  TextNode,
} from 'lexical';
import { HTML_ONLY_FORMAT_TYPES, isHtmlOnlyButton, LIST_TYPES } from '../constants.js';
import { mergeUnregisters } from '../utils.js';

/**
 * @import { LexicalEditor, TextFormatType } from 'lexical';
 * @import { TextEditorConfig, TextEditorValueFormat } from '#lib/typedefs.js';
 */

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
 * HTML can bring it in as well. For Markdown, which has no syntax for them and would drop them when
 * saved, the formats are removed from any text that gets them, and the shortcut does nothing. For
 * HTML without the button, the shortcut can only remove an existing format, like one in the stored
 * value or in pasted text, which would otherwise have no button to undo it.
 * @param {LexicalEditor} editor Editor instance.
 * @param {object} args Arguments.
 * @param {TextEditorValueFormat} args.format Value format.
 * @param {TextEditorConfig['enabledButtons']} args.enabledButtons Enabled buttons.
 * @returns {() => void} Cleanup handler.
 */
const registerFormatGuard = (editor, { format, enabledButtons = [] }) => {
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
 * Turn a task list into a bulleted list without the task list button, as its items couldn’t be
 * toggled. One can come in with pasted HTML, for example. `ListNode` is only registered with a list
 * button, so nothing is registered without any.
 * @param {LexicalEditor} editor Editor instance.
 * @param {TextEditorConfig['enabledButtons']} enabledButtons Enabled buttons.
 * @returns {(() => void) | undefined} Cleanup handler, if anything is registered.
 */
const registerTaskListGuard = (editor, enabledButtons = []) => {
  if (
    enabledButtons.includes('task-list') ||
    !LIST_TYPES.some(({ type }) => enabledButtons.includes(type))
  ) {
    return undefined;
  }

  return editor.registerNodeTransform(ListNode, (list) => {
    if (list.getListType() === 'check') {
      list.setListType('bullet');
    }
  });
};

/**
 * Register all the guards.
 * @param {LexicalEditor} editor Editor instance.
 * @param {object} args Arguments.
 * @param {TextEditorValueFormat} args.format Value format.
 * @param {TextEditorConfig['enabledButtons']} args.enabledButtons Enabled buttons.
 * @returns {() => void} Cleanup handler.
 */
export const registerGuards = (editor, { format, enabledButtons = [] }) =>
  mergeUnregisters(
    registerFormatGuard(editor, { format, enabledButtons }),
    registerTaskListGuard(editor, enabledButtons),
  );
