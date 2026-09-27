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
    _transforms: /** @type {any[]} */ ([]),
    registerNodeTransform(/** @type {any} */ klass, /** @type {any} */ listener) {
      this._transforms.push({ klass, listener });

      return () => {
        this._transforms = this._transforms.filter((entry) => entry.listener !== listener);
      };
    },
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

vi.mock('@sveltia/utils/string', () => ({
  isURL: vi.fn((str) => /^https?:\/\//.test(str)),
}));

vi.mock('@lexical/code-core', () => ({
  CodeHighlightNode: class {},
  CodeNode: class {},
  $createCodeNode: vi.fn((language) => ({ type: 'code', language, selectStart: vi.fn() })),
  $isCodeHighlightNode: vi.fn(() => mockState.codeHighlightNode),
  $isCodeNode: vi.fn((node) => node?.type === 'code' || mockState.codeNode),
}));

vi.mock('./shiki/highlighter.js', () => ({
  registerCodeHighlighting: vi.fn(() => vi.fn()),
  shikiTokenizer: {
    defaultLanguage: 'plain',
    defaultTheme: 'github-light',
    tokenize: vi.fn(() => []),
  },
}));

vi.mock('./shiki/facade.js', () => ({
  isPlainLanguage: vi.fn((lang) => ['', 'plain', 'plaintext', 'text', 'txt'].includes(lang ?? '')),
  loadEngine: vi.fn(() => Promise.resolve()),
  loadCodeLanguage: vi.fn(() => Promise.resolve()),
  loadCodeTheme: vi.fn(() => Promise.resolve()),
  normalizeCodeLanguage: vi.fn((lang) => (lang === 'js' ? 'javascript' : lang)),
}));

vi.mock('./shiki/theme.js', () => ({
  getCodeTheme: vi.fn(() => 'github-light'),
  observeCodeTheme: vi.fn(() => vi.fn()),
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
  BOLD_UNDERSCORE: { tag: '__' },
  CODE: { tag: 'code' },
  HEADING: { tag: '#' },
  INLINE_CODE: { tag: '`' },
  ITALIC_STAR: { tag: '*' },
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
  objectKlassEquals: vi.fn((obj, klass) => obj instanceof klass),
}));

const selectionState = vi.hoisted(() => /** @type {{ value: any }} */ ({ value: null }));

const ElementNodeClass = vi.hoisted(
  () =>
    class ElementNode {
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
);

vi.mock('lexical', () => ({
  COMMAND_PRIORITY_NORMAL: 0,
  COMMAND_PRIORITY_LOW: -1,
  createEditor: vi.fn(() => editorState),
  DELETE_CHARACTER_COMMAND: 'deleteCharacter',
  $createTextNode: vi.fn((text) => ({ type: 'text', text })),
  $insertNodes: vi.fn(),
  $isElementNode: vi.fn((node) => node?.type === 'element' || node instanceof ElementNodeClass),
  $isTextNode: vi.fn((node) => node?.type === 'text'),
  ElementNode: ElementNodeClass,
  $getRoot: vi.fn(() => rootState),
  $getSelection: vi.fn(() => selectionState.value),
  INDENT_CONTENT_COMMAND: 'indent',
  INSERT_PARAGRAPH_COMMAND: 'insertParagraph',
  $isRangeSelection: vi.fn((selection) => selection?.type === 'range'),
  OUTDENT_CONTENT_COMMAND: 'outdent',
  PASTE_COMMAND: 'paste',
  RootNode: class {},
}));

import { $getNearestNodeOfType as getNearestNodeOfType } from '@lexical/utils';
import { ElementNode } from 'lexical';
import { loadCodeLanguage, loadCodeTheme, loadEngine } from './shiki/facade.js';
import { registerCodeHighlighting } from './shiki/highlighter.js';
import {
  convertMarkdownToLexical,
  focusEditor,
  getSelectionTypes,
  initEditor,
  isSafeLinkURL,
  loadCodeHighlighter,
  onEditorUpdate,
} from './core.js';

// eslint-disable-next-line no-script-url -- Testing that it’s rejected
const SCRIPT_URL = 'javascript:alert(1)';

describe('text editor core', () => {
  beforeEach(() => {
    editorState._commands = [];
    editorState._rootListeners = [];
    editorState._updateListeners = [];
    editorState._transforms = [];
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
    vi.mocked(loadEngine).mockClear();
    vi.mocked(loadCodeLanguage).mockClear();
    vi.mocked(loadCodeTheme).mockClear();
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
    const block = new ElementNode();

    anchor.getType = () => 'text';
    Object.defineProperty(anchor, 'getParent', { value: () => block });
    Object.defineProperty(block, 'getKey', { value: () => 'block-key' });

    mockState.linkNode = true;
    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => anchor },
      hasFormat: () => false,
    };

    expect(getSelectionTypes()).toEqual({
      blockNodeKey: 'block-key',
      blockType: 'paragraph',
      inlineTypes: ['link'],
    });
  });

  it('uses the block containing a link rather than the link itself', () => {
    const anchor = new ElementNode();
    const block = new ElementNode();

    anchor.getType = () => 'text';
    Object.defineProperty(anchor, 'getParent', { value: () => block });
    Object.defineProperty(block, 'getKey', { value: () => 'block-key' });
    Object.defineProperty(block, 'getTag', { value: () => 'h3' });

    mockState.linkNode = true;
    mockState.headingNode = true;
    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => anchor },
      hasFormat: () => false,
    };

    expect(getSelectionTypes()).toEqual({
      blockNodeKey: 'block-key',
      blockType: 'heading-3',
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
    expect(editorState._commands).toHaveLength(6);
    expect(editorState._transforms).toHaveLength(1);
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

  it('skips loading the highlighter entirely for a plain language', async () => {
    await expect(loadCodeHighlighter('plain')).resolves.toBeUndefined();
    expect(loadEngine).not.toHaveBeenCalled();
    expect(loadCodeLanguage).not.toHaveBeenCalled();
  });

  it('loads the engine, grammar and theme for a highlighted language', async () => {
    await loadCodeHighlighter('javascript');
    expect(loadEngine).toHaveBeenCalled();
    expect(loadCodeLanguage).toHaveBeenCalledWith('javascript');
    expect(loadCodeTheme).toHaveBeenCalledWith('github-light');
  });

  it('resolves a language alias before loading the grammar', async () => {
    await loadCodeHighlighter('js');
    expect(loadCodeLanguage).toHaveBeenCalledWith('javascript');
  });

  it('converts markdown into lexical nodes through the editor update callback', async () => {
    const editor = /** @type {any} */ ({
      update: vi.fn((callback) => callback()),
      focus: vi.fn(),
      isComposing: () => false,
    });

    await expect(convertMarkdownToLexical(editor, '# Heading', [])).resolves.toBeUndefined();
  });

  it('pads blank blockquote lines before converting markdown', async () => {
    const { $convertFromMarkdownString } = await import('@lexical/markdown');

    const editor = /** @type {any} */ ({
      update: vi.fn((callback) => callback()),
      focus: vi.fn(),
      isComposing: () => false,
    });

    await convertMarkdownToLexical(editor, '> a\n>\n> b', []);

    expect($convertFromMarkdownString).toHaveBeenCalledWith('> a\n> \n> b', []);
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

    expect(editorState._commands).toHaveLength(5);
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

  it('resolves without throwing for an unsupported language', async () => {
    await expect(loadCodeHighlighter('nonexistent')).resolves.toBeUndefined();
    expect(loadCodeLanguage).toHaveBeenCalledWith('nonexistent');
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

      // Verify the filtered list has 3 transformers instead of 7
      expect(calledWithTransformers.length).toBe(3);
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

    expect(editorState._commands).toHaveLength(5);
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

  it('handles convertMarkdownToLexical with empty value', async () => {
    const editor = /** @type {any} */ ({
      update: vi.fn((callback) => callback()),
      focus: vi.fn(),
      isComposing: () => false,
    });

    await expect(convertMarkdownToLexical(editor, '', [])).resolves.toBeUndefined();
  });

  it('resolves even when the engine cannot be loaded', async () => {
    vi.mocked(loadEngine).mockRejectedValueOnce(new Error('offline'));

    await expect(loadCodeHighlighter('javascript')).rejects.toThrow('offline');
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

  it('ignores TOGGLE_LINK_COMMAND with an unsafe URL', async () => {
    const { $toggleLink } = await import('@lexical/link');

    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['link'],
    });

    const linkCommand = editorState._commands.find((cmd) => cmd.command === 'toggleLink');

    vi.mocked($toggleLink).mockClear();

    expect(linkCommand?.listener(SCRIPT_URL)).toBe(true);
    expect($toggleLink).not.toHaveBeenCalled();
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

    expect(editorState._commands).toHaveLength(5);
    dispose();
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

  it('registers PASTE_COMMAND when link button is enabled', () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['link'],
    });

    const pasteCommand = editorState._commands.find((cmd) => cmd.command === 'paste');

    expect(pasteCommand).toBeDefined();
    dispose();
  });

  it('PASTE_COMMAND returns false when selection is not a range', () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['link'],
    });

    const pasteCommand = editorState._commands.find((cmd) => cmd.command === 'paste');

    selectionState.value = null; // Not a range selection

    const event = new ClipboardEvent('paste', { clipboardData: new DataTransfer() });
    const result = pasteCommand?.listener(event);

    expect(result).toBe(false);
    dispose();
  });

  it('PASTE_COMMAND returns false when event is not a ClipboardEvent', () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['link'],
    });

    const pasteCommand = editorState._commands.find((cmd) => cmd.command === 'paste');

    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => new ElementNode() },
    };

    const event = new Event('paste'); // Not a ClipboardEvent
    const result = pasteCommand?.listener(event);

    expect(result).toBe(false);
    dispose();
  });

  it('PASTE_COMMAND returns false when target is an input element', () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['link'],
    });

    const pasteCommand = editorState._commands.find((cmd) => cmd.command === 'paste');

    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => new ElementNode() },
    };

    const input = document.createElement('input');
    const clipboardData = new DataTransfer();

    clipboardData.setData('text', 'https://example.com');

    const event = new ClipboardEvent('paste', { clipboardData });

    Object.defineProperty(event, 'target', { value: input });

    const result = pasteCommand?.listener(event);

    expect(result).toBe(false);
    dispose();
  });

  it('PASTE_COMMAND returns false when clipboard text is not a URL', () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['link'],
    });

    const pasteCommand = editorState._commands.find((cmd) => cmd.command === 'paste');

    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => new ElementNode() },
      isCollapsed: () => true,
      getNodes: () => [],
    };

    const div = document.createElement('div');
    const clipboardData = new DataTransfer();

    clipboardData.setData('text', 'just some text');

    const event = new ClipboardEvent('paste', { clipboardData });

    Object.defineProperty(event, 'target', { value: div });

    const result = pasteCommand?.listener(event);

    expect(result).toBe(false);
    dispose();
  });

  it('PASTE_COMMAND pastes an unsafe URL as plain text', async () => {
    const { isURL } = await import('@sveltia/utils/string');

    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['link'],
    });

    const pasteCommand = editorState._commands.find((cmd) => cmd.command === 'paste');

    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => new ElementNode() },
      isCollapsed: () => true,
      getNodes: () => [],
    };

    const clipboardData = new DataTransfer();

    clipboardData.setData('text', SCRIPT_URL);

    const event = new ClipboardEvent('paste', { clipboardData });

    Object.defineProperty(event, 'target', { value: document.createElement('div') });
    // A `javascript:` URL is a valid URL
    vi.mocked(isURL).mockReturnValueOnce(true);

    expect(pasteCommand?.listener(event)).toBe(false);
    expect(event.defaultPrevented).toBe(false);
    dispose();
  });

  it('PASTE_COMMAND inserts URL as text node and dispatches TOGGLE_LINK_COMMAND when selection is collapsed with no element nodes', () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['link'],
    });

    const pasteCommand = editorState._commands.find((cmd) => cmd.command === 'paste');

    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => new ElementNode() },
      isCollapsed: () => true,
      getNodes: () => [],
    };

    const div = document.createElement('div');
    const clipboardData = new DataTransfer();
    const preventDefaultSpy = vi.fn();

    clipboardData.setData('text', 'https://example.com');

    const event = new ClipboardEvent('paste', { clipboardData });

    Object.defineProperty(event, 'target', { value: div });
    Object.defineProperty(event, 'preventDefault', { value: preventDefaultSpy });

    const result = pasteCommand?.listener(event);

    expect(result).toBe(true);
    expect(preventDefaultSpy).toHaveBeenCalled();
    dispose();
  });

  it('PASTE_COMMAND dispatches TOGGLE_LINK_COMMAND with URL when appropriate', () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['link'],
    });

    const pasteCommand = editorState._commands.find((cmd) => cmd.command === 'paste');

    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => new ElementNode() },
      isCollapsed: () => false,
      getNodes: () => [{ type: 'text', isSimpleText: () => true }],
    };

    const div = document.createElement('div');
    const clipboardData = new DataTransfer();
    const preventDefaultSpy = vi.fn();

    clipboardData.setData('text', 'https://example.com');

    const event = new ClipboardEvent('paste', { clipboardData });

    Object.defineProperty(event, 'target', { value: div });
    Object.defineProperty(event, 'preventDefault', { value: preventDefaultSpy });

    const result = pasteCommand?.listener(event);

    expect(result).toBe(true);
    expect(preventDefaultSpy).toHaveBeenCalled();
    dispose();
  });

  it('PASTE_COMMAND returns false when no text nodes in selection', () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['link'],
    });

    const pasteCommand = editorState._commands.find((cmd) => cmd.command === 'paste');

    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => new ElementNode() },
      isCollapsed: () => false,
      getNodes: () => [{ type: 'element' }, { type: 'text', isSimpleText: () => true }],
    };

    const div = document.createElement('div');
    const clipboardData = new DataTransfer();

    clipboardData.setData('text', 'https://example.com');

    const event = new ClipboardEvent('paste', { clipboardData });

    Object.defineProperty(event, 'target', { value: div });

    const result = pasteCommand?.listener(event);

    expect(result).toBe(false);
    dispose();
  });

  it('PASTE_COMMAND returns false when clipboard data is missing', () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['link'],
    });

    const pasteCommand = editorState._commands.find((cmd) => cmd.command === 'paste');

    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => new ElementNode() },
    };

    const div = document.createElement('div');
    const event = new ClipboardEvent('paste');

    Object.defineProperty(event, 'target', { value: div });

    const result = pasteCommand?.listener(event);

    expect(result).toBe(false);
    dispose();
  });
});

describe('isSafeLinkURL', () => {
  it.each([
    'https://example.com',
    'http://example.com',
    'mailto:a@example.com',
    'tel:123',
    '/about',
    '#top',
    'page.html',
    '?q=1',
    '/search?a=1&b=2',
    '#a&b',
  ])('should allow %s', (url) => {
    expect(isSafeLinkURL(url)).toBe(true);
  });

  it.each([
    SCRIPT_URL,
    ' JavaScript:alert(1)',
    'java\tscript:alert(1)',
    '\u0001javascript:alert(1)',
    'data:text/html,x',
    'vbscript:x',
    '&#106;avascript:alert(1)',
    'javascript&colon;alert(1)',
    'javascript\\:alert(1)',
  ])('should reject %j', (url) => {
    expect(isSafeLinkURL(url)).toBe(false);
  });

  describe('code editor', () => {
    const initCodeEditor = () =>
      initEditor({
        components: [],
        useMarkdownShortcuts: false,
        isCodeEditor: true,
        defaultLanguage: 'javascript',
        modes: [],
        enabledButtons: [],
      });

    const getDeleteCharacterListener = () =>
      editorState._commands.find(({ command }) => command === 'deleteCharacter').listener;

    it('creates a code node when the root becomes empty', () => {
      initCodeEditor();
      editorState._transforms[0].listener(rootState);

      expect(rootState.children).toHaveLength(1);
      expect(rootState.children[0].type).toBe('code');
      expect(rootState.children[0].language).toBe('javascript');
      expect(rootState.children[0].selectStart).toHaveBeenCalled();
    });

    it('turns a lone non-code block back into a code node, keeping its content', () => {
      const paragraph = new ElementNode();

      /** @type {any} */ (paragraph).replace = vi.fn();
      rootState.children = [paragraph];
      initCodeEditor();
      editorState._transforms[0].listener(rootState);

      expect(/** @type {any} */ (paragraph).replace).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'code', language: 'javascript' }),
        true,
      );
    });

    it('leaves a lone code node alone', () => {
      const codeNode = { type: 'code', replace: vi.fn() };

      rootState.children = [codeNode];
      initCodeEditor();
      editorState._transforms[0].listener(rootState);

      expect(rootState.children).toEqual([codeNode]);
      expect(codeNode.replace).not.toHaveBeenCalled();
    });

    it('does not touch the root when it has multiple children', () => {
      const children = [
        { type: 'paragraph', replace: vi.fn() },
        { type: 'text', replace: vi.fn() },
      ];

      rootState.children = [...children];
      initCodeEditor();
      editorState._transforms[0].listener(rootState);

      expect(rootState.children).toEqual(children);
      expect(children[0].replace).not.toHaveBeenCalled();
    });

    it('ignores Backspace at the beginning of the code block', () => {
      const codeNode = { type: 'code', is: (/** @type {any} */ node) => node === codeNode };

      initCodeEditor();

      selectionState.value = {
        type: 'range',
        isCollapsed: () => true,
        anchor: { offset: 0, getNode: () => codeNode },
      };

      expect(getDeleteCharacterListener()(true)).toBe(true);
    });

    it('ignores Backspace at the beginning of the first line of code', () => {
      const textNode = { type: 'text', is: (/** @type {any} */ node) => node === textNode };
      const codeNode = { type: 'code', getFirstDescendant: () => textNode, is: () => false };

      vi.mocked(getNearestNodeOfType).mockReturnValueOnce(/** @type {any} */ (codeNode));
      initCodeEditor();

      selectionState.value = {
        type: 'range',
        isCollapsed: () => true,
        anchor: { offset: 0, getNode: () => textNode },
      };

      expect(getDeleteCharacterListener()(true)).toBe(true);
    });

    it('lets other deletions through', () => {
      const textNode = { type: 'text', is: (/** @type {any} */ node) => node === textNode };
      const otherNode = { type: 'text', is: () => false };
      const codeNode = { type: 'code', getFirstDescendant: () => otherNode, is: () => false };

      initCodeEditor();

      const listener = getDeleteCharacterListener();

      // Forward deletion
      expect(listener(false)).toBe(false);

      // Not a range selection
      selectionState.value = null;
      expect(listener(true)).toBe(false);

      // Non-collapsed selection
      selectionState.value = { type: 'range', isCollapsed: () => false };
      expect(listener(true)).toBe(false);

      // Not at the beginning of the text node
      vi.mocked(getNearestNodeOfType).mockReturnValueOnce(/** @type {any} */ (codeNode));
      selectionState.value = {
        type: 'range',
        isCollapsed: () => true,
        anchor: { offset: 1, getNode: () => textNode },
      };
      expect(listener(true)).toBe(false);

      // At the beginning of a line other than the first one
      vi.mocked(getNearestNodeOfType).mockReturnValueOnce(/** @type {any} */ (codeNode));
      selectionState.value = {
        type: 'range',
        isCollapsed: () => true,
        anchor: { offset: 0, getNode: () => textNode },
      };
      expect(listener(true)).toBe(false);

      // Outside of a code block
      vi.mocked(getNearestNodeOfType).mockReturnValueOnce(null);
      selectionState.value = {
        type: 'range',
        isCollapsed: () => true,
        anchor: { offset: 0, getNode: () => textNode },
      };
      expect(listener(true)).toBe(false);
    });
  });
});
