import {
  $getRoot as getRoot,
  KEY_DOWN_COMMAND,
  PASTE_COMMAND,
  $setSelection as setSelection,
} from 'lexical';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { initEditor } from '../core.js';
import { convertMarkdownToLexical } from './import.js';
import { pasteMarkdown } from './paste.js';
import { exportMarkdown } from './update.js';
import { setCodeHighlighterLoaders } from '../shiki/loader.js';

/**
 * @import { TextEditorConfig } from '#lib/typedefs.js';
 */

const { platform } = vi.hoisted(() => ({ platform: { mac: false } }));

vi.mock('@sveltia/utils/events', async (importOriginal) => ({
  .../** @type {object} */ (await importOriginal()),
  /**
   * Whether the platform is macOS.
   * @returns {boolean} Result.
   */
  isMac: () => platform.mac,
}));

/** @type {(() => void)[]} */
const disposers = [];

beforeAll(() => {
  // Keep the syntax highlighter off the network: without an engine, code stays plain text
  setCodeHighlighterLoaders({
    /**
     * Fail to load the engine.
     * @throws {Error} Always.
     */
    loadEngine: async () => {
      throw new Error('Not available in tests');
    },
  });
});

/**
 * Create an editor with the given Markdown, and the caret at the end of it.
 * @param {string} value Markdown.
 * @param {Partial<TextEditorConfig>} [config] Configuration.
 * @returns {Promise<ReturnType<typeof initEditor>>} Editor.
 */
const createEditor = async (value, config = {}) => {
  const result = initEditor({
    modes: ['rich-text'],
    enabledButtons: ['bold', 'italic', 'link', 'bulleted-list', 'numbered-list'],
    components: [],
    useMarkdownShortcuts: false,
    isCodeEditor: false,
    ...config,
  });

  disposers.push(result.dispose);
  await convertMarkdownToLexical(result.editor, value, result.enabledTransformers);
  result.editor.update(() => getRoot().selectEnd(), { discrete: true });

  return result;
};

/**
 * Export the content of the given editor as Markdown.
 * @param {Awaited<ReturnType<typeof createEditor>>} editor Editor.
 * @returns {string} Markdown.
 */
const readMarkdown = ({ editor, enabledTransformers }) =>
  editor.read(() => exportMarkdown(enabledTransformers));

/**
 * Create a `keydown` event for V with the given modifiers.
 * @param {KeyboardEventInit} init Modifiers.
 * @returns {KeyboardEvent} Event.
 */
const createKeyEvent = (init) =>
  new KeyboardEvent('keydown', { key: 'v', code: 'KeyV', cancelable: true, ...init });

afterEach(() => {
  disposers.splice(0).forEach((dispose) => dispose());
  platform.mac = false;
  vi.restoreAllMocks();
});

describe('pasteMarkdown', () => {
  it('inserts the Markdown at the selection, converted to the nodes', async () => {
    const editor = await createEditor('Intro');

    await pasteMarkdown(editor.editor, '- [One](https://example.com/)\n- **Two**', [
      ...editor.enabledTransformers,
    ]);

    expect(readMarkdown(editor)).toBe('Intro\n\n- [One](https://example.com/)\n- **Two**');
  });

  it('inserts inline Markdown into the paragraph', async () => {
    const editor = await createEditor('Intro');

    await pasteMarkdown(editor.editor, ' *one*', editor.enabledTransformers);

    expect(readMarkdown(editor)).toBe('Intro _one_');
  });

  it('keeps escaped characters as literal text', async () => {
    const editor = await createEditor('');

    await pasteMarkdown(
      editor.editor,
      '1\\. Not a list, \\*not italic\\*',
      editor.enabledTransformers,
    );

    expect(editor.editor.read(() => getRoot().getTextContent())).toBe(
      '1. Not a list, *not italic*',
    );
  });

  it('converts the syntax Lexical doesn’t support, like a setext heading', async () => {
    const editor = await createEditor('', { enabledButtons: ['heading-1'] });

    await pasteMarkdown(editor.editor, 'Title\n=====', editor.enabledTransformers);

    expect(readMarkdown(editor)).toBe('# Title');
  });

  it('inserts a code block even if the highlighter fails to load', async () => {
    const editor = await createEditor('', { enabledButtons: ['code-block'] });

    await pasteMarkdown(editor.editor, '```js\nconst a = 1;\n```', editor.enabledTransformers);

    expect(readMarkdown(editor)).toBe('```js\nconst a = 1;\n```');
  });

  it('keeps escaped characters next to a horizontal rule', async () => {
    const editor = await createEditor('');

    await pasteMarkdown(editor.editor, '\\*One\\*\n\n---', editor.enabledTransformers);

    expect(readMarkdown(editor)).toBe('\\*One\\*\n\n***');
  });

  it('inserts a table where the caret was', async () => {
    const editor = await createEditor('Intro\n\nOutro');

    editor.editor.update(() => getRoot().getFirstChildOrThrow().selectEnd(), { discrete: true });
    await pasteMarkdown(editor.editor, '| A |\n| - |\n| 1 |', editor.enabledTransformers);

    expect(readMarkdown(editor)).toBe('Intro\n\n| A |\n| --- |\n| 1 |\n\nOutro');
  });

  it('pastes the text as is if the Markdown import fails', async () => {
    const editor = await createEditor('Intro ');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    /** @type {import('@lexical/markdown').ElementTransformer} */
    const failingTransformer = {
      type: 'element',
      dependencies: [],
      regExp: /^Boom$/,
      /**
       * Export nothing.
       * @returns {null} Nothing.
       */
      export: () => null,
      /**
       * Fail the import.
       * @throws {Error} Always.
       */
      replace: () => {
        throw new Error('Boom');
      },
    };

    await pasteMarkdown(editor.editor, 'Boom', [failingTransformer]);

    expect(editor.editor.read(() => getRoot().getTextContent())).toBe('Intro Boom');
    expect(consoleError).toHaveBeenCalledOnce();
  });

  it('does nothing if the editor is read-only', async () => {
    const editor = await createEditor('Intro');

    editor.editor.setEditable(false);
    await pasteMarkdown(editor.editor, '- One', editor.enabledTransformers);

    expect(readMarkdown(editor)).toBe('Intro');
  });

  it('does nothing if the editor has no selection', async () => {
    const editor = await createEditor('Intro');

    editor.editor.update(() => setSelection(null), { discrete: true });
    await pasteMarkdown(editor.editor, '- One', editor.enabledTransformers);

    expect(readMarkdown(editor)).toBe('Intro');
  });
});

describe('Paste as Markdown shortcut', () => {
  /**
   * Press the given keys, then paste the given text as the browser would.
   * @param {Awaited<ReturnType<typeof createEditor>>} editor Editor.
   * @param {KeyboardEventInit} keys Modifiers.
   * @param {string} text Plain text on the clipboard.
   * @returns {KeyboardEvent} `keydown` event.
   */
  const pressAndPaste = ({ editor: lexical }, keys, text) => {
    const clipboardData = new DataTransfer();
    const keyEvent = createKeyEvent(keys);

    clipboardData.setData('text/plain', text);
    lexical.dispatchCommand(KEY_DOWN_COMMAND, keyEvent);
    lexical.dispatchCommand(
      PASTE_COMMAND,
      new ClipboardEvent('paste', { clipboardData, cancelable: true }),
    );

    return keyEvent;
  };

  /**
   * Wait for the editor to have the given Markdown.
   * @param {Awaited<ReturnType<typeof createEditor>>} editor Editor.
   * @param {string} markdown Markdown.
   */
  const waitForMarkdown = async (editor, markdown) => {
    await vi.waitFor(() => {
      expect(readMarkdown(editor)).toBe(markdown);
    });
  };

  it('pastes the plain text as Markdown after Ctrl+Shift+V', async () => {
    const editor = await createEditor('Intro');
    const keyEvent = pressAndPaste(editor, { ctrlKey: true, shiftKey: true }, '- One\n- Two');

    // The browser does the paste
    expect(keyEvent.defaultPrevented).toBe(false);
    await waitForMarkdown(editor, 'Intro\n\n- One\n- Two');
  });

  it('uses Cmd+Shift+V and Cmd+Option+Shift+V on macOS', async () => {
    platform.mac = true;

    const editor = await createEditor('Intro');

    pressAndPaste(editor, { metaKey: true, shiftKey: true }, '- One');
    await waitForMarkdown(editor, 'Intro\n\n- One');
    pressAndPaste(editor, { metaKey: true, altKey: true, shiftKey: true }, '\n\n- Two');
    await waitForMarkdown(editor, 'Intro\n\n- One\n- Two');
  });

  it('leaves a regular paste alone', async () => {
    const editor = await createEditor('Intro ');

    pressAndPaste(editor, { ctrlKey: true }, '*One*');
    await waitForMarkdown(editor, 'Intro \\*One\\*');
  });

  it('leaves Ctrl+Shift+V alone on macOS', async () => {
    platform.mac = true;

    const editor = await createEditor('Intro ');

    pressAndPaste(editor, { ctrlKey: true, shiftKey: true }, '*One*');
    await waitForMarkdown(editor, 'Intro \\*One\\*');
  });

  it('waits a moment for the paste, like Chrome on macOS fires it in a later task', async () => {
    const editor = await createEditor('Intro');

    vi.useFakeTimers();

    try {
      const clipboardData = new DataTransfer();

      clipboardData.setData('text/plain', '- One');
      editor.editor.dispatchCommand(
        KEY_DOWN_COMMAND,
        createKeyEvent({ ctrlKey: true, shiftKey: true }),
      );
      vi.advanceTimersByTime(500);
      editor.editor.dispatchCommand(
        PASTE_COMMAND,
        new ClipboardEvent('paste', { clipboardData, cancelable: true }),
      );
    } finally {
      vi.useRealTimers();
    }

    await waitForMarkdown(editor, 'Intro\n\n- One');
  });

  it('forgets the shortcut after a second', async () => {
    const editor = await createEditor('Intro ');

    vi.useFakeTimers();

    try {
      const clipboardData = new DataTransfer();

      clipboardData.setData('text/plain', '*One*');
      editor.editor.dispatchCommand(
        KEY_DOWN_COMMAND,
        createKeyEvent({ ctrlKey: true, shiftKey: true }),
      );
      vi.advanceTimersByTime(1000);
      editor.editor.dispatchCommand(
        PASTE_COMMAND,
        new ClipboardEvent('paste', { clipboardData, cancelable: true }),
      );
    } finally {
      vi.useRealTimers();
    }

    await waitForMarkdown(editor, 'Intro \\*One\\*');
  });

  it('forgets the shortcut when another key is pressed', async () => {
    const editor = await createEditor('Intro ');

    editor.editor.dispatchCommand(
      KEY_DOWN_COMMAND,
      createKeyEvent({ ctrlKey: true, shiftKey: true }),
    );
    pressAndPaste(editor, { metaKey: true }, '*One*');
    await waitForMarkdown(editor, 'Intro \\*One\\*');
  });

  it('stops waiting for the paste when the editor is removed', async () => {
    const editor = await createEditor('Intro');
    const clear = vi.spyOn(globalThis, 'clearTimeout');

    editor.editor.dispatchCommand(
      KEY_DOWN_COMMAND,
      createKeyEvent({ ctrlKey: true, shiftKey: true }),
    );
    clear.mockClear();
    editor.dispose();

    expect(clear).toHaveBeenCalled();
  });

  it('leaves a paste without text alone', async () => {
    const editor = await createEditor('Intro');

    pressAndPaste(editor, { ctrlKey: true, shiftKey: true }, '');
    await waitForMarkdown(editor, 'Intro');
  });

  it('pastes the plain text of an input event as Safari does', async () => {
    const editor = await createEditor('Intro');
    const dataTransfer = new DataTransfer();

    dataTransfer.setData('text/plain', '- One');
    editor.editor.dispatchCommand(
      KEY_DOWN_COMMAND,
      createKeyEvent({ ctrlKey: true, shiftKey: true }),
    );
    editor.editor.dispatchCommand(
      PASTE_COMMAND,
      new InputEvent('beforeinput', {
        inputType: 'insertFromPaste',
        dataTransfer,
        cancelable: true,
      }),
    );
    await waitForMarkdown(editor, 'Intro\n\n- One');
  });

  it('leaves a URL to the link paste handler, which links the selected text', async () => {
    const editor = await createEditor('Intro');
    const clipboardData = new DataTransfer();
    const pasteEvent = new ClipboardEvent('paste', { clipboardData, cancelable: true });

    clipboardData.setData('text/plain', 'https://example.com/');
    // The link paste handler reads the target, which a dispatched command doesn’t set
    Object.defineProperty(pasteEvent, 'target', { value: document.createElement('div') });
    editor.editor.update(() => getRoot().getAllTextNodes()[0].select(0, 5), { discrete: true });
    editor.editor.dispatchCommand(
      KEY_DOWN_COMMAND,
      createKeyEvent({ ctrlKey: true, shiftKey: true }),
    );
    editor.editor.dispatchCommand(PASTE_COMMAND, pasteEvent);
    await waitForMarkdown(editor, '[Intro](https://example.com/)');
  });

  it('leaves a paste that is neither a clipboard event nor an input event alone', async () => {
    const editor = await createEditor('Intro');
    const update = vi.spyOn(editor.editor, 'update');

    editor.editor.dispatchCommand(
      KEY_DOWN_COMMAND,
      createKeyEvent({ ctrlKey: true, shiftKey: true }),
    );
    editor.editor.dispatchCommand(PASTE_COMMAND, createKeyEvent({ ctrlKey: true, shiftKey: true }));
    await new Promise((resolve) => {
      setTimeout(resolve);
    });

    // Only the rich text editor handles the paste, which has nothing to insert
    expect(update.mock.calls.filter(([, options]) => options?.tag === 'paste')).toHaveLength(1);
  });

  it('is not available in the code editor', async () => {
    const editor = await createEditor('', { isCodeEditor: true });
    // The shortcut is only remembered until the key event is over
    const timer = vi.spyOn(globalThis, 'setTimeout');

    editor.editor.dispatchCommand(
      KEY_DOWN_COMMAND,
      createKeyEvent({ ctrlKey: true, shiftKey: true }),
    );

    expect(timer).not.toHaveBeenCalled();
  });
});
