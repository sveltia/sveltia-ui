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

import { ElementNode } from 'lexical';
import { editorState, resetEditorMocks, selectionState } from '#lib/test-utils/editor-mocks.js';
import { initEditor } from '../core.js';
import { isSafeLinkURL } from './link.js';

// eslint-disable-next-line no-script-url -- Testing that it’s rejected
const SCRIPT_URL = 'javascript:alert(1)';

describe('link commands', () => {
  beforeEach(() => {
    resetEditorMocks();
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

  it('handles TOGGLE_LINK_COMMAND with string payload', () => {
    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['link'],
    });

    const linkCommand = editorState._commands.find((cmd) => cmd.command === 'toggleLink');

    expect(linkCommand).toBeDefined();

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

  it('handles TOGGLE_LINK_COMMAND with the URL and attributes', async () => {
    const { $toggleLink } = await import('@lexical/link');

    const { dispose } = initEditor({
      components: [],
      useMarkdownShortcuts: false,
      isCodeEditor: false,
      modes: [],
      enabledButtons: ['link'],
    });

    const linkCommand = editorState._commands.find((cmd) => cmd.command === 'toggleLink');
    const payload = { url: 'https://example.com', target: '_blank' };

    vi.mocked($toggleLink).mockClear();

    expect(linkCommand?.listener(payload)).toBe(true);
    expect($toggleLink).toHaveBeenCalledWith(payload);

    // An object without the URL removes the link, like `null`
    vi.mocked($toggleLink).mockClear();
    linkCommand?.listener({ target: '_blank' });
    expect($toggleLink).toHaveBeenCalledWith(null);

    // An unsafe URL is ignored, even with attributes
    vi.mocked($toggleLink).mockClear();
    expect(linkCommand?.listener({ url: SCRIPT_URL, target: '_blank' })).toBe(true);
    expect($toggleLink).not.toHaveBeenCalled();
    dispose();
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

    expect(linkCommand).toBeDefined();

    if (linkCommand) {
      const result = linkCommand.listener(null);

      expect(result).toBe(true);
    }

    dispose();
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
});
