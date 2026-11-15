import { afterEach, describe, expect, it } from 'vitest';
import { convertHtmlToLexical } from '../import.js';
import { createEditorWithComponents, disposeEditors } from '#lib/test-utils/html-editor.js';

afterEach(disposeEditors);

describe('editor components in HTML', () => {
  it('should import a component element along with its content', async () => {
    const editor = createEditorWithComponents();
    const html = '<figure class="photo"><img src="a.png"><figcaption>A</figcaption></figure>';

    expect(await convertHtmlToLexical(editor, html)).toBe(html);
  });

  it.each([
    '<p>a <img src="a.png"> b</p>',
    '<p>a <a href="/x"><img src="a.png"></a> b</p>',
    '<p>See <a href="/x">link <img src="a.png"></a></p>',
    '<p><img src="a.png"> <img src="b.png"></p>',
  ])('should keep the spaces around an inline component element in %s', async (html) => {
    const editor = createEditorWithComponents();

    expect(await convertHtmlToLexical(editor, html)).toBe(html);
  });

  it('should still collapse whitespace like Lexical', async () => {
    const editor = createEditorWithComponents();

    expect(
      await convertHtmlToLexical(
        editor,
        '<p>\n  a  <b>b</b>\n c <img src="a.png">\n</p>\n<p> d </p>',
      ),
    ).toBe('<p>a <strong>b</strong> c <img src="a.png"></p><p>d</p>');
  });

  it('should collapse whitespace around inline and block styled elements and line breaks', async () => {
    const editor = createEditorWithComponents();

    expect(
      await convertHtmlToLexical(
        editor,
        '<p>a <span style="display: inline-block">b</span> c <br> d <img src="a.png"></p>',
      ),
    ).toBe('<p>a b c<br>d <img src="a.png"></p>');
    expect(
      await convertHtmlToLexical(editor, '<p>a <span style="display: block">b</span> c</p>'),
    ).toBe('<p>abc</p>');
  });

  it('should drop the spaces around a block component element', async () => {
    const editor = createEditorWithComponents();

    expect(
      await convertHtmlToLexical(
        editor,
        '<p>a </p> <figure class="photo"><img src="a.png"></figure> <p> b</p>',
      ),
    ).toBe('<p>a</p><figure class="photo"><img src="a.png"></figure><p>b</p>');
  });
});
