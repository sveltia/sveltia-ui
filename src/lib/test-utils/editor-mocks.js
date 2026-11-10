/**
 * Mocks of Lexical and the editor modules, shared by the unit tests of the editor core modules,
 * which run the editor setup and commands against a fake editor. A test file mocks each module
 * with the matching entry of {@link editorMocks}, and resets the state with
 * {@link resetEditorMocks} before each test.
 */

/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable max-classes-per-file */

import { vi } from 'vitest';

/**
 * Mocked module exports by module ID. Relative IDs are relative to the `text-editor` directory.
 * @type {Record<string, any>}
 */
export const editorMocks = {};

const { editorState, mockState, rootState } = (() => {
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
    dispose: () => {},
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
})();

editorMocks['@sveltia/utils/misc'] = {
  sleep: vi.fn(() => Promise.resolve()),
};

editorMocks['@sveltia/utils/events'] = {
  isMac: vi.fn(() => false),
  matchesShortcuts: vi.fn(() => false),
};

editorMocks['@sveltia/utils/string'] = {
  isURL: vi.fn((str) => /^https?:\/\//.test(str)),
};

editorMocks['@lexical/code-core'] = {
  CodeExtension: { name: '@lexical/code' },
  CodeHighlightNode: class {},
  CodeNode: class {},
  $createCodeNode: vi.fn((language) => ({ type: 'code', language, selectStart: vi.fn() })),
  $isCodeHighlightNode: vi.fn(() => mockState.codeHighlightNode),
  $isCodeNode: vi.fn((node) => node?.type === 'code' || mockState.codeNode),
};

editorMocks['./shiki/highlighter.js'] = {
  registerCodeHighlighting: vi.fn(() => vi.fn()),
  shikiTokenizer: {
    defaultLanguage: 'plain',
    defaultTheme: 'github-light',
    tokenize: vi.fn(() => []),
  },
};

editorMocks['./shiki/facade.js'] = {
  isPlainLanguage: vi.fn((lang) => ['', 'plain', 'plaintext', 'text', 'txt'].includes(lang ?? '')),
  loadEngine: vi.fn(() => Promise.resolve()),
  loadCodeLanguage: vi.fn(() => Promise.resolve()),
  loadCodeTheme: vi.fn(() => Promise.resolve()),
  normalizeCodeLanguage: vi.fn((lang) => (lang === 'js' ? 'javascript' : lang)),
};

editorMocks['./shiki/theme.js'] = {
  getCodeTheme: vi.fn(() => 'github-light'),
  observeCodeTheme: vi.fn(() => vi.fn()),
};

editorMocks['@lexical/dragon'] = {
  registerDragonSupport: vi.fn(() => vi.fn()),
};

editorMocks['@lexical/extension'] = {
  buildEditorFromExtensions: vi.fn(() => editorState),
  HorizontalRuleExtension: { name: '@lexical/extension/HorizontalRule' },
  HorizontalRuleNode: class {},
};

editorMocks['@lexical/html'] = {
  $generateNodesFromDOM: vi.fn(() => []),
};

editorMocks['./editing/alignment.js'] = {
  $getSelectedAlignment: vi.fn(() => ''),
};

editorMocks['./editing/table.js'] = {
  $ensureParagraphAfterTable: vi.fn(),
  $getSelectedTableCellKey: vi.fn(() => null),
  $normalizeTableHeaders: vi.fn(),
};

editorMocks['./conversion/html.js'] = {
  editorComponents: new WeakMap(),
  exportHtml: vi.fn(() => '<p>converted</p>'),
  findUnsupportedNode: vi.fn(() => undefined),
  getCodeLanguage: vi.fn(() => undefined),
  HTML_CODE_IMPORT_MAP: {},
  HTML_EXPORT_MAP: new Map(),
  HTML_IMPORT_MAP: {},
};

editorMocks['@lexical/history'] = {
  createEmptyHistoryState: vi.fn(() => ({})),
  registerHistory: vi.fn(() => vi.fn()),
};

editorMocks['@lexical/link'] = {
  $isLinkNode: vi.fn(() => mockState.linkNode),
  LinkNode: class {},
  TOGGLE_LINK_COMMAND: 'toggleLink',
  $toggleLink: vi.fn(),
};

editorMocks['@lexical/list'] = {
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
};

editorMocks['@lexical/markdown'] = {
  $convertFromMarkdownString: vi.fn(),
  $convertToMarkdownString: vi.fn(() => 'converted'),
  $generateNodesFromMarkdownString: vi.fn(() => []),
  registerMarkdownShortcuts: vi.fn(() => vi.fn()),
  TRANSFORMERS: [],
  BOLD_ITALIC_STAR: { tag: '***' },
  BOLD_ITALIC_UNDERSCORE: { tag: '___' },
  BOLD_STAR: { tag: '**' },
  BOLD_UNDERSCORE: { tag: '__' },
  CODE: { tag: 'code', regExpStart: /^```/ },
  HEADING: { tag: '#', regExp: /^#/ },
  INLINE_CODE: { tag: '`' },
  ITALIC_STAR: { tag: '*' },
  ITALIC_UNDERSCORE: { tag: '_' },
  LINK: { tag: 'link' },
  ORDERED_LIST: { tag: 'ol' },
  QUOTE: { tag: '>' },
  STRIKETHROUGH: { tag: '~~' },
  UNORDERED_LIST: { tag: 'ul' },
};

editorMocks['@lexical/rich-text'] = {
  HeadingNode: class {},
  $isHeadingNode: vi.fn(() => mockState.headingNode),
  $isQuoteNode: vi.fn(() => mockState.quoteNode),
  QuoteNode: class {},
  registerRichText: vi.fn(() => vi.fn()),
};

editorMocks['@lexical/table'] = {
  TableCellNode: class {},
  TableExtension: { name: '@lexical/table/Table' },
  TableNode: class {},
  TableRowNode: class {},
};

editorMocks['@lexical/utils'] = {
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
  $unwrapNode: vi.fn(),
};

const selectionState = /** @type {{ value: any }} */ ({ value: null });
const nearestNodeState = /** @type {{ value: any }} */ ({ value: null });

const ElementNodeClass = class ElementNode {
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
};

editorMocks.lexical = {
  $getState: vi.fn(() => ''),
  $setState: vi.fn(),
  createState: vi.fn(() => ({})),
  COMMAND_PRIORITY_NORMAL: 0,
  COMMAND_PRIORITY_LOW: -1,
  createCommand: vi.fn((type) => ({ type })),
  createEditor: vi.fn(() => editorState),
  configExtension: vi.fn((extension, config) => [extension, config]),
  defineExtension: vi.fn((extension) => extension),
  DELETE_CHARACTER_COMMAND: 'deleteCharacter',
  $createParagraphNode: vi.fn(() => ({ type: 'element', select: vi.fn() })),
  $createTextNode: vi.fn((text) => ({ type: 'text', text })),
  $getNearestNodeFromDOMNode: vi.fn(() => nearestNodeState.value),
  $insertNodes: vi.fn(),
  $isDecoratorNode: vi.fn((node) => node?.type === 'decorator'),
  $isElementNode: vi.fn((node) => node?.type === 'element' || node instanceof ElementNodeClass),
  $isTextNode: vi.fn((node) => node?.type === 'text'),
  ElementNode: ElementNodeClass,
  $getRoot: vi.fn(() => rootState),
  $getSelection: vi.fn(() => selectionState.value),
  HISTORY_MERGE_TAG: 'history-merge',
  INDENT_CONTENT_COMMAND: 'indent',
  INSERT_PARAGRAPH_COMMAND: 'insertParagraph',
  KEY_DOWN_COMMAND: 'keyDown',
  KEY_ENTER_COMMAND: 'keyEnter',
  $isRangeSelection: vi.fn((selection) => selection?.type === 'range'),
  OUTDENT_CONTENT_COMMAND: 'outdent',
  PASTE_COMMAND: 'paste',
  PASTE_TAG: 'paste',
  RootNode: class {},
};

/**
 * Reset the fake editor and the mock state.
 */
export const resetEditorMocks = () => {
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
  editorMocks['./shiki/facade.js'].loadEngine.mockClear();
  editorMocks['./shiki/facade.js'].loadCodeLanguage.mockClear();
  editorMocks['./shiki/facade.js'].loadCodeTheme.mockClear();
};

export { editorState, ElementNodeClass, mockState, nearestNodeState, rootState, selectionState };
