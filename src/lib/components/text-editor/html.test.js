/* eslint-disable jsdoc/require-jsdoc */

import { $generateHtmlFromNodes as generateHtmlFromNodes } from '@lexical/html';
import {
  $createTableCellNode as createTableCellNode,
  $createTableNode as createTableNode,
  $createTableRowNode as createTableRowNode,
} from '@lexical/table';
import {
  $createLineBreakNode as createLineBreakNode,
  $createParagraphNode as createParagraphNode,
  $createRangeSelection as createRangeSelection,
  $createTextNode as createTextNode,
  $getRoot as getRoot,
  DecoratorNode,
  $getSelection as getSelection,
  $isRangeSelection as isRangeSelection,
} from 'lexical';
import { afterEach, describe, expect, it } from 'vitest';
import { BLOCK_BUTTON_TYPES, INLINE_BUTTON_TYPES } from './constants.js';
import { convertHtmlToLexical, convertMarkdownToLexical, initEditor } from './core.js';
import { exportHtml, findUnsupportedNode } from './html.js';

/**
 * @import { LexicalEditor, TextNode } from 'lexical';
 * @import { Transformer } from '@lexical/markdown';
 * @import { TextEditorConfig } from '#lib/typedefs.js';
 */

/** @type {(() => void)[]} */
const disposers = [];

afterEach(() => {
  disposers.splice(0).forEach((dispose) => dispose());
});

/**
 * Create an editor attached to a root element.
 * @param {Partial<TextEditorConfig>} [config] Editor configuration.
 * @returns {{ editor: LexicalEditor, enabledTransformers: Transformer[] }} Editor and transformers.
 */
const createEditor = (config = {}) => {
  const { editor, enabledTransformers, dispose } = initEditor({
    modes: ['rich-text'],
    enabledButtons: [...INLINE_BUTTON_TYPES, ...BLOCK_BUTTON_TYPES],
    components: [],
    useMarkdownShortcuts: true,
    isCodeEditor: false,
    format: 'html',
    ...config,
  });

  editor.setRootElement(document.createElement('div'));
  disposers.push(dispose);

  return { editor, enabledTransformers };
};

/**
 * Import the given Markdown to a new HTML editor, and export the content as HTML.
 * @param {string} markdown Markdown.
 * @returns {Promise<string>} HTML.
 */
const markdownToHtml = async (markdown) => {
  const { editor, enabledTransformers } = createEditor();

  await convertMarkdownToLexical(editor, markdown, enabledTransformers);

  return editor.read(() => exportHtml(editor));
};

/**
 * Import the given HTML to a new editor, and export the content as HTML.
 * @param {string} html HTML.
 * @param {Partial<TextEditorConfig>} [config] Editor configuration.
 * @returns {Promise<string | undefined>} HTML.
 */
const roundTrip = async (html, config) => convertHtmlToLexical(createEditor(config).editor, html);

describe('exportHtml', () => {
  it('should export text formats with semantic elements only', async () => {
    expect(await markdownToHtml('**bold** _italic_ ***both*** ~~strike~~ `code`')).toBe(
      '<p><strong>bold</strong> <em>italic</em> <strong><em>both</em></strong> <s>strike</s> ' +
        '<code>code</code></p>',
    );
  });

  it('should export blocks without the attributes only meant for the editor', async () => {
    expect(await markdownToHtml('# Heading\n\nText\n\n> Quote')).toBe(
      '<h1>Heading</h1><p>Text</p><blockquote>Quote</blockquote>',
    );
  });

  it('should keep the link attributes', async () => {
    expect(await markdownToHtml('[link](https://example.com "Title")')).toBe(
      '<p><a href="https://example.com" title="Title">link</a></p>',
    );
  });

  it('should export lists without `value` and `class` attributes', async () => {
    expect(await markdownToHtml('- a\n    - nested\n- b')).toBe(
      '<ul><li>a<ul><li>nested</li></ul></li><li>b</li></ul>',
    );
  });

  it('should keep the start number of an ordered list', async () => {
    expect(await markdownToHtml('3. three\n4. four')).toBe(
      '<ol start="3"><li>three</li><li>four</li></ol>',
    );
  });

  it('should export a code block as plain text with the language class', async () => {
    expect(await markdownToHtml('```js\nconst a = 1;\n\tb();\n```')).toBe(
      '<pre><code class="language-js">const a = 1;\n\tb();</code></pre>',
    );
  });

  it('should export a plain code block without the language class', async () => {
    expect(await markdownToHtml('```\ntext\n```')).toBe('<pre><code>text</code></pre>');
  });

  it('should export a table without column definitions and extra attributes', async () => {
    expect(
      await roundTrip(
        '<table style="width: 100px"><colgroup><col style="width: 50px"><col></colgroup>' +
          '<tr><th>a</th><th>b</th></tr><tr><td>1</td><td colspan="1"><b>2</b></td></tr></table>',
      ),
    ).toBe(
      '<table><tbody><tr><th>a</th><th>b</th></tr>' +
        '<tr><td>1</td><td><strong>2</strong></td></tr></tbody></table>',
    );
  });

  it('should export a code block ending with a line break', async () => {
    expect(await roundTrip('<pre><code>a\n\nb</code></pre>')).toBe(
      '<pre><code>a\n\nb</code></pre>',
    );
  });

  it('should export only the selected part of a code block', async () => {
    const { editor } = createEditor();

    await convertHtmlToLexical(editor, '<pre><code>const a = 1;</code></pre>');

    const html = editor.read(() => {
      const textNode = /** @type {TextNode} */ (getRoot().getFirstDescendant());
      const selection = createRangeSelection();

      selection.anchor.set(textNode.getKey(), 0, 'text');
      selection.focus.set(textNode.getKey(), 5, 'text');

      return generateHtmlFromNodes(editor, selection);
    });

    expect(html).toBe('const');
  });

  it('should keep the attributes of an editor component in a table cell', () => {
    /**
     * Inline image node standing in for an editor component.
     * @augments {DecoratorNode<null>}
     */
    class ImageNode extends DecoratorNode {
      static getType() {
        return 'test-image';
      }

      /**
       * Clone the node.
       * @param {ImageNode} node Node.
       * @returns {ImageNode} Clone.
       */
      static clone(node) {
        return new ImageNode(node.__key);
      }

      static importJSON() {
        return new ImageNode();
      }

      createDOM() {
        return document.createElement('span');
      }

      updateDOM() {
        return false;
      }

      isInline() {
        return true;
      }

      decorate() {
        return null;
      }

      exportDOM() {
        const element = document.createElement('img');

        element.setAttribute('src', 'a.png');

        return { element };
      }
    }

    const { editor } = createEditor({
      components: [
        /** @type {any} */ ({ id: 'image', label: 'Image', node: ImageNode, transformer: {} }),
      ],
    });

    editor.update(
      () => {
        const cell = createTableCellNode().append(createParagraphNode().append(new ImageNode()));

        getRoot().append(createTableNode().append(createTableRowNode().append(cell)));
      },
      { discrete: true },
    );

    expect(editor.read(() => exportHtml(editor))).toBe(
      '<table><tbody><tr><td><img src="a.png"></td></tr></tbody></table>',
    );
  });

  it('should export a horizontal rule', async () => {
    expect(await markdownToHtml('a\n\n---\n\nb')).toBe('<p>a</p><hr><p>b</p>');
  });

  it('should export a line break', async () => {
    expect(await markdownToHtml('a  \nb')).toBe('<p>a<br>b</p>');
  });

  it('should leave out empty paragraphs at the end, but keep the ones in between', () => {
    const { editor } = createEditor();

    editor.update(
      () => {
        getRoot().append(
          createParagraphNode().append(createTextNode('a')),
          createParagraphNode(),
          createParagraphNode().append(createTextNode('b')),
          createParagraphNode(),
          createParagraphNode(),
        );
      },
      { discrete: true },
    );

    expect(editor.read(() => exportHtml(editor))).toBe('<p>a</p><p><br></p><p>b</p>');
  });

  it('should export an empty editor as an empty string', () => {
    const { editor } = createEditor();

    editor.update(
      () => {
        getRoot().append(createParagraphNode());
      },
      { discrete: true },
    );

    expect(editor.read(() => exportHtml(editor))).toBe('');
  });

  it('should remove the attribute from the `<br>` terminating a trailing line break', () => {
    const { editor } = createEditor();

    editor.update(
      () => {
        getRoot().append(createParagraphNode().append(createTextNode('a'), createLineBreakNode()));
      },
      { discrete: true },
    );

    expect(editor.read(() => exportHtml(editor))).toBe('<p>a<br><br></p>');
  });

  it('should not affect the HTML export of a Markdown editor', async () => {
    const { editor, enabledTransformers } = createEditor({ format: 'markdown' });

    await convertMarkdownToLexical(editor, '**bold**', enabledTransformers);

    expect(editor.read(() => generateHtmlFromNodes(editor))).toContain('style=');
  });
});

describe('convertHtmlToLexical', () => {
  it('should normalize the HTML in the editor’s own style', async () => {
    expect(await roundTrip('<p>a <b>b</b> <i>c</i></p>')).toBe(
      '<p>a <strong>b</strong> <em>c</em></p>',
    );
  });

  it('should keep its own output as is', async () => {
    const html =
      '<h2>Heading</h2><p>Some <strong>bold</strong> and <a href="https://example.com">link</a>' +
      '</p><ul><li>a<ul><li>nested</li></ul></li></ul><ol start="2"><li>b</li></ol>' +
      '<blockquote>Quote</blockquote><pre><code class="language-css">a {}</code></pre><hr>' +
      '<table><tbody><tr><th>h</th></tr><tr><td>c</td></tr></tbody></table>';

    expect(await roundTrip(html)).toBe(html);
  });

  it('should ignore the whitespace between blocks', async () => {
    expect(await roundTrip('\n<p>a</p>\n  <ul>\n    <li>b</li>\n  </ul>\n')).toBe(
      '<p>a</p><ul><li>b</li></ul>',
    );
  });

  it('should wrap inline content outside any block with a paragraph', async () => {
    expect(await roundTrip('bare <em>text</em><p>a</p>more')).toBe(
      '<p>bare <em>text</em></p><p>a</p><p>more</p>',
    );
  });

  it('should import a code block with the language class and the trailing line break', async () => {
    expect(await roundTrip('<pre><code class="lang-ts">let a;\n</code></pre>')).toBe(
      '<pre><code class="language-ts">let a;</code></pre>',
    );
  });

  it('should import a code block as plain text, dropping the markup within it', async () => {
    expect(await roundTrip('<pre><code><span style="color: red">a</span>\nb</code></pre>')).toBe(
      '<pre><code>a\nb</code></pre>',
    );
  });

  it('should move the selection, if any, to the start', async () => {
    const { editor } = createEditor();

    editor.update(
      () => {
        getRoot()
          .append(createParagraphNode().append(createTextNode('old')))
          .selectEnd();
      },
      { discrete: true },
    );
    await convertHtmlToLexical(editor, '<p>new</p>');

    expect(
      editor.read(() => {
        const selection = getSelection();

        return isRangeSelection(selection) ? selection.anchor.offset : undefined;
      }),
    ).toBe(0);
  });

  it('should import a `<br>` within a code block as a line break', async () => {
    expect(await roundTrip('<pre>line1<br>line2</pre>')).toBe(
      '<pre><code>line1\nline2</code></pre>',
    );
    expect(await roundTrip('<pre><code>a<br><span>b</span></code></pre>')).toBe(
      '<pre><code>a\nb</code></pre>',
    );
  });

  it('should throw for a comment', async () => {
    await expect(roundTrip('<p>a</p><!-- more --><p>b</p>')).rejects.toThrow(
      'Failed to convert HTML',
    );
  });

  it('should import an empty value', async () => {
    const { editor } = createEditor();

    expect(await convertHtmlToLexical(editor, '')).toBe('');
    expect(editor.read(() => getRoot().getChildrenSize())).toBe(1);
  });

  it('should throw for an element the editor cannot handle', async () => {
    await expect(roundTrip('<p>a <img src="a.png"></p>')).rejects.toThrow('Failed to convert HTML');
  });

  it('should throw for an element of a disabled button', async () => {
    await expect(roundTrip('<h2>Heading</h2>', { enabledButtons: ['bold'] })).rejects.toThrow(
      'Failed to convert HTML',
    );
  });
});

describe('findUnsupportedNode', () => {
  /**
   * Parse the given HTML.
   * @param {string} html HTML.
   * @returns {Document} Document.
   */
  const parse = (html) => new DOMParser().parseFromString(html, 'text/html');

  it('should return an element no registered node can import', () => {
    const { editor } = createEditor();

    expect(findUnsupportedNode(editor, parse('<p>a<video></video></p>'))?.nodeName).toBe('VIDEO');
  });

  it('should return an element the parser moves to `<head>`', () => {
    const { editor } = createEditor();
    const dom = parse('<script src="embed.js"></script><p>a</p>');

    // Make sure the element is actually in `<head>`, which is the case in browsers
    dom.head.append(...dom.body.querySelectorAll('script'));

    expect(findUnsupportedNode(editor, dom)?.nodeName).toBe('SCRIPT');
  });

  it('should return a comment', () => {
    const { editor } = createEditor();

    expect(findUnsupportedNode(editor, parse('<p>a</p><!-- more --><p>b</p>'))?.nodeType).toBe(
      Node.COMMENT_NODE,
    );
  });

  it('should return a comment within a `<pre>` element', () => {
    const { editor } = createEditor();

    expect(findUnsupportedNode(editor, parse('<pre>a<!-- b --></pre>'))?.nodeType).toBe(
      Node.COMMENT_NODE,
    );
  });

  it('should return `undefined` for supported elements', () => {
    const { editor } = createEditor();

    expect(
      findUnsupportedNode(
        editor,
        parse('<p>a<br><b>b</b></p><table><thead><tr><th>h</th></tr></thead></table>'),
      ),
    ).toBeUndefined();
  });

  it('should ignore the content of a `<pre>` element', () => {
    const { editor } = createEditor();

    expect(
      findUnsupportedNode(editor, parse('<pre><code><mark>a</mark></code></pre>')),
    ).toBeUndefined();
  });
});
