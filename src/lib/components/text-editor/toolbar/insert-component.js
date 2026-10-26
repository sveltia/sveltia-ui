import { $createParagraphNode as createParagraphNode, $insertNodes as insertNodes } from 'lexical';
import { insertComponent } from '../raw-markdown.js';

/**
 * @import { TextEditorComponent, TextEditorStore } from '#lib/typedefs.js';
 */

/**
 * Insert a new instance of the given editor component into the editor: its Markdown in the plain
 * text mode, or its node in the rich text mode.
 * @param {TextEditorStore} editorStore Editor store.
 * @param {TextEditorComponent} component Editor component.
 */
export const insertEditorComponent = (editorStore, component) => {
  const { textArea, useRichText } = editorStore;

  // Insert the component’s Markdown in the plain text mode
  if (!useRichText) {
    // The toolbar is only enabled while the `<textarea>` is there
    /* v8 ignore else */
    if (textArea) {
      insertComponent(textArea, component);
    }

    return;
  }

  const { createNode } = component;

  editorStore.editor?.update(() => {
    const node = createNode();

    // Add an additional paragraph after a block for easier editing. An inline node stays within the
    // text, which may be in a table cell where a paragraph can’t be added
    insertNodes(node.isInline() ? [node] : [node, createParagraphNode()]);
  });
};
