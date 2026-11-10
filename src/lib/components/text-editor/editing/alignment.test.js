import { $createLinkNode as createLinkNode, LinkNode } from '@lexical/link';
import {
  $createParagraphNode as createParagraphNode,
  $createTextNode as createTextNode,
  $getRoot as getRoot,
  $setSelection as setSelection,
  createEditor,
} from 'lexical';
import { describe, expect, it } from 'vitest';
import { $getSelectedAlignment } from './alignment.js';

/**
 * @import { LexicalEditor } from 'lexical';
 */

/**
 * Create an editor holding a centered paragraph with a link, attached to a root element.
 * @returns {LexicalEditor} Editor.
 */
const createTestEditor = () => {
  const editor = createEditor({
    nodes: [LinkNode],
    /**
     * Fail the test on any error.
     * @param {Error} error Error.
     * @throws {Error} Always.
     */
    onError: (error) => {
      throw error;
    },
  });

  const root = document.createElement('div');

  root.contentEditable = 'true';
  document.body.append(root);
  editor.setRootElement(root);
  editor.update(
    () => {
      getRoot()
        .clear()
        .append(
          createParagraphNode()
            .setFormat('center')
            .append(createLinkNode('https://example.com').append(createTextNode('Link'))),
          createParagraphNode().append(createTextNode('Plain')),
        );
    },
    { discrete: true },
  );

  return editor;
};

/**
 * Run the given function within a discrete editor update, and return its result.
 * @param {LexicalEditor} editor Editor.
 * @param {() => string} fn Function.
 * @returns {string} Result.
 */
const update = (editor, fn) => {
  let result = '';

  editor.update(
    () => {
      result = fn();
    },
    { discrete: true },
  );

  return result;
};

describe('$getSelectedAlignment()', () => {
  it('gets the alignment of the block, even within an inline element like a link', () => {
    const editor = createTestEditor();

    expect(
      update(editor, () => {
        /** @type {import('lexical').TextNode} */ (getRoot().getFirstDescendant()).select(1, 1);

        return $getSelectedAlignment();
      }),
    ).toBe('center');
  });

  it('returns an empty string for a block with the default alignment', () => {
    const editor = createTestEditor();

    expect(
      update(editor, () => {
        /** @type {import('lexical').ElementNode} */ (getRoot().getLastChild()).selectEnd();

        return $getSelectedAlignment();
      }),
    ).toBe('');
  });

  it('returns an empty string for a caret between blocks', () => {
    const editor = createTestEditor();

    expect(
      update(editor, () => {
        getRoot().select(1, 1);

        return $getSelectedAlignment();
      }),
    ).toBe('');
  });

  it('returns an empty string without a selection', () => {
    const editor = createTestEditor();

    expect(
      update(editor, () => {
        setSelection(null);

        return $getSelectedAlignment();
      }),
    ).toBe('');
  });
});
