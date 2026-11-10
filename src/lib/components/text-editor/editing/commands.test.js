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
vi.mock('./alignment.js', () => getMock('./editing/alignment.js'));
vi.mock('./table.js', () => getMock('./editing/table.js'));
vi.mock('../conversion/html.js', () => getMock('./conversion/html.js'));
vi.mock('@lexical/history', () => getMock('@lexical/history'));
vi.mock('@lexical/link', () => getMock('@lexical/link'));
vi.mock('@lexical/list', () => getMock('@lexical/list'));
vi.mock('@lexical/markdown', () => getMock('@lexical/markdown'));
vi.mock('@lexical/rich-text', () => getMock('@lexical/rich-text'));
vi.mock('@lexical/table', () => getMock('@lexical/table'));
vi.mock('@lexical/utils', () => getMock('@lexical/utils'));
vi.mock('lexical', () => getMock('lexical'));

import { $getNearestNodeOfType as getNearestNodeOfType } from '@lexical/utils';
import { ElementNode } from 'lexical';
import {
  editorState,
  mockState,
  resetEditorMocks,
  rootState,
  selectionState,
} from '#lib/test-utils/editor-mocks.js';
import { initEditor } from '../core.js';

describe('editor commands', () => {
  beforeEach(() => {
    resetEditorMocks();
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

  it('handles INSERT_PARAGRAPH_COMMAND', () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: true,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['bulleted-list', 'numbered-list'],
    });

    const paragraphCommand = editorState._commands.find((cmd) => cmd.command === 'insertParagraph');

    expect(paragraphCommand).toBeDefined();

    if (paragraphCommand) {
      const result = paragraphCommand.listener();

      expect(result).toBeUndefined();
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

    it('inserts a new line on Enter instead of exiting the code block', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });

      const dispatchCommand = vi
        .spyOn(editorState, 'dispatchCommand')
        .mockReturnValue(/** @type {any} */ (true));

      editorState._commands = [];
      initCodeEditor();

      const { listener } = editorState._commands.find(({ command }) => command === 'keyEnter');

      selectionState.value = { type: 'range' };
      expect(listener(event)).toBe(true);
      expect(event.defaultPrevented).toBe(true);
      expect(dispatchCommand).toHaveBeenCalledExactlyOnceWith('insertParagraph', undefined);

      // A null event, e.g. from `beforeinput`
      expect(listener(null)).toBe(true);
      expect(dispatchCommand).toHaveBeenCalledTimes(2);

      // Not a range selection
      selectionState.value = null;
      expect(listener(event)).toBe(false);
      expect(dispatchCommand).toHaveBeenCalledTimes(2);
      dispatchCommand.mockRestore();
    });

    it('does not handle Enter in the rich text editor', () => {
      editorState._commands = [];
      initEditor({
        components: [],
        useMarkdownShortcuts: false,
        isCodeEditor: false,
        modes: [],
        enabledButtons: ['code-block'],
      });

      expect(editorState._commands.some(({ command }) => command === 'keyEnter')).toBe(false);
    });
  });
});
