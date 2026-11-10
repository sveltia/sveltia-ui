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

import { editorState, resetEditorMocks } from '#lib/test-utils/editor-mocks.js';
import { initEditor } from '../core.js';
import { onEditorUpdate } from './update.js';
import { BLOCK_SYNTAX_ESCAPE } from './transformers/block-escape.js';

describe('Update event', () => {
  beforeEach(() => {
    resetEditorMocks();
  });

  it('only triggers the Update event for the latest update in a burst', async () => {
    const { $convertToMarkdownString } = await import('@lexical/markdown');
    const originalUpdate = editorState.update;
    const update = vi.fn((/** @type {any} */ callback) => callback());
    /** @type {any} */
    const dirty = { dirtyElements: new Map([['root', true]]), dirtyLeaves: new Set() };

    editorState.isComposing = () => false;
    editorState.update = update;
    vi.mocked($convertToMarkdownString).mockClear();

    try {
      const { dispose } = initEditor({
        components: [],
        useMarkdownShortcuts: false,
        isCodeEditor: false,
        modes: [],
        enabledButtons: [],
      });

      editorState._updateListeners[0](dirty);
      editorState._updateListeners[0](dirty);
      editorState._updateListeners[0](dirty);
      await Promise.resolve();

      expect(update).toHaveBeenCalledTimes(1);
      expect($convertToMarkdownString).toHaveBeenCalledTimes(1);
      dispose();
    } finally {
      editorState.update = originalUpdate;
    }
  });

  it('reuses the Markdown value when only the selection has changed', async () => {
    const { $convertToMarkdownString } = await import('@lexical/markdown');
    const dispatchEvent = vi.fn();
    const originalGetRootElement = editorState.getRootElement;

    editorState.isComposing = () => false;
    editorState.getRootElement = () => ({ dispatchEvent });
    vi.mocked($convertToMarkdownString).mockClear();

    try {
      const { dispose } = initEditor({
        components: [],
        useMarkdownShortcuts: false,
        isCodeEditor: false,
        modes: [],
        enabledButtons: [],
      });

      editorState._updateListeners[0]({
        dirtyElements: new Map([['root', true]]),
        dirtyLeaves: new Set(),
      });
      await Promise.resolve();
      editorState._updateListeners[0]({ dirtyElements: new Map(), dirtyLeaves: new Set() });
      await Promise.resolve();

      expect($convertToMarkdownString).toHaveBeenCalledTimes(1);
      expect(dispatchEvent).toHaveBeenCalledTimes(2);
      expect(dispatchEvent.mock.calls[1][0].detail.value).toBe('converted');
      dispose();
    } finally {
      editorState.getRootElement = originalGetRootElement;
    }
  });

  it('converts the document again after a composition that changed it', async () => {
    const { $convertToMarkdownString } = await import('@lexical/markdown');
    let composing = false;

    editorState.isComposing = () => composing;
    vi.mocked($convertToMarkdownString).mockClear();

    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: [],
    });

    editorState._updateListeners[0]();
    await Promise.resolve();
    // The text changes while composing, then the composition ends without dirty nodes
    composing = true;
    editorState._updateListeners[0]({
      dirtyElements: new Map([['root', true]]),
      dirtyLeaves: new Set(),
    });
    composing = false;
    editorState._updateListeners[0]({ dirtyElements: new Map(), dirtyLeaves: new Set() });
    await Promise.resolve();

    expect($convertToMarkdownString).toHaveBeenCalledTimes(2);
    dispose();
  });

  it('skips the pending Update event once disposed', async () => {
    const originalUpdate = editorState.update;
    const update = vi.fn();

    editorState.isComposing = () => false;
    editorState.update = update;

    try {
      const { dispose } = initEditor({
        components: [],
        useMarkdownShortcuts: false,
        isCodeEditor: false,
        modes: [],
        enabledButtons: [],
      });

      editorState._updateListeners[0]();
      dispose();
      await Promise.resolve();

      expect(update).not.toHaveBeenCalled();
    } finally {
      editorState.update = originalUpdate;
    }
  });

  it('skips update listener when editor is composing', async () => {
    editorState.isComposing = vi.fn(() => true);

    initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: [],
    });

    editorState._updateListeners[0]();
    await Promise.resolve();

    // When isComposing is true, the async update should not happen
    expect(editorState.isComposing).toHaveBeenCalled();
  });

  it('dispatches Update event through onEditorUpdate', () => {
    const mockRootElement = {
      dispatchEvent: vi.fn(),
    };

    const mockEditor = /** @type {any} */ ({
      getRootElement: vi.fn(() => mockRootElement),
    });

    onEditorUpdate(mockEditor, []);

    expect(mockRootElement.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'Update',
      }),
    );
  });

  it('includes correct markdown value in the Update event detail', () => {
    const mockRootElement = {
      dispatchEvent: vi.fn((event) => {
        expect(event.detail).toHaveProperty('value');
        expect(event.detail).toHaveProperty('selection');
      }),
    };

    const mockEditor = /** @type {any} */ ({
      getRootElement: vi.fn(() => mockRootElement),
    });

    onEditorUpdate(mockEditor, []);
    expect(mockRootElement.dispatchEvent).toHaveBeenCalled();
  });

  it('trims blank blockquote lines in the Update event value', async () => {
    const { $convertToMarkdownString } = await import('@lexical/markdown');

    vi.mocked($convertToMarkdownString).mockReturnValueOnce('> a\n> \n> b');

    const mockRootElement = { dispatchEvent: vi.fn() };
    const mockEditor = /** @type {any} */ ({ getRootElement: vi.fn(() => mockRootElement) });

    onEditorUpdate(mockEditor, []);

    expect(mockRootElement.dispatchEvent.mock.calls[0][0].detail.value).toBe('> a\n>\n> b');
  });

  it('removes the line breaks left by empty paragraphs at the end', async () => {
    const { $convertToMarkdownString } = await import('@lexical/markdown');

    vi.mocked($convertToMarkdownString).mockReturnValueOnce(':::note\nHi\n:::\n\n\n');

    const mockRootElement = { dispatchEvent: vi.fn() };
    const mockEditor = /** @type {any} */ ({ getRootElement: vi.fn(() => mockRootElement) });

    onEditorUpdate(mockEditor, []);

    expect(mockRootElement.dispatchEvent.mock.calls[0][0].detail.value).toBe(':::note\nHi\n:::');
  });

  it('filters out transformers with disabled markdown tags when converting to markdown', async () => {
    const { $convertToMarkdownString } = await import('@lexical/markdown');
    const mockConvertFn = vi.mocked($convertToMarkdownString);

    // Clear previous calls and set return value
    mockConvertFn.mockClear();
    mockConvertFn.mockReturnValue('converted');

    const mockRootElement = {
      dispatchEvent: vi.fn(),
    };

    const mockEditor = /** @type {any} */ ({
      getRootElement: vi.fn(() => mockRootElement),
    });

    const transformers = /** @type {any[]} */ ([
      { tag: '**' }, // BOLD_STAR - should be kept
      { tag: '__' }, // BOLD_UNDERSCORE - should be filtered out
      { tag: '*' }, // ITALIC_STAR - should be filtered out
      { tag: '_' }, // ITALIC_UNDERSCORE - should be kept
      { tag: '~~' }, // STRIKETHROUGH - should be kept
      { tag: '***' }, // BOLD_ITALIC_STAR - should be filtered out
      { tag: '___' }, // BOLD_ITALIC_UNDERSCORE - should be filtered out
    ]);

    onEditorUpdate(mockEditor, transformers);

    // Verify that convertToMarkdownString was called with filtered transformers
    expect(mockConvertFn).toHaveBeenCalled();

    const calledWithTransformers = mockConvertFn.mock.calls[0]?.[0];

    expect(calledWithTransformers).toBeDefined();

    if (calledWithTransformers) {
      // Should include transformers without disabled tags
      expect(calledWithTransformers).toContainEqual({ tag: '**' });
      expect(calledWithTransformers).toContainEqual({ tag: '_' });
      expect(calledWithTransformers).toContainEqual({ tag: '~~' });

      // Should NOT include transformers with disabled tags
      expect(calledWithTransformers).not.toContainEqual({ tag: '__' });
      expect(calledWithTransformers).not.toContainEqual({ tag: '*' });
      expect(calledWithTransformers).not.toContainEqual({ tag: '***' });
      expect(calledWithTransformers).not.toContainEqual({ tag: '___' });

      // Verify the filtered list has 3 transformers instead of 7, followed by the escape of block
      // syntax at the start of a line
      expect(calledWithTransformers).toEqual([
        { tag: '**' },
        { tag: '_' },
        { tag: '~~' },
        BLOCK_SYNTAX_ESCAPE,
      ]);
    }
  });
});
