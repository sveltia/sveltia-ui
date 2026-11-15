import { $createLinkNode as createLinkNode, $isLinkNode as isLinkNode } from '@lexical/link';
import {
  $createParagraphNode as createParagraphNode,
  $createTextNode as createTextNode,
  $getRoot as getRoot,
  $getSelection as getSelection,
  $isRangeSelection as isRangeSelection,
} from 'lexical';
import { afterEach, describe, expect, it } from 'vitest';
import { convertHtmlToLexical, convertMarkdownToLexical } from '../import.js';
import { createEditor, disposeEditors, roundTrip } from '#lib/test-utils/html-editor.js';

/**
 * @import { ElementNode } from 'lexical';
 * @import { LinkNode } from '@lexical/link';
 */

afterEach(disposeEditors);

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
describe('unsafe link URLs', () => {
  // eslint-disable-next-line no-script-url -- Testing that it’s rejected
  const SCRIPT_URL = 'javascript:alert(1)';

  it('should remove a link with an unsafe URL from imported Markdown, keeping the text', async () => {
    const { editor, enabledTransformers } = createEditor({ format: 'markdown' });

    expect(
      await convertMarkdownToLexical(
        editor,
        '[safe](https://example.com) [unsafe](javascript:alert(1))',
        enabledTransformers,
      ),
    ).toBe('[safe](https://example.com) unsafe');
  });

  it('should remove a link with an unsafe URL from imported HTML, keeping the text', async () => {
    expect(
      await roundTrip(
        '<p><a href="/page">safe</a> <a href="javascript:alert(1)">unsafe</a> ' +
          '<a href="data:text/html,x"><strong>data</strong></a></p>',
      ),
    ).toBe('<p><a href="/page">safe</a> unsafe <strong>data</strong></p>');
  });

  it('should remove a link whose URL is changed to an unsafe one', () => {
    const { editor } = createEditor({ format: 'markdown' });

    editor.update(
      () => {
        getRoot().append(
          createParagraphNode().append(
            createLinkNode('https://example.com').append(createTextNode('a')),
          ),
        );
      },
      { discrete: true },
    );
    editor.update(
      () => {
        /** @type {LinkNode} */ (
          /** @type {ElementNode} */ (getRoot().getFirstChildOrThrow()).getFirstChild()
        ).setURL(SCRIPT_URL);
      },
      { discrete: true },
    );

    expect(editor.read(() => getRoot().getTextContent())).toBe('a');
    expect(
      editor.read(() =>
        isLinkNode(/** @type {ElementNode} */ (getRoot().getFirstChildOrThrow()).getFirstChild()),
      ),
    ).toBe(false);
  });
});
