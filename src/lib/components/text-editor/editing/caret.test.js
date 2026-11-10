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

import { $createParagraphNode as createParagraphNode, $getRoot as getRoot } from 'lexical';
import {
  nearestNodeState,
  resetEditorMocks,
  selectionState,
} from '#lib/test-utils/editor-mocks.js';
import { focusEditor, handleEditorMouseDown, isStaticDecoratorContent } from './caret.js';

describe('focusEditor', () => {
  beforeEach(() => {
    resetEditorMocks();
  });

  it('focuses the editor by invoking its focus callback', async () => {
    const editor = /** @type {any} */ ({ focus: vi.fn((callback) => callback()) });

    await expect(focusEditor(editor)).resolves.toBeUndefined();
    expect(editor.focus).toHaveBeenCalled();
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

  it('handles editor with focus callback that returns immediately', async () => {
    const editor = /** @type {any} */ ({
      focus: vi.fn((callback) => {
        callback();
      }),
    });

    await expect(focusEditor(editor)).resolves.toBeUndefined();
  });
});

describe('isStaticDecoratorContent', () => {
  /**
   * Build an editor root holding a decorator with some content.
   * @returns {HTMLElement} Editor root.
   */
  const createRoot = () => {
    const root = document.createElement('div');

    root.contentEditable = 'true';
    root.innerHTML = `
      <p><span class="text">Text</span></p>
      <div data-lexical-decorator="true" contenteditable="false">
        <span class="label">Label</span>
        <label>Field <input><span class="hint">Hint</span></label>
        <textarea></textarea>
        <div role="button" tabindex="0"><span class="inner">Button</span></div>
        <div contenteditable="true"><p class="nested">Nested</p></div>
        <div contenteditable="plaintext-only"><span class="plain">Plain</span></div>
        <video controls></video>
        <details><summary><span class="summary">Summary</span></summary></details>
      </div>
    `;

    return root;
  };

  it('detects the static content of a decorator', () => {
    const root = createRoot();

    expect(isStaticDecoratorContent(root.querySelector('[data-lexical-decorator]'))).toBe(true);
    expect(isStaticDecoratorContent(root.querySelector('.label'))).toBe(true);
  });

  it('leaves the interactive elements of a decorator alone', () => {
    const root = createRoot();

    expect(isStaticDecoratorContent(root.querySelector('input'))).toBe(false);
    // A label moves the focus to its control
    expect(isStaticDecoratorContent(root.querySelector('label'))).toBe(false);
    expect(isStaticDecoratorContent(root.querySelector('.hint'))).toBe(false);
    expect(isStaticDecoratorContent(root.querySelector('textarea'))).toBe(false);
    expect(isStaticDecoratorContent(root.querySelector('.inner'))).toBe(false);
    expect(isStaticDecoratorContent(root.querySelector('.nested'))).toBe(false);
    expect(isStaticDecoratorContent(root.querySelector('.plain'))).toBe(false);
    expect(isStaticDecoratorContent(root.querySelector('video'))).toBe(false);
    expect(isStaticDecoratorContent(root.querySelector('.summary'))).toBe(false);
  });

  it('leaves the editable content and other targets alone', () => {
    const root = createRoot();

    expect(isStaticDecoratorContent(root.querySelector('.text'))).toBe(false);
    expect(isStaticDecoratorContent(root)).toBe(false);
    expect(isStaticDecoratorContent(null)).toBe(false);
    expect(isStaticDecoratorContent(document)).toBe(false);
  });
});

describe('handleEditorMouseDown', () => {
  beforeEach(() => {
    selectionState.value = null;
    nearestNodeState.value = null;
    vi.mocked(createParagraphNode).mockClear();
  });

  /**
   * Click the static content of a decorator, whose `selectNext()` sets the given selection.
   * @param {object} args Arguments.
   * @param {any} args.selection Selection set after the decorator.
   * @param {any} [args.rootNode] Root node to be returned by `$getRoot()`.
   * @returns {{ handled: boolean, preventDefault: any }} Result.
   */
  const clickDecorator = ({ selection, rootNode }) => {
    const root = document.createElement('div');

    root.setAttribute('data-lexical-editor', 'true');
    root.innerHTML = '<div data-lexical-decorator="true"><span class="label">Label</span></div>';

    nearestNodeState.value = {
      type: 'decorator',
      selectNext: vi.fn(() => {
        selectionState.value = selection;
      }),
    };

    if (rootNode) {
      vi.mocked(getRoot).mockReturnValueOnce(rootNode);
    }

    const editor = /** @type {any} */ ({
      getRootElement: () => root,
      isEditable: () => true,
      update: (/** @type {() => void} */ callback) => callback(),
    });

    const preventDefault = vi.fn();

    const handled = handleEditorMouseDown(
      editor,
      /** @type {any} */ ({
        target: root.querySelector('.label'),
        button: 0,
        shiftKey: false,
        clientY: 0,
        defaultPrevented: false,
        preventDefault,
      }),
    );

    return { handled, preventDefault };
  };

  /**
   * Create a root node with the given children.
   * @param {any[]} children Children.
   * @returns {any} Root node.
   */
  const createRootNode = (children) => {
    const rootNode = {
      is: (/** @type {any} */ node) => node === rootNode,
      getChildAtIndex: (/** @type {number} */ index) => children[index] ?? null,
      append: vi.fn(),
    };

    return rootNode;
  };

  /**
   * Create a collapsed range selection on the given element node.
   * @param {any} node Anchor node.
   * @param {number} offset Anchor offset.
   * @returns {any} Selection.
   */
  const createSelection = (node, offset) => ({
    type: 'range',
    isCollapsed: () => true,
    anchor: { type: 'element', offset, getNode: () => node },
  });

  it('leaves a selection that is not a caret on the root alone', () => {
    const { handled, preventDefault } = clickDecorator({ selection: null });

    expect(handled).toBe(true);
    expect(preventDefault).toHaveBeenCalled();
    expect(createParagraphNode).not.toHaveBeenCalled();
  });

  it('leaves a caret within a block alone', () => {
    const rootNode = createRootNode([]);

    clickDecorator({
      selection: createSelection({ type: 'element', is: () => false }, 0),
      rootNode,
    });

    expect(createParagraphNode).not.toHaveBeenCalled();
    expect(rootNode.append).not.toHaveBeenCalled();
  });

  it('moves a caret on the root to the start of the next block', () => {
    const after = { type: 'element', selectStart: vi.fn() };
    const rootNode = createRootNode([{ type: 'decorator' }, after]);

    clickDecorator({ selection: createSelection(rootNode, 1), rootNode });

    expect(after.selectStart).toHaveBeenCalled();
    expect(createParagraphNode).not.toHaveBeenCalled();
  });

  it('moves a caret on the root to the end of the previous block', () => {
    const before = { type: 'element', selectEnd: vi.fn() };
    const rootNode = createRootNode([before]);

    clickDecorator({ selection: createSelection(rootNode, 1), rootNode });

    expect(before.selectEnd).toHaveBeenCalled();
    expect(createParagraphNode).not.toHaveBeenCalled();
  });

  it('adds a paragraph before a decorator at the start of the root', () => {
    const after = { type: 'decorator', insertBefore: vi.fn() };
    const rootNode = createRootNode([after]);

    clickDecorator({ selection: createSelection(rootNode, 0), rootNode });

    const paragraph = vi.mocked(createParagraphNode).mock.results[0].value;

    expect(after.insertBefore).toHaveBeenCalledWith(paragraph);
    expect(paragraph.select).toHaveBeenCalled();
  });

  it('adds a paragraph to an empty root', () => {
    const rootNode = createRootNode([]);

    clickDecorator({ selection: createSelection(rootNode, 0), rootNode });

    const paragraph = vi.mocked(createParagraphNode).mock.results[0].value;

    expect(rootNode.append).toHaveBeenCalledWith(paragraph);
    expect(paragraph.select).toHaveBeenCalled();
  });
});
