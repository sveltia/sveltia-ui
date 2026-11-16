/**
 * Toolbar actions that work in both the rich text and plain text modes.
 */

import { $createParagraphNode as createParagraphNode, $insertNodes as insertNodes } from 'lexical';
import { focusEditor } from '../editing/caret.js';
import { insertComponent } from '../editing/raw-markdown.js';

/**
 * @import { LexicalEditor } from 'lexical';
 * @import { TextEditorComponent, TextEditorStore } from '#lib/typedefs.js';
 */

/**
 * @typedef {object} EditorAction
 * @property {(textArea: HTMLTextAreaElement) => void | Promise<void>} [raw] Edit the `<textarea>`
 * in the plain text mode, which also moves the focus there. Without it, nothing happens in the
 * plain text mode.
 * @property {(editor: LexicalEditor) => void | Promise<void>} rich Edit the Lexical editor in the
 * rich text mode.
 * @property {'after' | 'before' | false} [focus] When to move the focus back to the Lexical
 * editor: `after` the edit (default), `before` it, for an edit that applies to the selection the
 * focus restores, or not at all, for an edit that moves the focus on its own.
 */

/**
 * Run a toolbar action in the mode the editor is in.
 * @param {TextEditorStore} editorStore Editor store.
 * @param {EditorAction} action Action.
 * @returns {Promise<void>} Nothing.
 */
export const runEditorAction = async (editorStore, { raw, rich, focus = 'after' }) => {
  const { editor, textArea, useRichText } = editorStore;

  if (!useRichText) {
    // The toolbar is only enabled while the `<textarea>` is there
    /* v8 ignore else */
    if (raw && textArea) {
      await raw(textArea);
    }

    return;
  }

  // The toolbar is only enabled while the editor is there
  /* v8 ignore next 3 */
  if (!editor) {
    return;
  }

  if (focus === 'before') {
    await focusEditor(editor);
  }

  await rich(editor);

  if (focus === 'after') {
    await focusEditor(editor);
  }
};

/**
 * Move the focus back to the editor shown, the Lexical editor or the `<textarea>`, like after a
 * dialog that leaves the focus alone has been closed without changing anything.
 * @param {TextEditorStore} editorStore Editor store.
 * @returns {Promise<void>} Nothing.
 */
export const refocusEditor = async (editorStore) => {
  const { editor, textArea, useRichText } = editorStore;

  if (!useRichText) {
    textArea?.focus();
  } else if (editor) {
    await focusEditor(editor);
  }
};

/**
 * Insert a new instance of the given editor component into the editor: its Markdown in the plain
 * text mode, or its node in the rich text mode. The focus is left to the component.
 * @param {TextEditorStore} editorStore Editor store.
 * @param {TextEditorComponent} component Editor component.
 * @returns {Promise<void>} Nothing.
 */
export const insertEditorComponent = (editorStore, component) =>
  runEditorAction(editorStore, {
    /**
     * Insert the component’s Markdown.
     * @param {HTMLTextAreaElement} textArea `<textarea>` element.
     * @returns {void | Promise<void>} Nothing.
     */
    raw: (textArea) => insertComponent(textArea, component),
    /**
     * Insert the component’s node.
     * @param {LexicalEditor} editor Editor instance.
     */
    rich: (editor) => {
      editor.update(() => {
        const node = component.createNode();

        // Add an additional paragraph after a block for easier editing. An inline node stays
        // within the text, which may be in a table cell where a paragraph can’t be added
        insertNodes(node.isInline() ? [node] : [node, createParagraphNode()]);
      });
    },
    focus: false,
  });
