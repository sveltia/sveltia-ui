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
vi.mock('../shiki/engine.js', () => getMock('./shiki/engine.js'));
vi.mock('../shiki/theme.js', () => getMock('./shiki/theme.js'));
vi.mock('@lexical/dragon', () => getMock('@lexical/dragon'));
vi.mock('@lexical/extension', () => getMock('@lexical/extension'));
vi.mock('@lexical/html', () => getMock('@lexical/html'));
vi.mock('./alignment.js', () => getMock('./editing/alignment.js'));
vi.mock('./table.js', () => getMock('./editing/table.js'));
vi.mock('../conversion/html/index.js', () => getMock('./conversion/html/index.js'));
vi.mock('@lexical/history', () => getMock('@lexical/history'));
vi.mock('@lexical/link', () => getMock('@lexical/link'));
vi.mock('@lexical/list', () => getMock('@lexical/list'));
vi.mock('@lexical/markdown', () => getMock('@lexical/markdown'));
vi.mock('@lexical/rich-text', () => getMock('@lexical/rich-text'));
vi.mock('@lexical/table', () => getMock('@lexical/table'));
vi.mock('@lexical/utils', () => getMock('@lexical/utils'));
vi.mock('lexical', () => getMock('lexical'));

import { ListNode, registerCheckList } from '@lexical/list';
import { TextNode } from 'lexical';
import { editorState, resetEditorMocks, selectionState } from '#lib/test-utils/editor-mocks.js';
import { initEditor } from '../core.js';

describe('guards', () => {
  beforeEach(() => {
    resetEditorMocks();
  });

  describe('format guard', () => {
    /**
     * Initialize the editor and get the guard’s command and transform listeners.
     * @param {'html' | 'markdown'} format Value format.
     * @param {any[]} enabledButtons Enabled buttons.
     * @returns {{ command: any, transform: any, dispose: () => void }} Listeners and cleanup.
     */
    const initGuard = (format, enabledButtons) => {
      const { dispose } = initEditor({
        components: [],
        useMarkdownShortcuts: false,
        isCodeEditor: false,
        modes: [],
        format,
        enabledButtons,
      });

      return {
        command: editorState._commands.find((cmd) => cmd.command === 'formatText')?.listener,
        transform: editorState._transforms.find(({ klass }) => klass === TextNode)?.listener,
        dispose,
      };
    };

    /**
     * Create a range selection holding the given text nodes.
     * @param {object} args Arguments.
     * @param {boolean} [args.hasFormat] Whether the selection has the format.
     * @param {boolean[]} [args.nodeFormats] Whether each selected node has the format.
     * @returns {any} Selection.
     */
    const createSelection = ({ hasFormat = false, nodeFormats = [] } = {}) => ({
      type: 'range',
      hasFormat: () => hasFormat,
      getNodes: () => nodeFormats.map((value) => ({ type: 'text', hasFormat: () => value })),
      formatText: vi.fn(),
    });

    it('leaves underline to Lexical in HTML with the button', () => {
      const { command, transform, dispose } = initGuard('html', ['underline']);

      expect(command('underline')).toBe(false);
      expect(command('bold')).toBe(false);
      expect(transform).toBeUndefined();
      dispose();
    });

    it.each([
      ['the selection', { hasFormat: true }],
      ['a partly selected node', { nodeFormats: [false, true] }],
    ])(
      'only removes an existing underline in HTML without the button, from %s',
      (_name, options) => {
        const { command, dispose } = initGuard('html', ['bold']);
        const selection = createSelection(options);

        selectionState.value = selection;
        expect(command('underline')).toBe(true);
        expect(selection.formatText).toHaveBeenCalledWith('underline', 0);
        // Any other format is left to Lexical
        expect(command('bold')).toBe(false);
        dispose();
      },
    );

    it('applies no underline in HTML without the button', () => {
      const { command, dispose } = initGuard('html', ['bold']);
      const selection = createSelection({ nodeFormats: [false] });

      selectionState.value = selection;
      expect(command('underline')).toBe(true);
      expect(selection.formatText).not.toHaveBeenCalled();
      selectionState.value = null;
      expect(command('underline')).toBe(true);
      dispose();
    });

    it('removes underline from any text in Markdown, and ignores the shortcut', () => {
      const { command, transform, dispose } = initGuard('markdown', ['underline']);
      const underlined = { hasFormat: vi.fn(() => true), toggleFormat: vi.fn() };
      const plain = { hasFormat: vi.fn(() => false), toggleFormat: vi.fn() };

      expect(command('underline')).toBe(true);
      expect(command('bold')).toBe(false);
      transform(underlined);
      transform(plain);
      expect(underlined.toggleFormat).toHaveBeenCalledWith('underline');
      expect(plain.toggleFormat).not.toHaveBeenCalled();
      dispose();
    });
  });

  describe('task list guard', () => {
    /**
     * Initialize the editor with the given buttons.
     * @param {any[]} enabledButtons Enabled buttons.
     * @returns {() => void} Cleanup.
     */
    const init = (enabledButtons) =>
      initEditor({
        components: [],
        useMarkdownShortcuts: false,
        isCodeEditor: false,
        modes: [],
        enabledButtons,
      }).dispose;

    it('keeps a task list with the task list button', () => {
      const dispose = init(['task-list']);

      expect(editorState._transforms.find(({ klass }) => klass === ListNode)).toBeUndefined();
      dispose();
    });

    it('turns a check list into a bulleted list without the task list button', () => {
      const dispose = init(['bulleted-list']);
      const transform = editorState._transforms.find(({ klass }) => klass === ListNode)?.listener;
      const checkList = { getListType: () => 'check', setListType: vi.fn() };
      const bulletedList = { getListType: () => 'bullet', setListType: vi.fn() };

      expect(registerCheckList).not.toHaveBeenCalled();
      transform(checkList);
      transform(bulletedList);
      expect(checkList.setListType).toHaveBeenCalledWith('bullet');
      expect(bulletedList.setListType).not.toHaveBeenCalled();
      dispose();
    });

    it('registers nothing for lists without any list button, as `ListNode` is not registered', () => {
      const dispose = init(['bold']);

      expect(editorState._transforms.find(({ klass }) => klass === ListNode)).toBeUndefined();
      dispose();
    });
  });
});
