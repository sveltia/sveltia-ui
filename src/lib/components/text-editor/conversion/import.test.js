/* eslint-disable import/first */
/* eslint-disable jsdoc/require-jsdoc */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getMock } = vi.hoisted(() => ({
  /**
   * Get the shared mock of the given module.
   * @param {string} id Module ID.
   * @returns {Promise<any>} Mocked module exports.
   */
  getMock: async (id) => (await import('#lib/test-utils/editor-mocks.js')).editorMocks[id],
}));

vi.mock('@sveltia/utils/misc', () => getMock('@sveltia/utils/misc'));
vi.mock('@sveltia/utils/events', () => getMock('@sveltia/utils/events'));
vi.mock('@sveltia/utils/string', () => getMock('@sveltia/utils/string'));
vi.mock('@lexical/code-core', () => getMock('@lexical/code-core'));
vi.mock('../shiki/highlighter.js', () => getMock('./shiki/highlighter.js'));
vi.mock('../shiki/facade.js', () => getMock('./shiki/facade.js'));
vi.mock('../shiki/theme.js', () => getMock('./shiki/theme.js'));
vi.mock('@lexical/dragon', () => getMock('@lexical/dragon'));
vi.mock('@lexical/extension', () => getMock('@lexical/extension'));
vi.mock('@lexical/html', () => getMock('@lexical/html'));
vi.mock('../editing/alignment.js', () => getMock('./editing/alignment.js'));
vi.mock('../editing/table.js', () => getMock('./editing/table.js'));
vi.mock('./html.js', () => getMock('./conversion/html.js'));
vi.mock('@lexical/history', () => getMock('@lexical/history'));
vi.mock('@lexical/link', () => getMock('@lexical/link'));
vi.mock('@lexical/list', () => getMock('@lexical/list'));
vi.mock('@lexical/markdown', () => getMock('@lexical/markdown'));
vi.mock('@lexical/rich-text', () => getMock('@lexical/rich-text'));
vi.mock('@lexical/table', () => getMock('@lexical/table'));
vi.mock('@lexical/utils', () => getMock('@lexical/utils'));
vi.mock('lexical', () => getMock('lexical'));

import { resetEditorMocks } from '#lib/test-utils/editor-mocks.js';
import { loadEngine } from '../shiki/facade.js';
import { convertMarkdownToLexical } from './import.js';

describe('convertMarkdownToLexical', () => {
  beforeEach(() => {
    resetEditorMocks();
  });

  it('skips an import superseded by a newer one while loading the highlighter', async () => {
    const engine = Promise.withResolvers();

    vi.mocked(loadEngine).mockImplementationOnce(() => engine.promise);

    /** @type {string[]} */
    const imported = [];
    const { $convertFromMarkdownString } = await import('@lexical/markdown');

    vi.mocked($convertFromMarkdownString).mockImplementation((value) => {
      imported.push(/** @type {string} */ (value));
    });

    const editor = /** @type {any} */ ({
      update: vi.fn((callback) => callback()),
      read: vi.fn((callback) => callback()),
      getEditorState: () => ({ isEmpty: () => false }),
    });

    const first = convertMarkdownToLexical(editor, '```js\nconst a = 1;\n```', []);
    const second = convertMarkdownToLexical(editor, 'Newer', []);

    await expect(second).resolves.toBe('converted');
    engine.resolve(undefined);
    // The older value, which finishes last, must not overwrite the newer one
    await expect(first).resolves.toBeUndefined();
    expect(imported).toEqual(['Newer']);
    vi.mocked($convertFromMarkdownString).mockReset();
  });

  it('ignores a highlighter error in a superseded import', async () => {
    const engine = Promise.withResolvers();

    vi.mocked(loadEngine).mockImplementationOnce(() => engine.promise);

    const editor = /** @type {any} */ ({
      update: vi.fn((callback) => callback()),
      read: vi.fn((callback) => callback()),
      getEditorState: () => ({ isEmpty: () => false }),
    });

    const first = convertMarkdownToLexical(editor, '```js\nconst a = 1;\n```', []);

    await convertMarkdownToLexical(editor, 'Newer', []);
    engine.reject(new Error('offline'));
    await expect(first).resolves.toBeUndefined();
    expect(editor.update).toHaveBeenCalledTimes(1);
  });

  it('throws a highlighter error in the latest import', async () => {
    vi.mocked(loadEngine).mockRejectedValueOnce(new Error('offline'));

    const editor = /** @type {any} */ ({
      update: vi.fn((callback) => callback()),
      read: vi.fn((callback) => callback()),
      getEditorState: () => ({ isEmpty: () => false }),
    });

    await expect(convertMarkdownToLexical(editor, '```js\nconst a = 1;\n```', [])).rejects.toThrow(
      'offline',
    );
    expect(editor.update).not.toHaveBeenCalled();
  });

  it('converts markdown into lexical nodes through the editor update callback', async () => {
    const editor = /** @type {any} */ ({
      update: vi.fn((callback) => callback()),
      read: vi.fn((callback) => callback()),
      getEditorState: () => ({ isEmpty: () => false }),
      focus: vi.fn(),
      isComposing: () => false,
    });

    // The value is returned as the editor exports it, from an update tagged as an import
    await expect(convertMarkdownToLexical(editor, '# Heading', [])).resolves.toBe('converted');
    expect(editor.update).toHaveBeenCalledWith(expect.any(Function), {
      tag: 'sui-import',
      discrete: true,
    });
  });

  it('merges the first import into the empty initial state in the history', async () => {
    const editor = /** @type {any} */ ({
      update: vi.fn((callback) => callback()),
      read: vi.fn((callback) => callback()),
      getEditorState: () => ({ isEmpty: () => true }),
      focus: vi.fn(),
      isComposing: () => false,
    });

    // The empty state can’t be restored, so it must not be pushed onto the undo stack
    await expect(convertMarkdownToLexical(editor, '# Heading', [])).resolves.toBe('converted');
    expect(editor.update).toHaveBeenCalledWith(expect.any(Function), {
      tag: ['sui-import', 'history-merge'],
      discrete: true,
    });
  });

  it('pads blank blockquote lines before converting markdown', async () => {
    const { $convertFromMarkdownString } = await import('@lexical/markdown');

    const editor = /** @type {any} */ ({
      update: vi.fn((callback) => callback()),
      read: vi.fn((callback) => callback()),
      getEditorState: () => ({ isEmpty: () => false }),
      focus: vi.fn(),
      isComposing: () => false,
    });

    await convertMarkdownToLexical(editor, '> a\n>\n> b', []);

    expect($convertFromMarkdownString).toHaveBeenCalledWith('> a\n> \n> b', []);
  });

  it('converts tilde fences and setext headings only if code blocks and headings are enabled', async () => {
    const { $convertFromMarkdownString, HEADING } = await import('@lexical/markdown');
    const { CODE } = await import('./transformers/code.js');

    const editor = /** @type {any} */ ({
      update: vi.fn((callback) => callback()),
      read: vi.fn((callback) => callback()),
      getEditorState: () => ({ isEmpty: () => false }),
      focus: vi.fn(),
      isComposing: () => false,
    });

    const value = 'Title\n===\n\n~~~\ncode\n~~~';
    // Copies of the transformers, like the `$state` proxy the editor gets, are found by their
    // regular expressions
    const code = /** @type {any} */ ({ ...CODE });
    const heading = /** @type {any} */ ({ ...HEADING });

    // Neither enabled: the syntax is kept as text, as written
    await convertMarkdownToLexical(editor, value, []);
    expect($convertFromMarkdownString).toHaveBeenLastCalledWith(value, []);

    await convertMarkdownToLexical(editor, value, [code]);
    expect($convertFromMarkdownString).toHaveBeenLastCalledWith('Title\n===\n\n```\ncode\n```', [
      code,
    ]);

    await convertMarkdownToLexical(editor, value, [heading]);
    expect($convertFromMarkdownString).toHaveBeenLastCalledWith('# Title\n\n~~~\ncode\n~~~', [
      heading,
    ]);

    await convertMarkdownToLexical(editor, value, [code, heading]);
    expect($convertFromMarkdownString).toHaveBeenLastCalledWith('# Title\n\n```\ncode\n```', [
      code,
      heading,
    ]);
  });

  it('converts markdown with code blocks in different languages', async () => {
    const editor = /** @type {any} */ ({
      update: vi.fn((callback) => callback()),
      read: vi.fn((callback) => callback()),
      getEditorState: () => ({ isEmpty: () => false }),
      focus: vi.fn(),
      isComposing: () => false,
    });

    const markdown = '```javascript\nconst x = 1;\n```\n```python\nprint("hello")\n```';

    await expect(convertMarkdownToLexical(editor, markdown, [])).resolves.toBe('converted');
  });

  it('handles convertMarkdownToLexical with empty markdown', async () => {
    const editor = /** @type {any} */ ({
      update: vi.fn((callback) => callback()),
      read: vi.fn((callback) => callback()),
      getEditorState: () => ({ isEmpty: () => false }),
      focus: vi.fn(),
      isComposing: () => false,
    });

    await expect(convertMarkdownToLexical(editor, '', [])).resolves.toBe('converted');
    expect(editor.update).toHaveBeenCalled();
  });

  it('handles convertMarkdownToLexical with code blocks', async () => {
    const editor = /** @type {any} */ ({
      update: vi.fn((callback) => callback()),
      read: vi.fn((callback) => callback()),
      getEditorState: () => ({ isEmpty: () => false }),
      focus: vi.fn(),
      isComposing: () => false,
    });

    const markdown = '```js\nconst x = 1;\n```';

    await expect(convertMarkdownToLexical(editor, markdown, [])).resolves.toBe('converted');
    expect(editor.update).toHaveBeenCalled();
  });

  it('convertMarkdownToLexical with multiple code block languages', async () => {
    const editor = /** @type {any} */ ({
      update: vi.fn((callback) => callback()),
      read: vi.fn((callback) => callback()),
      getEditorState: () => ({ isEmpty: () => false }),
      focus: vi.fn(),
      isComposing: () => false,
    });

    const markdown = '```javascript\ncode\n```\n```python\ncode\n```\n```ruby\ncode\n```';

    await expect(convertMarkdownToLexical(editor, markdown, [])).resolves.toBe('converted');
    expect(editor.update).toHaveBeenCalled();
  });

  it('handles convertMarkdownToLexical with empty value', async () => {
    const editor = /** @type {any} */ ({
      update: vi.fn((callback) => callback()),
      read: vi.fn((callback) => callback()),
      getEditorState: () => ({ isEmpty: () => false }),
      focus: vi.fn(),
      isComposing: () => false,
    });

    await expect(convertMarkdownToLexical(editor, '', [])).resolves.toBe('converted');
  });

  it('converts markdown with error handling', async () => {
    const { $convertFromMarkdownString: convertFromMarkdownString } = /** @type {any} */ (
      await vi.importMock('@lexical/markdown')
    );

    /** @type {any} */ (convertFromMarkdownString).mockImplementation(() => {
      throw new Error('Conversion failed');
    });

    const editor = /** @type {any} */ ({
      update: vi.fn((callback) => {
        callback();
      }),
      getEditorState: () => ({ isEmpty: () => false }),
      focus: vi.fn(),
      isComposing: () => false,
    });

    await expect(convertMarkdownToLexical(editor, '# Heading', [])).rejects.toThrow();
  });
});
