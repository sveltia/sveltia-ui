/* eslint-disable import/first */
/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable max-classes-per-file */

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
vi.mock('./shiki/highlighter.js', () => getMock('./shiki/highlighter.js'));
vi.mock('./shiki/facade.js', () => getMock('./shiki/facade.js'));
vi.mock('./shiki/theme.js', () => getMock('./shiki/theme.js'));
vi.mock('@lexical/dragon', () => getMock('@lexical/dragon'));
vi.mock('@lexical/extension', () => getMock('@lexical/extension'));
vi.mock('@lexical/html', () => getMock('@lexical/html'));
vi.mock('./editing/alignment.js', () => getMock('./editing/alignment.js'));
vi.mock('./editing/table.js', () => getMock('./editing/table.js'));
vi.mock('./conversion/html.js', () => getMock('./conversion/html.js'));
vi.mock('@lexical/history', () => getMock('@lexical/history'));
vi.mock('@lexical/link', () => getMock('@lexical/link'));
vi.mock('@lexical/list', () => getMock('@lexical/list'));
vi.mock('@lexical/markdown', () => getMock('@lexical/markdown'));
vi.mock('@lexical/rich-text', () => getMock('@lexical/rich-text'));
vi.mock('@lexical/table', () => getMock('@lexical/table'));
vi.mock('@lexical/utils', () => getMock('@lexical/utils'));
vi.mock('lexical', () => getMock('lexical'));

import { editorState, resetEditorMocks } from '#lib/test-utils/editor-mocks.js';
import { initEditor } from './core.js';
import { registerCodeHighlighting } from './shiki/highlighter.js';
import { $ensureParagraphAfterTable, $normalizeTableHeaders } from './editing/table.js';

describe('initEditor', () => {
  beforeEach(() => {
    resetEditorMocks();
  });

  it('initializes the editor and registers cleanup hooks', () => {
    const { editor, dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: true,
      isCodeEditor: true,
      defaultLanguage: 'plain',
      modes: [],
      enabledButtons: ['link', 'bulleted-list', 'numbered-list'],
    });

    expect(editor).toBe(editorState);
    expect(editorState._commands).toHaveLength(7);
    // The root transform for the code editor, and the link transform
    expect(editorState._transforms).toHaveLength(2);
    expect(editorState._updateListeners).toHaveLength(1);
    expect(editorState._rootListeners).toHaveLength(1);

    const root = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    const cleanup = editorState._rootListeners[0](root);

    expect(root.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    cleanup();
    dispose();
    expect(root.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('builds the editor without an initial blank paragraph', async () => {
    const { buildEditorFromExtensions } = await import('@lexical/extension');

    vi.mocked(buildEditorFromExtensions).mockClear();

    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: [],
    });

    // Otherwise the blank paragraph lands on the undo stack, and undoing right after the editor
    // loads clears the imported content
    expect(vi.mocked(buildEditorFromExtensions).mock.calls[0][0]).toMatchObject({
      $initialEditorState: null,
    });
    dispose();
  });

  describe('tables', () => {
    /**
     * Initialize the editor with the given options, and get the extension dependencies passed to
     * `buildEditorFromExtensions()` along with the table transforms registered.
     * @param {Partial<import('#lib/typedefs.js').TextEditorConfig>} config Editor config.
     * @returns {Promise<{ dependencies: any[], transforms: any[], dispose: () => void }>} Result.
     */
    const initWithTable = async (config) => {
      const { buildEditorFromExtensions } = await import('@lexical/extension');
      const { TableNode } = await import('@lexical/table');

      vi.mocked(buildEditorFromExtensions).mockClear();

      const { dispose } = initEditor({
        components: [],
        useMarkdownShortcuts: false,
        isCodeEditor: false,
        modes: [],
        enabledButtons: ['table'],
        ...config,
      });

      return {
        dependencies: /** @type {any} */ (vi.mocked(buildEditorFromExtensions).mock.calls[0][0])
          .dependencies,
        transforms: editorState._transforms.filter(({ klass }) => klass === TableNode),
        dispose,
      };
    };

    it('registers the table extension and transform with the table button', async () => {
      const { TableExtension } = await import('@lexical/table');
      const { dependencies, transforms, dispose } = await initWithTable({});

      expect(dependencies).toContainEqual([
        TableExtension,
        {
          hasCellMerge: false,
          hasCellBackgroundColor: false,
          hasHorizontalScroll: true,
          hasTabHandler: true,
        },
      ]);
      expect(transforms).toHaveLength(1);

      const table = {};

      transforms[0].listener(table);
      expect($ensureParagraphAfterTable).toHaveBeenCalledWith(table);
      expect($normalizeTableHeaders).toHaveBeenCalledWith(table);
      dispose();
    });

    it('leaves the header rows of an HTML table alone', async () => {
      const { transforms, dispose } = await initWithTable({ format: 'html' });
      const table = {};

      transforms[0].listener(table);
      expect($ensureParagraphAfterTable).toHaveBeenCalledWith(table);
      expect($normalizeTableHeaders).not.toHaveBeenCalled();
      dispose();
    });

    it.each([
      ['without the table button', { enabledButtons: [] }],
      ['in the code editor', { isCodeEditor: true }],
    ])('doesn’t register table editing %s', async (_name, config) => {
      const { dependencies, transforms, dispose } = await initWithTable(config);

      expect(dependencies.some((dep) => Array.isArray(dep))).toBe(false);
      expect(transforms).toHaveLength(0);
      dispose();
    });

    it.each(
      /** @type {[string, Partial<import('#lib/typedefs.js').TextEditorConfig>, boolean][]} */ ([
        ['with the horizontal rule button', { enabledButtons: ['horizontal-rule'] }, true],
        ['without the button', { enabledButtons: [] }, false],
        ['in the code editor', { enabledButtons: ['horizontal-rule'], isCodeEditor: true }, false],
      ]),
    )('registers the horizontal rule extension %s: %s', async (_name, config, expected) => {
      const { HorizontalRuleExtension } = await import('@lexical/extension');
      const { dependencies, dispose } = await initWithTable(config);

      expect(dependencies.includes(HorizontalRuleExtension)).toBe(expected);
      dispose();
    });
  });

  it('initializes the editor without markdown shortcuts', () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      defaultLanguage: 'plain',
      modes: [],
      enabledButtons: ['link', 'bulleted-list', 'numbered-list'],
    });

    expect(editorState._commands).toHaveLength(7);
    dispose();
  });

  it('registers components with the editor', () => {
    const mockNode = class {};
    const mockTransformer = { type: 'mock' };

    const { editor, dispose } = initEditor({
      components: /** @type {any} */ ([
        { node: /** @type {any} */ (mockNode), transformer: /** @type {any} */ (mockTransformer) },
      ]),
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: [],
    });

    expect(editor).toBe(editorState);
    dispose();

    expect(editor).toBe(editorState);
    dispose();
  });

  it('handles disposal of multiple registered listeners', () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: true,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['link', 'bulleted-list', 'numbered-list'],
    });

    const initialCommandCount = editorState._commands.length;

    expect(initialCommandCount).toBeGreaterThan(0);

    dispose();
    // After dispose, listeners should still be registered on editor state,
    // but dispose just clears the internal unregisters array
  });

  it('returns early when root listener receives null root', () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: [],
    });

    const result = editorState._rootListeners[0](null);

    expect(result).toBeUndefined();
    dispose();
  });

  it('caps the undo history', async () => {
    const { registerHistory } = await import('@lexical/history');

    vi.mocked(registerHistory).mockClear();
    initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: [],
    });

    expect(vi.mocked(registerHistory).mock.calls[0][5]).toBeGreaterThan(0);
  });

  it('initializes editor with markdown shortcuts enabled', () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: true,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['link', 'bulleted-list', 'numbered-list'],
    });

    expect(editorState._commands).toHaveLength(7);
    expect(editorState._updateListeners).toHaveLength(1);
    expect(editorState._rootListeners).toHaveLength(1);

    dispose();
  });

  it('registers the commands of the enabled buttons', () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['link', 'bulleted-list', 'numbered-list'],
    });

    // Should register 5 commands:
    // toggleLink, paste, insertUnorderedList, insertOrderedList, insertParagraph
    const commands = editorState._commands.map((cmd) => cmd.command);

    expect(commands).toContain('toggleLink');
    expect(commands).toContain('paste');
    expect(commands).toContain('insertUnorderedList');
    expect(commands).toContain('insertOrderedList');
    expect(commands).toContain('insertParagraph');

    dispose();
  });

  it('initializes editor with multiple components and custom transformers', () => {
    const mockNode1 = class {};
    const mockNode2 = class {};
    const mockTransformer1 = { type: 'custom1' };
    const mockTransformer2 = { type: 'custom2' };

    const { dispose } = initEditor({
      components: /** @type {any} */ ([
        {
          node: /** @type {any} */ (mockNode1),
          transformer: /** @type {any} */ (mockTransformer1),
        },
        {
          node: /** @type {any} */ (mockNode2),
          transformer: /** @type {any} */ (mockTransformer2),
        },
      ]),
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['link', 'bulleted-list', 'numbered-list'],
    });

    expect(editorState._commands).toHaveLength(7);
    dispose();
  });

  it('registers the tokenizer with the configured language and current theme', () => {
    vi.mocked(registerCodeHighlighting).mockClear();

    initEditor({
      modes: [],
      enabledButtons: [],
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: true,
      defaultLanguage: 'javascript',
    });

    const tokenizer = /** @type {any} */ (vi.mocked(registerCodeHighlighting).mock.calls[0]?.[1]);

    expect(tokenizer.defaultLanguage).toBe('javascript');
    expect(tokenizer.defaultTheme).toBe('github-light');
    expect(typeof tokenizer.tokenize).toBe('function');
  });
});
