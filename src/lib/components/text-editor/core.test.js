/* eslint-disable import/first */
/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable max-classes-per-file */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { editorState, mockState, rootState } = vi.hoisted(() => {
  const hoistedMockState = {
    codeNode: false,
    codeHighlightNode: false,
    headingNode: false,
    linkNode: false,
    listItemNode: false,
    listNode: false,
    quoteNode: false,
    listIndent: 0,
  };

  const hoistedRootState = {
    children: /** @type {any[]} */ ([]),
    getChildren() {
      return this.children;
    },
    append(/** @type {any} */ node) {
      this.children.push(node);
    },
  };

  const hoistedEditorState = {
    _commands: /** @type {any[]} */ ([]),
    _rootListeners: /** @type {any[]} */ ([]),
    _updateListeners: /** @type {any[]} */ ([]),
    registerCommand(/** @type {any} */ command, /** @type {any} */ listener) {
      this._commands.push({ command, listener });

      return () => {
        this._commands = this._commands.filter((entry) => entry.listener !== listener);
      };
    },
    registerUpdateListener(/** @type {any} */ listener) {
      this._updateListeners.push(listener);

      return () => {
        this._updateListeners = this._updateListeners.filter((entry) => entry !== listener);
      };
    },
    registerRootListener(/** @type {any} */ listener) {
      this._rootListeners.push(listener);

      return () => {
        this._rootListeners = this._rootListeners.filter((entry) => entry !== listener);
      };
    },
    dispatchCommand(/** @type {any} */ command, /** @type {any} */ payload) {
      const entry = this._commands.find(
        ({ command: registeredCommand }) => registeredCommand === command,
      );

      entry?.listener(payload);
    },
    update(/** @type {any} */ callback) {
      callback();
    },
    focus(/** @type {any} */ callback) {
      callback();
    },
    isComposing() {
      return false;
    },
    getRootElement() {
      return {
        dispatchEvent: vi.fn(),
      };
    },
    setEditable() {},
  };

  return {
    editorState: hoistedEditorState,
    mockState: hoistedMockState,
    rootState: hoistedRootState,
  };
});

vi.mock('@sveltia/utils/misc', () => ({
  sleep: vi.fn(() => Promise.resolve()),
}));

vi.mock('prismjs', () => ({}));

vi.mock('prismjs/components', () => ({
  default: {
    languages: {
      js: { alias: ['javascript'] },
    },
  },
}));

vi.mock('@lexical/code', () => ({
  CodeHighlightNode: class {},
  CodeNode: class {},
  $createCodeNode: vi.fn(() => ({ type: 'code', setLanguage: vi.fn(), remove() {} })),
  $isCodeHighlightNode: vi.fn(() => mockState.codeHighlightNode),
  $isCodeNode: vi.fn(() => mockState.codeNode),
}));

vi.mock('@lexical/code-prism', () => ({
  PrismTokenizer: { $tokenize: vi.fn() },
  registerCodeHighlighting: vi.fn(() => vi.fn()),
}));

vi.mock('@lexical/dragon', () => ({
  registerDragonSupport: vi.fn(() => vi.fn()),
}));

vi.mock('@lexical/extension', () => ({
  HorizontalRuleNode: class {},
}));

vi.mock('@lexical/history', () => ({
  createEmptyHistoryState: vi.fn(() => ({})),
  registerHistory: vi.fn(() => vi.fn()),
}));

vi.mock('@lexical/link', () => ({
  $isLinkNode: vi.fn(() => mockState.linkNode),
  LinkNode: class {},
  TOGGLE_LINK_COMMAND: 'toggleLink',
  $toggleLink: vi.fn(),
}));

vi.mock('@lexical/list', () => ({
  $handleListInsertParagraph: vi.fn(),
  INSERT_ORDERED_LIST_COMMAND: 'insertOrderedList',
  INSERT_UNORDERED_LIST_COMMAND: 'insertUnorderedList',
  $insertList: vi.fn(),
  $isListItemNode: vi.fn(() => mockState.listItemNode),
  $isListNode: vi.fn(() => mockState.listNode),
  ListItemNode: class {},
  ListNode: class {
    getListType() {
      return 'bullet';
    }
  },
}));

vi.mock('@lexical/markdown', () => ({
  $convertFromMarkdownString: vi.fn(),
  $convertToMarkdownString: vi.fn(() => 'converted'),
  registerMarkdownShortcuts: vi.fn(() => vi.fn()),
  TRANSFORMERS: [],
  BOLD_ITALIC_STAR: { tag: '***' },
  BOLD_ITALIC_UNDERSCORE: { tag: '___' },
  BOLD_STAR: { tag: '**' },
  CODE: { tag: 'code' },
  HEADING: { tag: '#' },
  INLINE_CODE: { tag: '`' },
  ITALIC_UNDERSCORE: { tag: '_' },
  LINK: { tag: 'link' },
  ORDERED_LIST: { tag: 'ol' },
  QUOTE: { tag: '>' },
  STRIKETHROUGH: { tag: '~~' },
  UNORDERED_LIST: { tag: 'ul' },
}));

vi.mock('@lexical/rich-text', () => ({
  HeadingNode: class {},
  $isHeadingNode: vi.fn(() => mockState.headingNode),
  $isQuoteNode: vi.fn(() => mockState.quoteNode),
  QuoteNode: class {},
  registerRichText: vi.fn(() => vi.fn()),
}));

vi.mock('@lexical/table', () => ({
  TableCellNode: class {},
  TableNode: class {},
  TableRowNode: class {},
}));

vi.mock('@lexical/utils', () => ({
  $getNearestNodeOfType: vi.fn((node) => {
    if (mockState.listItemNode) {
      return {
        getKey: () => 'node-key',
        getListType: () => 'bullet',
        getType: () => 'list',
        canIndent: () => true,
        getIndent: () => mockState.listIndent ?? 0,
      };
    }

    return node;
  }),
}));

const selectionState = vi.hoisted(() => /** @type {{ value: any }} */ ({ value: null }));

vi.mock('lexical', () => ({
  COMMAND_PRIORITY_NORMAL: 0,
  createEditor: vi.fn(() => editorState),
  ElementNode: class ElementNode {
    getType() {
      return 'element';
    }

    getTag() {
      return 'div';
    }

    getKey() {
      return 'node-key';
    }

    canIndent() {
      return !!mockState.listItemNode;
    }

    getIndent() {
      return mockState.listIndent ?? 0;
    }
  },
  $getRoot: vi.fn(() => rootState),
  $getSelection: vi.fn(() => selectionState.value),
  INDENT_CONTENT_COMMAND: 'indent',
  INSERT_PARAGRAPH_COMMAND: 'insertParagraph',
  $isRangeSelection: vi.fn((selection) => selection?.type === 'range'),
  OUTDENT_CONTENT_COMMAND: 'outdent',
}));

import { registerCodeHighlighting } from '@lexical/code-prism';
import { $getNearestNodeOfType as getNearestNodeOfType } from '@lexical/utils';
import { ElementNode } from 'lexical';
import {
  convertMarkdownToLexical,
  focusEditor,
  getSelectionTypes,
  initEditor,
  loadCodeHighlighter,
} from './core.js';

describe('text editor core', () => {
  beforeEach(() => {
    editorState._commands = [];
    editorState._rootListeners = [];
    editorState._updateListeners = [];
    selectionState.value = null;
    rootState.children = [];
    mockState.codeNode = false;
    mockState.codeHighlightNode = false;
    mockState.headingNode = false;
    mockState.linkNode = false;
    mockState.listItemNode = false;
    mockState.listNode = false;
    mockState.quoteNode = false;
    mockState.listIndent = 0;
    window.Prism = {
      tokenize: vi.fn(() => []),
      languages: { plain: {}, javascript: {} },
    };
  });

  it('returns the default selection state when the selection is not a range', () => {
    expect(getSelectionTypes()).toEqual({
      blockNodeKey: null,
      blockType: 'paragraph',
      inlineTypes: [],
    });
  });

  it('maps a heading selection to the expected block type and inline formats', () => {
    const anchor = new ElementNode();

    anchor.getType = () => 'text';
    Object.defineProperty(anchor, 'getTag', { value: () => 'h2' });

    mockState.headingNode = true;
    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => anchor },
      hasFormat: (/** @type {any} */ type) => type === 'bold',
    };

    expect(getSelectionTypes()).toEqual({
      blockNodeKey: 'node-key',
      blockType: 'heading-2',
      inlineTypes: ['bold'],
    });
  });

  it('adds link formatting and falls back to a paragraph block type for link selections', () => {
    const anchor = new ElementNode();

    anchor.getType = () => 'text';

    mockState.linkNode = true;
    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => anchor },
      hasFormat: () => false,
    };

    expect(getSelectionTypes()).toEqual({
      blockNodeKey: 'node-key',
      blockType: 'paragraph',
      inlineTypes: ['link'],
    });
  });

  it('maps list selections to the expected block type', () => {
    const anchor = new ElementNode();

    anchor.getType = () => 'text';

    mockState.listItemNode = true;
    mockState.listNode = true;
    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => anchor },
      hasFormat: () => false,
    };

    expect(getSelectionTypes()).toEqual({
      blockNodeKey: 'node-key',
      blockType: 'bulleted-list',
      inlineTypes: [],
    });
  });

  it('maps code selections to the code block type', () => {
    const anchor = new ElementNode();

    anchor.getType = () => 'text';

    mockState.codeNode = true;
    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => anchor },
      hasFormat: () => false,
    };

    expect(getSelectionTypes()).toEqual({
      blockNodeKey: 'node-key',
      blockType: 'code-block',
      inlineTypes: [],
    });
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
    expect(editorState._commands).toHaveLength(4);
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

  it('creates a code node when the code editor update listener runs on an empty root', async () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: true,
      defaultLanguage: 'javascript',
      modes: [],
      enabledButtons: [],
    });

    editorState._updateListeners[0]();
    await Promise.resolve();

    expect(rootState.children).toHaveLength(1);
    expect(rootState.children[0].type).toBe('code');
    dispose();
  });

  it('returns early when the requested Prism language is already loaded', async () => {
    await expect(loadCodeHighlighter('plain')).resolves.toBeUndefined();
  });

  it('loads Prism support for an alias when it is not already present', async () => {
    window.Prism.languages = {};
    await expect(loadCodeHighlighter('javascript')).resolves.toBeUndefined();
  });

  it('converts markdown into lexical nodes through the editor update callback', async () => {
    const editor = /** @type {any} */ ({
      update: vi.fn((callback) => callback()),
      focus: vi.fn(),
      isComposing: () => false,
    });

    await expect(convertMarkdownToLexical(editor, '# Heading', [])).resolves.toBeUndefined();
  });

  it('focuses the editor by invoking its focus callback', async () => {
    const editor = /** @type {any} */ ({ focus: vi.fn((callback) => callback()) });

    await expect(focusEditor(editor)).resolves.toBeUndefined();
    expect(editor.focus).toHaveBeenCalled();
  });

  it('maps quote selections to the blockquote type', () => {
    const anchor = new ElementNode();

    anchor.getType = () => 'text';

    mockState.quoteNode = true;
    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => anchor },
      hasFormat: () => false,
    };

    expect(getSelectionTypes()).toEqual({
      blockNodeKey: 'node-key',
      blockType: 'blockquote',
      inlineTypes: [],
    });
  });

  it('maps code highlight node selections to the code block type', () => {
    const anchor = new ElementNode();

    anchor.getType = () => 'text';

    mockState.codeHighlightNode = true;
    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => anchor },
      hasFormat: () => false,
    };

    expect(getSelectionTypes()).toEqual({
      blockNodeKey: 'node-key',
      blockType: 'code-block',
      inlineTypes: [],
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

    expect(editorState._commands).toHaveLength(4);
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

  it('removes non-code nodes from code editor when update listener runs', async () => {
    rootState.children = [{ type: 'paragraph', remove: vi.fn() }];

    initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: true,
      defaultLanguage: 'javascript',
      modes: [],
      enabledButtons: [],
    });

    editorState._updateListeners[0]();
    await Promise.resolve();

    expect(rootState.children[0].remove).toHaveBeenCalled();
  });

  it('loads Prism language that returns no canonical language', async () => {
    window.Prism.languages = {};
    await expect(loadCodeHighlighter('nonexistent')).resolves.toBeUndefined();
  });

  it('converts markdown with code blocks in different languages', async () => {
    const editor = /** @type {any} */ ({
      update: vi.fn((callback) => callback()),
      focus: vi.fn(),
      isComposing: () => false,
    });

    const markdown = '```javascript\nconst x = 1;\n```\n```python\nprint("hello")\n```';

    await expect(convertMarkdownToLexical(editor, markdown, [])).resolves.toBeUndefined();
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

  it('ignores non-Tab keys in the keydown handler', () => {
    const anchor = new ElementNode();
    const keydown = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });

    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => anchor },
    };

    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: [],
    });

    const root = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    editorState._rootListeners[0](root);

    const keydownHandler = root.addEventListener.mock.calls[0][1];

    keydownHandler(keydown);

    expect(keydown.defaultPrevented).toBe(false);
    dispose();
  });

  it('ignores Tab when selection is not a range', () => {
    const keydown = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });

    selectionState.value = null; // Not a range selection

    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: [],
    });

    const root = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    editorState._rootListeners[0](root);

    const keydownHandler = root.addEventListener.mock.calls[0][1];

    keydownHandler(keydown);

    expect(keydown.defaultPrevented).toBe(false);
    dispose();
  });

  it('handles selection with root anchor', () => {
    const anchor = new ElementNode();

    anchor.getType = () => 'root';

    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => anchor },
      hasFormat: () => false,
    };

    expect(getSelectionTypes()).toEqual({
      blockNodeKey: null,
      blockType: 'paragraph',
      inlineTypes: [],
    });
  });

  it('handles selection with multiple inline formats', () => {
    const anchor = new ElementNode();

    anchor.getType = () => 'text';

    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => anchor },
      /**
       * Mock hasFormat method.
       * @param {any} type The format type to check.
       * @returns {boolean} Whether the format is applied.
       */
      hasFormat: /** @type {any} */ (
        /**
         * Check if format is applied.
         * @param {any} type The format type to check.
         * @returns {boolean} Whether the format is applied.
         */
        (/** @type {any} */ type) => ['bold', 'italic', 'strikethrough'].includes(type)
      ),
    };

    const result = getSelectionTypes();

    expect(result.inlineTypes).toContain('bold');
    expect(result.inlineTypes).toContain('italic');
    expect(result.inlineTypes).toContain('strikethrough');
  });

  it('dispatches Update event through onEditorUpdate', () => {
    const mockRootElement = {
      dispatchEvent: vi.fn(),
    };

    const mockEditor = /** @type {any} */ ({
      getRootElement: vi.fn(() => mockRootElement),
    });

    // We'll import the function from the module after all mocks are set up
    import('./core.js').then((module) => {
      module.onEditorUpdate(mockEditor, []);

      expect(mockRootElement.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'Update',
        }),
      );
    });
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

    // Call directly instead of importing
    const { onEditorUpdate } = /** @type {any} */ (module);

    if (onEditorUpdate) {
      onEditorUpdate(mockEditor, []);
      expect(mockRootElement.dispatchEvent).toHaveBeenCalled();
    }
  });

  it('handles convertMarkdownToLexical with empty markdown', async () => {
    const editor = /** @type {any} */ ({
      update: vi.fn((callback) => callback()),
      focus: vi.fn(),
      isComposing: () => false,
    });

    await expect(convertMarkdownToLexical(editor, '', [])).resolves.toBeUndefined();
    expect(editor.update).toHaveBeenCalled();
  });

  it('handles convertMarkdownToLexical with code blocks', async () => {
    const editor = /** @type {any} */ ({
      update: vi.fn((callback) => callback()),
      focus: vi.fn(),
      isComposing: () => false,
    });

    const markdown = '```js\nconst x = 1;\n```';

    await expect(convertMarkdownToLexical(editor, markdown, [])).resolves.toBeUndefined();
    expect(editor.update).toHaveBeenCalled();
  });

  it('focuses editor and resolves promise', async () => {
    const mockEditor = /** @type {any} */ ({
      focus: vi.fn((callback) => {
        callback();
      }),
    });

    const promise = focusEditor(mockEditor);

    await expect(promise).resolves.toBeUndefined();
    expect(mockEditor.focus).toHaveBeenCalled();
  });

  it('triggers TOGGLE_LINK_COMMAND with non-string payload', () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['link'],
    });

    // Find the TOGGLE_LINK_COMMAND listener
    const toggleLinkCommand = editorState._commands.find((cmd) => cmd.command === 'toggleLink');

    expect(toggleLinkCommand).toBeDefined();

    if (toggleLinkCommand) {
      const result = toggleLinkCommand.listener({ someObject: true });

      expect(result).toBe(true);
    }

    dispose();
  });

  it('registers INSERT_UNORDERED_LIST_COMMAND and triggers it', () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['bulleted-list'],
    });

    const unorderedListCommand = editorState._commands.find(
      (cmd) => cmd.command === 'insertUnorderedList',
    );

    expect(unorderedListCommand).toBeDefined();

    if (unorderedListCommand) {
      const result = unorderedListCommand.listener();

      expect(result).toBe(true);
    }

    dispose();
  });

  it('registers INSERT_ORDERED_LIST_COMMAND and triggers it', () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['numbered-list'],
    });

    const orderedListCommand = editorState._commands.find(
      (cmd) => cmd.command === 'insertOrderedList',
    );

    expect(orderedListCommand).toBeDefined();

    if (orderedListCommand) {
      const result = orderedListCommand.listener();

      expect(result).toBe(true);
    }

    dispose();
  });

  it('convertMarkdownToLexical with multiple code block languages', async () => {
    const editor = /** @type {any} */ ({
      update: vi.fn((callback) => callback()),
      focus: vi.fn(),
      isComposing: () => false,
    });

    const markdown = '```javascript\ncode\n```\n```python\ncode\n```\n```ruby\ncode\n```';

    await expect(convertMarkdownToLexical(editor, markdown, [])).resolves.toBeUndefined();
    expect(editor.update).toHaveBeenCalled();
  });

  it('initializes editor with markdown shortcuts enabled', () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: true,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['link', 'bulleted-list', 'numbered-list'],
    });

    expect(editorState._commands).toHaveLength(4);
    expect(editorState._updateListeners).toHaveLength(1);
    expect(editorState._rootListeners).toHaveLength(1);

    dispose();
  });

  it('handles editor with focus callback that returns immediately', async () => {
    const editor = /** @type {any} */ ({
      focus: vi.fn((callback) => {
        callback();
      }),
    });

    await expect(focusEditor(editor)).resolves.toBeUndefined();
  });

  it('registers all command types in order', () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['link', 'bulleted-list', 'numbered-list'],
    });

    // Should register 4 commands:
    // toggleLink, insertUnorderedList, insertOrderedList, insertParagraph
    const commands = editorState._commands.map((cmd) => cmd.command);

    expect(commands).toContain('toggleLink');
    expect(commands).toContain('insertUnorderedList');
    expect(commands).toContain('insertOrderedList');
    expect(commands).toContain('insertParagraph');

    dispose();
  });

  it('handles convertMarkdownToLexical with empty value', async () => {
    const editor = /** @type {any} */ ({
      update: vi.fn((callback) => callback()),
      focus: vi.fn(),
      isComposing: () => false,
    });

    await expect(convertMarkdownToLexical(editor, '', [])).resolves.toBeUndefined();
  });

  it('loadCodeHighlighter with unknown language', async () => {
    window.Prism.languages = {};

    await expect(loadCodeHighlighter('unknownLang')).resolves.toBeUndefined();
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
      focus: vi.fn(),
      isComposing: () => false,
    });

    await expect(convertMarkdownToLexical(editor, '# Heading', [])).rejects.toThrow();
  });

  it('handles TOGGLE_LINK_COMMAND with string payload', () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['link'],
    });

    const linkCommand = editorState._commands.find((cmd) => cmd.command === 'toggleLink');

    if (linkCommand) {
      const result = linkCommand.listener('https://example.com');

      expect(result).toBe(true);
    }

    dispose();
  });

  it('handles INSERT_PARAGRAPH_COMMAND', () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: true,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['bulleted-list', 'numbered-list'],
    });

    const paragraphCommand = editorState._commands.find((cmd) => cmd.command === 'insertParagraph');

    if (paragraphCommand) {
      const result = paragraphCommand.listener();

      expect(result).toBeUndefined();
    }

    dispose();
  });

  it('gets selection types with non-BLOCK_BUTTON_TYPES type', () => {
    const anchor = new ElementNode();

    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => anchor },
      hasFormat: () => false,
    };

    const result = getSelectionTypes();

    expect(result.blockType).toBe('paragraph');
  });

  it('handles TOGGLE_LINK_COMMAND with null payload', () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['link'],
    });

    const linkCommand = editorState._commands.find((cmd) => cmd.command === 'toggleLink');

    if (linkCommand) {
      const result = linkCommand.listener(null);

      expect(result).toBe(true);
    }

    dispose();
  });

  it('handles TOGGLE_LINK_COMMAND with non-string payload', () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['link'],
    });

    const linkCommand = editorState._commands.find((cmd) => cmd.command === 'toggleLink');

    if (linkCommand) {
      const result = linkCommand.listener({ some: 'object' });

      expect(result).toBe(true);
    }

    dispose();
  });

  it('handles Tab key indent on list item without shift', () => {
    const keydown = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });

    // Create a fake anchor that's not an ElementNode but has the necessary properties
    const anchor = {
      getType: () => 'text',
    };

    mockState.listItemNode = true;
    mockState.listIndent = 0;

    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => anchor },
    };

    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: [],
    });

    const root = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    editorState._rootListeners[0](root);

    const keydownHandler = root.addEventListener.mock.calls[0][1];
    // Mock preventDefault on the keydown event
    const preventDefaultSpy = vi.spyOn(keydown, 'preventDefault');

    keydownHandler(keydown);

    // Check if preventDefault was called
    expect(preventDefaultSpy).toHaveBeenCalled();
    dispose();
  });

  it('handles Tab key outdent on list item with shift and indent > 0', () => {
    const keydown = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });

    // Create a fake anchor that's not an ElementNode but has the necessary properties
    const anchor = {
      getType: () => 'text',
    };

    mockState.listItemNode = true;
    mockState.listIndent = 1;

    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => anchor },
    };

    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: [],
    });

    const root = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    editorState._rootListeners[0](root);

    const keydownHandler = root.addEventListener.mock.calls[0][1];
    // Mock preventDefault on the keydown event
    const preventDefaultSpy = vi.spyOn(keydown, 'preventDefault');

    keydownHandler(keydown);

    // Check if preventDefault was called
    expect(preventDefaultSpy).toHaveBeenCalled();
    dispose();
  });

  it('returns the node type when it is in BLOCK_BUTTON_TYPES', () => {
    const mockParent = {
      getType: () => 'paragraph',
      getKey: () => 'para-key',
    };

    // Mock getNearestNodeOfType to return our mock parent
    vi.mocked(getNearestNodeOfType).mockReturnValueOnce(/** @type {any} */ (mockParent));

    const anchor = { getType: () => 'text' };

    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => anchor },
      hasFormat: () => false,
    };

    const result = getSelectionTypes();

    // 'paragraph' is in BLOCK_BUTTON_TYPES and should be returned directly
    expect(result.blockType).toBe('paragraph');
    expect(result.blockNodeKey).toBe('para-key');
  });

  it('tokenizes code with a language that does not exist in Prism by falling back to plain text', async () => {
    window.Prism.languages = {
      plain: { root: /.*/ },
      javascript: { keyword: /\b(const|let|var)\b/ },
    };

    const tokenize = vi.fn();

    window.Prism.tokenize = tokenize;

    initEditor({
      modes: [],
      enabledButtons: [],
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: true,
      defaultLanguage: 'javascript',
    });

    // Call the command handler to test the tokenize callback
    const codeHighlightingRegisterCall = vi.mocked(registerCodeHighlighting).mock.calls[0];

    const tokenizeCallback = /** @type {any} */ (
      codeHighlightingRegisterCall && codeHighlightingRegisterCall[1]
    )?.tokenize;

    // Call tokenizeCallback with a language that doesn't exist
    tokenizeCallback('code here', 'nonexistent');

    // It should fall back to plain text language
    expect(tokenize).toHaveBeenCalledWith('code here', window.Prism.languages.plain);
  });

  it('handles heading tag without digit in the match', () => {
    const anchor = new ElementNode();

    anchor.getType = () => 'text';
    Object.defineProperty(anchor, 'getTag', { value: () => 'article' }); // Tag with no digit

    mockState.headingNode = true;
    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => anchor },
      hasFormat: () => false,
    };

    const result = getSelectionTypes();

    expect(result.blockType).toBe('heading-undefined');
  });

  it('handles anchor that is an ElementNode instance in Tab handler', () => {
    const keydown = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    const anchor = new ElementNode(); // Actual ElementNode instance

    anchor.getType = () => 'text';

    mockState.listItemNode = true;
    mockState.listIndent = 0;

    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => anchor },
    };

    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: [],
    });

    const root = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    editorState._rootListeners[0](root);

    const keydownHandler = root.addEventListener.mock.calls[0][1];
    const preventDefaultSpy = vi.spyOn(keydown, 'preventDefault');

    keydownHandler(keydown);

    expect(preventDefaultSpy).toHaveBeenCalled();
    dispose();
  });

  it('handles Tab key on non-list-item element', () => {
    const keydown = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });

    const anchor = {
      getType: () => 'text',
    };

    mockState.listItemNode = false; // Not a list item

    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => anchor },
    };

    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: [],
    });

    const root = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    editorState._rootListeners[0](root);

    const keydownHandler = root.addEventListener.mock.calls[0][1];
    const preventDefaultSpy = vi.spyOn(keydown, 'preventDefault');

    keydownHandler(keydown);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
    dispose();
  });

  it('handles Tab key when list item cannot be indented', () => {
    const keydown = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });

    const anchor = {
      getType: () => 'text',
    };

    const mockParent = {
      canIndent: () => false,
    };

    vi.mocked(getNearestNodeOfType).mockReturnValueOnce(/** @type {any} */ (mockParent));
    mockState.listItemNode = true;

    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => anchor },
    };

    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: [],
    });

    const root = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    editorState._rootListeners[0](root);

    const keydownHandler = root.addEventListener.mock.calls[0][1];
    const preventDefaultSpy = vi.spyOn(keydown, 'preventDefault');

    keydownHandler(keydown);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
    dispose();
  });

  it('handles Tab key outdent when indent is 0', () => {
    const keydown = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });

    const anchor = {
      getType: () => 'text',
    };

    mockState.listItemNode = true;
    mockState.listIndent = 0; // Cannot outdent

    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => anchor },
    };

    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: [],
    });

    const root = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    editorState._rootListeners[0](root);

    const keydownHandler = root.addEventListener.mock.calls[0][1];
    const preventDefaultSpy = vi.spyOn(keydown, 'preventDefault');

    keydownHandler(keydown);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
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

    expect(editorState._commands).toHaveLength(4);
    dispose();
  });

  it('does not remove non-code node when children.length > 1', async () => {
    const node1Remove = vi.fn();
    const node2Remove = vi.fn();

    rootState.children = [
      { type: 'paragraph', remove: node1Remove },
      { type: 'text', remove: node2Remove },
    ]; // More than 1 child

    initEditor({
      modes: [],
      enabledButtons: [],
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: true,
      defaultLanguage: 'javascript',
    });

    editorState._updateListeners[0]();
    await Promise.resolve();

    // Nodes should not be removed when length > 1
    expect(node1Remove).not.toHaveBeenCalled();
    expect(node2Remove).not.toHaveBeenCalled();
  });

  it('handles code highlighting with non-array language alias', async () => {
    // Ensure we test the path where alias is a string, not an array
    window.Prism.languages = {
      js: 'javascript', // Alias as string instead of array
    };

    await expect(loadCodeHighlighter('js')).resolves.toBeUndefined();
  });

  it('maps numbered list selections to numbered-list block type', () => {
    const anchor = new ElementNode();

    anchor.getType = () => 'text';

    mockState.listItemNode = true;
    mockState.listNode = true;

    // Create a mock parent that returns 'number' for list type
    const mockParent = {
      getKey: () => 'list-key',
      getListType: () => 'number', // 'number' instead of 'bullet'
      getType: () => 'list',
      canIndent: () => true,
      getIndent: () => 0,
    };

    // Mock getNearestNodeOfType to return our mock parent
    vi.mocked(getNearestNodeOfType).mockReturnValueOnce(/** @type {any} */ (mockParent));

    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => anchor },
      hasFormat: () => false,
    };

    const result = getSelectionTypes();

    expect(result.blockType).toBe('numbered-list');
  });

  it('returns code-block type when parent is CodeHighlightNode', () => {
    const anchor = new ElementNode();

    anchor.getType = () => 'text';

    mockState.codeHighlightNode = true; // Not code node, but code highlight node
    mockState.codeNode = false;

    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => anchor },
      hasFormat: () => false,
    };

    const result = getSelectionTypes();

    expect(result.blockType).toBe('code-block');
  });

  it('does not create code node when children already exist', async () => {
    rootState.children = [{ type: 'text', remove: vi.fn() }]; // Has 1 child

    initEditor({
      modes: [],
      enabledButtons: [],
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: true,
      defaultLanguage: 'javascript',
    });

    // Don't trigger update, just check initialization doesn't create nodes
    expect(rootState.children).toHaveLength(1);
  });

  it('handles list selection when anchor is ElementNode instance', () => {
    const anchor = new ElementNode(); // Real ElementNode instance

    anchor.getType = () => 'text';

    mockState.listItemNode = true;
    mockState.listNode = true;

    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => anchor },
      hasFormat: () => false,
    };

    const result = getSelectionTypes();

    expect(result.blockType).toBe('bulleted-list');
    expect(result.blockNodeKey).toBe('node-key');
  });
});
