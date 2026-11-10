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
import { mockState, resetEditorMocks, selectionState } from '#lib/test-utils/editor-mocks.js';
import { $getSelectedAlignment } from './alignment.js';
import { getSelectionTypes } from './selection.js';
import { $getSelectedTableCellKey } from './table.js';

describe('getSelectionTypes', () => {
  beforeEach(() => {
    resetEditorMocks();
  });

  it('returns the default selection state when the selection is not a range', () => {
    expect(getSelectionTypes()).toEqual({
      blockNodeKey: null,
      blockType: 'paragraph',
      inlineTypes: [],
      tableCellKey: null,
      alignment: '',
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
      tableCellKey: null,
      alignment: '',
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
      tableCellKey: null,
      alignment: '',
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
      tableCellKey: null,
      alignment: '',
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
      tableCellKey: null,
      alignment: '',
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
      tableCellKey: null,
      alignment: '',
    });
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
      tableCellKey: null,
      alignment: '',
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
      tableCellKey: null,
      alignment: '',
    });
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
      tableCellKey: null,
      alignment: '',
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

  it('includes the alignment of the selected block in the selection state', () => {
    const anchor = new ElementNode();

    anchor.getType = () => 'text';
    selectionState.value = {
      type: 'range',
      anchor: { getNode: () => anchor },
      hasFormat: () => false,
    };
    vi.mocked($getSelectedAlignment).mockReturnValueOnce('center');

    expect(getSelectionTypes()).toMatchObject({ alignment: 'center' });
  });

  it('includes the selected table cell in the selection state', () => {
    vi.mocked($getSelectedTableCellKey).mockReturnValueOnce('cell-key');

    expect(getSelectionTypes()).toMatchObject({ tableCellKey: 'cell-key' });
  });
});
