import { $createLinkNode as createLinkNode, LinkNode } from '@lexical/link';
import {
  $createParagraphNode as createParagraphNode,
  $createTextNode as createTextNode,
  $getRoot as getRoot,
  createEditor,
} from 'lexical';
import { describe, expect, it } from 'vitest';
import { $findSelectedLink, getLinkAnchorRect } from './link.js';

/**
 * @import { LexicalEditor, TextNode } from 'lexical';
 */

/**
 * Create an editor holding a paragraph with plain text, a link and more plain text.
 * @returns {{ editor: LexicalEditor, before: TextNode, linkText: TextNode, linkKey: string }}
 * Editor and nodes.
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

  /** @type {any} */
  const nodes = {};

  editor.update(
    () => {
      const paragraph = createParagraphNode();
      const link = createLinkNode('https://example.com/');

      nodes.before = createTextNode('Visit ');
      nodes.linkText = createTextNode('example');
      nodes.linkKey = link.getKey();
      link.append(nodes.linkText);
      paragraph.append(nodes.before, link);
      getRoot().append(paragraph);
    },
    { discrete: true },
  );

  return { editor, ...nodes };
};

describe('$findSelectedLink', () => {
  it('finds the link containing the whole selection', () => {
    const { editor, linkText, linkKey } = createTestEditor();
    /** @type {string | undefined} */
    let key;

    editor.update(
      () => {
        linkText.select(1, 4);
        key = $findSelectedLink()?.getKey();
      },
      { discrete: true },
    );

    expect(key).toBe(linkKey);
  });

  it('returns `null` when the selection goes beyond the link', () => {
    const { editor, before, linkText } = createTestEditor();
    /** @type {unknown} */
    let link;

    editor.update(
      () => {
        const selection = linkText.select(0, 3);

        selection.anchor.set(before.getKey(), 0, 'text');
        link = $findSelectedLink();
      },
      { discrete: true },
    );

    expect(link).toBeNull();
  });

  it('returns `null` without a range selection', () => {
    const { editor } = createTestEditor();
    /** @type {unknown} */
    let link;

    editor.read(() => {
      link = $findSelectedLink();
    });

    expect(link).toBeNull();
  });
});

describe('getLinkAnchorRect', () => {
  it('returns `undefined` without a link key', () => {
    const { editor } = createTestEditor();

    expect(getLinkAnchorRect(editor, { linkKey: undefined })).toBeUndefined();
  });
});
