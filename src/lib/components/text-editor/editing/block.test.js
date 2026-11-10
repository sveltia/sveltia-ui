// `horizontalrule` is the node type of a horizontal rule
// cspell:ignore horizontalrule

import {
  $createHorizontalRuleNode as createHorizontalRuleNode,
  HorizontalRuleNode,
} from '@lexical/extension';
import {
  $createParagraphNode as createParagraphNode,
  $createTextNode as createTextNode,
  $getRoot as getRoot,
  $getSelection as getSelection,
  $setSelection as setSelection,
  createEditor,
} from 'lexical';
import { describe, expect, it } from 'vitest';
import { $insertBlockNode, $insertHorizontalRule } from './block.js';

/**
 * @import { LexicalEditor } from 'lexical';
 */

/**
 * Create an editor with the horizontal rule node, attached to a root element like the rich text
 * editor.
 * @returns {LexicalEditor} Editor.
 */
const createTestEditor = () => {
  const editor = createEditor({
    nodes: [HorizontalRuleNode],
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

  return editor;
};

/**
 * Run the given function within a discrete editor update.
 * @param {LexicalEditor} editor Editor.
 * @param {() => void} fn Function.
 */
const update = (editor, fn) => {
  editor.update(fn, { discrete: true });
};

/**
 * Get the type and text of each top level node, e.g. `paragraph:Before`.
 * @param {LexicalEditor} editor Editor.
 * @returns {string[]} Blocks.
 */
const readBlocks = (editor) =>
  editor.read(() =>
    getRoot()
      .getChildren()
      .map((node) => `${node.getType()}:${node.getTextContent().trim()}`),
  );

/**
 * Get the top level block the caret is in, e.g. `paragraph:After`.
 * @param {LexicalEditor} editor Editor.
 * @returns {string | undefined} Block.
 */
const readCaretBlock = (editor) =>
  editor.read(() => {
    const block = getSelection()?.getNodes()[0]?.getTopLevelElementOrThrow();

    return block ? `${block.getType()}:${block.getTextContent()}` : undefined;
  });

/**
 * Fill the document with paragraphs of the given text, an empty string being an empty paragraph,
 * and place the caret at the given offset of the given paragraph.
 * @param {LexicalEditor} editor Editor.
 * @param {string[]} paragraphs Text of the paragraphs.
 * @param {number} index Index of the paragraph to place the caret in.
 * @param {number} [offset] Offset of the caret in its text.
 */
const setUp = (editor, paragraphs, index, offset = 0) => {
  update(editor, () => {
    const root = getRoot().clear();

    paragraphs.forEach((text) => {
      root.append(createParagraphNode().append(...(text ? [createTextNode(text)] : [])));
    });

    const paragraph = /** @type {import('lexical').ParagraphNode} */ (root.getChildAtIndex(index));
    const text = paragraph.getFirstChild();

    if (text) {
      /** @type {import('lexical').TextNode} */ (text).select(offset, offset);
    } else {
      paragraph.selectStart();
    }
  });
};

describe('$insertBlockNode()', () => {
  it('replaces the empty paragraph the caret is in', () => {
    const editor = createTestEditor();

    setUp(editor, ['Before', '', 'After'], 1);
    update(editor, () => {
      $insertBlockNode(createHorizontalRuleNode());
    });

    expect(readBlocks(editor)).toEqual(['paragraph:Before', 'horizontalrule:', 'paragraph:After']);
  });

  it('splits the paragraph with text at the caret', () => {
    const editor = createTestEditor();

    setUp(editor, ['BeforeAfter'], 0, 6);
    update(editor, () => {
      $insertBlockNode(createHorizontalRuleNode());
    });

    expect(readBlocks(editor)).toEqual(['paragraph:Before', 'horizontalrule:', 'paragraph:After']);
  });

  it('restores the selection lost in the same update', () => {
    const editor = createTestEditor();

    setUp(editor, ['Before', ''], 1);
    update(editor, () => {
      // Lose the selection, as the editor can when the focus moves to the toolbar
      setSelection(null);
      $insertBlockNode(createHorizontalRuleNode());
    });

    expect(readBlocks(editor)).toEqual(['paragraph:Before', 'horizontalrule:']);
  });

  it('appends the node to the document without a selection', () => {
    const editor = createTestEditor();

    update(editor, () => {
      getRoot()
        .clear()
        .append(createParagraphNode().append(createTextNode('Text')));
    });
    update(editor, () => {
      $insertBlockNode(createHorizontalRuleNode());
    });

    expect(readBlocks(editor)).toEqual(['paragraph:Text', 'horizontalrule:', 'paragraph:']);
  });
});

describe('$insertHorizontalRule()', () => {
  it('moves the caret to the start of the block after the rule', () => {
    const editor = createTestEditor();

    setUp(editor, ['Before', '', 'After'], 1);
    update(editor, () => {
      $insertHorizontalRule();
    });

    expect(readBlocks(editor)).toEqual(['paragraph:Before', 'horizontalrule:', 'paragraph:After']);
    expect(readCaretBlock(editor)).toBe('paragraph:After');
  });

  it('adds a paragraph after a rule at the end of the document', () => {
    const editor = createTestEditor();

    setUp(editor, ['Before', ''], 1);
    update(editor, () => {
      $insertHorizontalRule();
    });

    expect(readBlocks(editor)).toEqual(['paragraph:Before', 'horizontalrule:', 'paragraph:']);
    expect(readCaretBlock(editor)).toBe('paragraph:');
  });

  it('adds a paragraph between the rule and another rule after it', () => {
    const editor = createTestEditor();

    setUp(editor, ['', 'After'], 0);
    update(editor, () => {
      getRoot().getChildAtIndex(1)?.replace(createHorizontalRuleNode());
      /** @type {import('lexical').ParagraphNode} */ (getRoot().getFirstChild()).selectStart();
    });
    update(editor, () => {
      $insertHorizontalRule();
    });

    expect(readBlocks(editor)).toEqual(['horizontalrule:', 'paragraph:', 'horizontalrule:']);
    expect(readCaretBlock(editor)).toBe('paragraph:');
  });
});
