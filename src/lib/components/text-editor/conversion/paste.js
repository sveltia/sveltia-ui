/**
 * Pasting Markdown, either as is or with the Paste as Markdown shortcut.
 */

import { objectKlassEquals } from '@lexical/utils';
import { isURL } from '@sveltia/utils/string';
import { isMac, matchesShortcuts } from '@sveltia/utils/events';
import {
  COMMAND_PRIORITY_NORMAL,
  $getSelection as getSelection,
  $setSelection as setSelection,
  KEY_DOWN_COMMAND,
  PASTE_COMMAND,
  PASTE_TAG,
} from 'lexical';
import { loadCodeHighlighter } from '../shiki/preload.js';
import { $importMarkdown, prepareMarkdown } from './import.js';
import { mergeUnregisters } from '../utils.js';

/**
 * @import { LexicalEditor, LexicalNode } from 'lexical';
 * @import { Transformer } from '@lexical/markdown';
 */

/**
 * Insert the given Markdown at the selection, converted to Lexical nodes, as if it were pasted. The
 * content stays as it is if the editor is read-only or has no selection.
 * @param {LexicalEditor} editor Editor instance.
 * @param {string} value Markdown.
 * @param {Transformer[]} enabledTransformers List of enabled Markdown transformers.
 * @returns {Promise<void>} Nothing.
 */
export const pasteMarkdown = async (editor, value, enabledTransformers) => {
  const { markdown, languages } = prepareMarkdown(value, enabledTransformers);

  // Preload the highlighter like the import does, but carry on without it if it fails to load: the
  // code is highlighted once it’s available, if ever
  await Promise.allSettled(languages.map((lang) => loadCodeHighlighter(lang)));

  if (!editor.isEditable()) {
    return;
  }

  editor.update(
    () => {
      // The Markdown import moves the selection to the nodes it creates, so keep a copy to insert
      // the nodes where the caret was
      const selection = getSelection()?.clone();

      if (!selection) {
        return;
      }

      /** @type {LexicalNode[] | undefined} */
      let nodes;

      try {
        nodes = $importMarkdown(markdown, enabledTransformers);
      } catch (ex) {
        // The browser paste has been canceled, so paste the text as is rather than nothing
        // eslint-disable-next-line no-console
        console.error(ex);
      }

      setSelection(selection);

      if (nodes) {
        selection.insertNodes(nodes);
      } else {
        selection.insertRawText(value);
      }
    },
    { tag: PASTE_TAG },
  );
};

/**
 * How long to wait for the `paste` event after a Paste as Markdown shortcut, in milliseconds.
 */
const PASTE_AS_MARKDOWN_TIMEOUT = 1000;

/**
 * Keyboard shortcuts to paste the text on the clipboard as Markdown: the browser’s own shortcuts to
 * paste plain text, Accel+Shift+V, plus Command+Option+Shift+V, the macOS Paste and Match Style.
 * @returns {string} Shortcuts.
 */
const getPasteAsMarkdownShortcuts = () =>
  isMac() ? 'Meta+Shift+V Meta+Alt+Shift+V' : 'Ctrl+Shift+V';

/**
 * Register the keyboard shortcuts to paste the text on the clipboard as Markdown. A regular paste
 * prefers the HTML on the clipboard, so text copied from a code editor or a terminal ends up in a
 * code block, while Markdown pasted as plain text is kept as literal text. The shortcuts make the
 * browser paste plain text, which is then converted from Markdown. The browser does the paste,
 * because a script can’t read the clipboard after a key combination in every browser: Firefox
 * doesn’t allow it after a key pressed with Ctrl, Alt or Command.
 * @param {LexicalEditor} editor Editor instance.
 * @param {Transformer[]} enabledTransformers List of enabled Markdown transformers.
 * @returns {() => void} Cleanup handler.
 */
export const registerPasteAsMarkdown = (editor, enabledTransformers) => {
  const shortcuts = getPasteAsMarkdownShortcuts();
  /** Whether the paste that follows was started with one of the shortcuts. */
  let pasteAsMarkdown = false;
  let timer = 0;

  return mergeUnregisters(
    () => {
      clearTimeout(timer);
    },
    editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event) => {
        // Any other key cancels the shortcut. Chrome on macOS fires the `paste` event in a later
        // task, so wait a moment for it, but not too long, in case the browser doesn’t paste with
        // the shortcut, like Safari with Command+Shift+V
        pasteAsMarkdown = matchesShortcuts(event, shortcuts);
        clearTimeout(timer);

        if (pasteAsMarkdown) {
          timer = window.setTimeout(() => {
            pasteAsMarkdown = false;
          }, PASTE_AS_MARKDOWN_TIMEOUT);
        }

        // Let the browser paste
        return false;
      },
      COMMAND_PRIORITY_NORMAL,
    ),
    editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        if (!pasteAsMarkdown) {
          return false;
        }

        pasteAsMarkdown = false;

        const isClipboardEvent = objectKlassEquals(event, ClipboardEvent);

        // Safari pastes with an `insertFromPaste` input event instead of a `paste` event
        const dataTransfer = isClipboardEvent
          ? /** @type {ClipboardEvent} */ (event).clipboardData
          : objectKlassEquals(event, InputEvent)
            ? /** @type {InputEvent} */ (event).dataTransfer
            : null;

        const text = dataTransfer?.getData('text/plain');

        // Leave a URL to the link paste handler, which links the selected text. It only handles a
        // `paste` event, so Safari still pastes a URL as Markdown
        if (!text || (isClipboardEvent && isURL(text.trim()))) {
          return false;
        }

        event.preventDefault();
        pasteMarkdown(editor, text, enabledTransformers);

        return true;
      },
      // Before the link paste handler and Lexical’s own one
      COMMAND_PRIORITY_NORMAL,
    ),
  );
};
