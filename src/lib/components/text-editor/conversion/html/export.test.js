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
} from 'lexical';
import { afterEach, describe, expect, it } from 'vitest';
import { BLOCK_BUTTON_TYPES } from '../../constants.js';
import { convertHtmlToLexical, convertMarkdownToLexical } from '../import.js';
import { exportHtml } from './index.js';
import {
  createEditor,
  disposeEditors,
  markdownToHtml,
  roundTrip,
} from '#lib/test-utils/html-editor.js';

/**
 * @import { TextNode } from 'lexical';
 */

afterEach(disposeEditors);

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
describe('text alignment in HTML', () => {
  it('should keep the alignment of paragraphs, headings, quotes and list items', async () => {
    const html =
      '<p style="text-align: center;">Center</p>' +
      '<h2 style="text-align: right;">Right</h2>' +
      '<blockquote style="text-align: justify;">Justify</blockquote>' +
      '<ul><li style="text-align: center;">Item</li></ul>';

    expect(await roundTrip(html, { enabledButtons: [...BLOCK_BUTTON_TYPES, 'align'] })).toBe(html);
  });

  it('should keep a logical alignment the menu doesn’t offer', async () => {
    const html = '<p style="text-align: start;">Start</p><p style="text-align: end;">End</p>';

    expect(await roundTrip(html)).toBe(html);
  });

  it('should drop any other style', async () => {
    expect(await roundTrip('<p style="color: red; text-align: center;">Text</p>')).toBe(
      '<p style="text-align: center;">Text</p>',
    );
    expect(await roundTrip('<p style="color: red;">Text</p>')).toBe('<p>Text</p>');
  });

  it('should keep the paragraph of an aligned table cell', async () => {
    const html =
      '<table><tbody><tr><td><p style="text-align: right;">Aligned</p></td><td>Plain</td></tr>' +
      '</tbody></table>';

    expect(await roundTrip(html)).toBe(html);
  });
});
