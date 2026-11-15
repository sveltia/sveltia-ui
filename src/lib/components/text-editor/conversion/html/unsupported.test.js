/* eslint-disable jsdoc/require-jsdoc */

import { afterEach, describe, expect, it } from 'vitest';
import { findUnsupportedNode } from './index.js';
import {
  createComponentNode,
  createEditor,
  createEditorWithComponents,
  disposeEditors,
} from '#lib/test-utils/html-editor.js';

afterEach(disposeEditors);

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

  it('should ignore the content of an element an editor component imports', () => {
    const editor = createEditorWithComponents();

    expect(
      findUnsupportedNode(
        editor,
        parse('<figure class="photo"><img src="a.png"><figcaption>A</figcaption></figure>'),
      ),
    ).toBeUndefined();
  });

  it('should return an element only editor components handle, which none of them imports', () => {
    const editor = createEditorWithComponents();

    expect(findUnsupportedNode(editor, parse('<figure><img src="a.png"></figure>'))?.nodeName).toBe(
      'FIGURE',
    );
  });

  it('should not return an element another node handles, which no editor component imports', () => {
    const { editor } = createEditor({
      components: /** @type {any[]} */ ([
        {
          id: 'linked-image',
          label: 'Linked Image',
          node: createComponentNode({
            type: 'test-linked-image',
            tagName: 'a',
            accepts: (element) => !!element.querySelector('img'),
            inline: true,
          }),
          transformer: {},
        },
      ]),
    });

    expect(findUnsupportedNode(editor, parse('<p><a href="/x">link</a></p>'))).toBeUndefined();
  });

  it('should ignore the content of a `<pre>` element', () => {
    const { editor } = createEditor();

    expect(
      findUnsupportedNode(editor, parse('<pre><code><mark>a</mark></code></pre>')),
    ).toBeUndefined();
  });
});
describe('findUnsupportedNode with task lists', () => {
  /**
   * Parse the given HTML.
   * @param {string} html HTML.
   * @returns {Document} Document.
   */
  const parse = (html) => new DOMParser().parseFromString(html, 'text/html');

  it('should accept the check box of a task list item, but no other `<input>`', () => {
    const { editor } = createEditor();

    expect(
      findUnsupportedNode(
        editor,
        parse('<ul><li class="task-list-item"><input type="checkbox"> a</li></ul>'),
      ),
    ).toBeUndefined();

    [
      // Not in a task list item, like the output of marked
      '<ul><li><input type="checkbox"> a</li></ul>',
      // Not a check box
      '<ul><li class="task-list-item"><input type="text"> a</li></ul>',
      // A second `<input>`, which Lexical doesn’t take the state from
      '<ul><li class="task-list-item"><input type="checkbox"><input type="checkbox"> a</li></ul>',
      '<p><input type="checkbox"></p>',
    ].forEach((html) => {
      expect(findUnsupportedNode(editor, parse(html))?.nodeName).toBe('INPUT');
    });
  });

  it('should not accept any `<input>` without the task list button', () => {
    const { editor } = createEditor({ enabledButtons: ['bulleted-list'] });

    expect(
      findUnsupportedNode(
        editor,
        parse('<ul><li class="task-list-item"><input type="checkbox"> a</li></ul>'),
      )?.nodeName,
    ).toBe('INPUT');
  });
});
