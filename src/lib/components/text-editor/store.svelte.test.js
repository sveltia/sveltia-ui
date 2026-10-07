/* eslint-disable jsdoc/require-jsdoc */

import { describe, expect, it, vi } from 'vitest';
import { initEditor } from './core.js';
import { createEditorStore } from './store.svelte.js';

describe('createEditorStore', () => {
  it('should have correct initial values', () => {
    const store = createEditorStore();

    expect(store.initialized).toBe(false);
    expect(store.editor).toBeUndefined();
    expect(store.inputValue).toBe('');
    expect(store.useRichText).toBe(true);
    expect(store.hasConverterError).toBe(false);
    expect(store.showConverterError).toBe(false);
    expect(store.selection).toEqual({
      blockNodeKey: null,
      blockType: 'paragraph',
      inlineTypes: [],
    });
  });

  it('should return a non-empty editorId string', () => {
    const store = createEditorStore();

    expect(typeof store.editorId).toBe('string');
    expect(store.editorId.length).toBeGreaterThan(0);
  });

  it('should generate unique editorIds for each store instance', () => {
    const a = createEditorStore();
    const b = createEditorStore();

    expect(a.editorId).not.toBe(b.editorId);
  });

  it('should set initialized', () => {
    const store = createEditorStore();

    store.initialized = true;
    expect(store.initialized).toBe(true);
  });

  it('should set useRichText to true when first mode is rich-text', () => {
    const store = createEditorStore();

    store.config = {
      modes: ['rich-text'],
      enabledButtons: [],
      components: [],
      useMarkdownShortcuts: true,
      isCodeEditor: false,
    };
    expect(store.useRichText).toBe(true);
  });

  it('should set useRichText to false when first mode is plain-text', () => {
    const store = createEditorStore();

    store.config = {
      modes: ['plain-text'],
      enabledButtons: [],
      components: [],
      useMarkdownShortcuts: true,
      isCodeEditor: false,
    };
    expect(store.useRichText).toBe(false);
  });

  it('should set useRichText to true when isCodeEditor is true regardless of modes', () => {
    const store = createEditorStore();

    store.config = {
      modes: [],
      enabledButtons: [],
      components: [],
      useMarkdownShortcuts: true,
      isCodeEditor: true,
    };
    expect(store.useRichText).toBe(true);
  });

  it('should set useRichText to false when modes is empty and isCodeEditor is false', () => {
    const store = createEditorStore();

    store.config = {
      modes: [],
      enabledButtons: [],
      components: [],
      useMarkdownShortcuts: true,
      isCodeEditor: false,
    };
    expect(store.useRichText).toBe(false);
  });

  it('should set hasConverterError and cascade useRichText and showConverterError', () => {
    const store = createEditorStore();

    store.hasConverterError = true;
    expect(store.hasConverterError).toBe(true);
    expect(store.useRichText).toBe(false);
    expect(store.showConverterError).toBe(true);
  });

  it('should allow clearing hasConverterError without re-enabling rich text', () => {
    const store = createEditorStore();

    store.hasConverterError = true;
    store.hasConverterError = false;
    // Setting to false does NOT automatically re-enable rich text
    expect(store.hasConverterError).toBe(false);
    expect(store.useRichText).toBe(false);
  });

  it('should allow setting showConverterError directly', () => {
    const store = createEditorStore();

    store.showConverterError = true;
    expect(store.showConverterError).toBe(true);
    store.showConverterError = false;

    expect(store.showConverterError).toBe(false);
  });

  it('should allow setting and reading selection', () => {
    const store = createEditorStore();

    const sel = {
      blockNodeKey: 'abc',
      blockType: /** @type {const} */ ('heading-2'),
      inlineTypes: /** @type {import('#lib/typedefs.js').TextEditorInlineType[]} */ ([
        'bold',
        'italic',
      ]),
    };

    store.selection = sel;
    expect(store.selection).toEqual(sel);
  });

  it('should allow setting inputValue when useRichText is false', () => {
    const store = createEditorStore();

    store.useRichText = false;
    store.inputValue = 'hello world';
    expect(store.inputValue).toBe('hello world');
  });

  it('should not change inputValue on duplicate assignment', () => {
    const store = createEditorStore();

    store.useRichText = false;
    store.inputValue = 'same';
    store.inputValue = 'same'; // no-op since unchanged
    expect(store.inputValue).toBe('same');
  });

  it('should expose convertToLexical as a function', () => {
    const store = createEditorStore();

    expect(typeof store.convertToLexical).toBe('function');
  });

  it('should allow getting and setting the editor (covers line 63)', () => {
    const store = createEditorStore();
    const fakeEditor = /** @type {any} */ ({ __testId: 'test-editor' });

    store.editor = fakeEditor; // line 63: editor = newValue
    // Svelte 5 $state wraps objects in a Proxy, so use toEqual for value comparison
    // @ts-ignore
    expect(store.editor?.__testId).toBe('test-editor');
  });

  it('should allow reading the config via getter (covers line 72)', () => {
    const store = createEditorStore();
    const cfg = store.config; // line 72: return config

    expect(cfg.modes).toHaveLength(0);
    expect(cfg.isCodeEditor).toBe(false);
  });

  it('should allow setting and getting enabledTransformers (covers lines 74-79)', () => {
    const store = createEditorStore();

    const mockTransformers = /** @type {any} */ ([
      { type: 'element', tag: 'heading' },
      { type: 'text-format', tag: '**' },
    ]);

    // Initially empty array
    expect(store.enabledTransformers).toEqual([]);

    // Set transformers (line 75: enabledTransformers = newValue)
    store.enabledTransformers = mockTransformers;

    // Get transformers (line 78: return enabledTransformers)
    expect(store.enabledTransformers).toEqual(mockTransformers);
    expect(store.enabledTransformers).toHaveLength(2);
  });

  it('should call convertToLexical (returns early) when inputValue changes with useRichText=true', async () => {
    const store = createEditorStore();

    // useRichText is true by default; no editor set → convertToLexical returns early (line 40)
    store.inputValue = 'hello'; // triggers line 89: convertToLexical()
    await new Promise((r) => {
      setTimeout(r, 0);
    });
    expect(store.inputValue).toBe('hello');
    expect(store.hasConverterError).toBe(false);
  });

  it('should set hasConverterError when convertMarkdownToLexical throws', async () => {
    const store = createEditorStore();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Mock editor that has no .update() method → convertMarkdownToLexical will throw inside the
    // new Promise executor, rejecting it and triggering the catch block (lines 48-52)
    const mockEditor = /** @type {any} */ ({ getEditorState: () => ({ isEmpty: () => false }) });

    store.editor = mockEditor;
    store.initialized = true;
    store.inputValue = 'some text'; // triggers convertToLexical (line 89), which awaits the rejection
    await new Promise((r) => {
      setTimeout(r, 0);
    });
    expect(store.hasConverterError).toBe(true);
    // The editor falls back to the plain text mode, and the error is shown
    expect(store.useRichText).toBe(false);
    expect(store.showConverterError).toBe(true);
    consoleSpy.mockRestore();
  });

  it('should import HTML with the HTML format, keeping the value as given', async () => {
    const store = createEditorStore();

    store.config = {
      ...store.config,
      modes: ['rich-text'],
      enabledButtons: ['bold'],
      format: 'html',
    };

    const { editor, dispose } = initEditor(store.config);

    editor.setRootElement(document.createElement('div'));
    store.editor = editor;
    store.initialized = true;
    store.inputValue = '<p><b>bold</b></p>';
    await vi.waitFor(() => expect(store.importing).toBe(false));
    expect(store.hasConverterError).toBe(false);
    expect(store.getImportedValue('<p><strong>bold</strong></p>')).toBe('<p><b>bold</b></p>');
    dispose();
  });

  it('should set hasConverterError when the HTML has an element the editor cannot handle', async () => {
    const store = createEditorStore();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    store.config = {
      ...store.config,
      modes: ['rich-text'],
      enabledButtons: ['bold'],
      format: 'html',
    };

    const { editor, dispose } = initEditor(store.config);

    editor.setRootElement(document.createElement('div'));
    store.editor = editor;
    store.initialized = true;
    store.inputValue = '<p><img src="a.png"></p>';
    await vi.waitFor(() => expect(store.hasConverterError).toBe(true));
    // The original value is kept for the plain text mode
    expect(store.inputValue).toBe('<p><img src="a.png"></p>');
    expect(store.useRichText).toBe(false);
    consoleSpy.mockRestore();
    dispose();
  });

  it('should set hasConverterError when the HTML starts with an element moved to <head>', async () => {
    const store = createEditorStore();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    store.config = {
      ...store.config,
      modes: ['rich-text'],
      enabledButtons: ['bold'],
      format: 'html',
    };

    const { editor, dispose } = initEditor(store.config);

    editor.setRootElement(document.createElement('div'));
    store.editor = editor;
    store.initialized = true;
    store.inputValue = '<script src="embed.js"></script><p>Text</p>';
    await vi.waitFor(() => expect(store.hasConverterError).toBe(true));
    consoleSpy.mockRestore();
    dispose();
  });

  it('should pass empty string fallback to convertMarkdownToLexical when inputValue is empty (branch 2)', async () => {
    const store = createEditorStore();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockEditor = /** @type {any} */ ({ getEditorState: () => ({ isEmpty: () => false }) });

    store.editor = mockEditor;
    store.initialized = true;
    store.inputValue = 'hello'; // non-empty: inputValue || '' uses inputValue (count[0])
    store.inputValue = ''; // empty: inputValue || '' uses '' fallback (count[1])
    await new Promise((r) => {
      setTimeout(r, 0);
    });
    expect(store.inputValue).toBe('');
    consoleSpy.mockRestore();
  });

  it('should count the content as pending while an operation is running', () => {
    const store = createEditorStore();

    expect(store.pending).toBe(false);

    const end = store.startOperation();
    const endOther = store.startOperation();

    expect(store.pending).toBe(true);
    end();
    // The other operation is still running
    expect(store.pending).toBe(true);
    // Ending an operation that is already done changes nothing
    end();
    expect(store.pending).toBe(true);
    endOther();
    expect(store.pending).toBe(false);
  });

  it('should keep the content pending while an operation is running even if the flag is cleared', () => {
    const store = createEditorStore();
    const end = store.startOperation();

    // This is what an editor update made by the operation itself does
    store.pending = false;
    expect(store.pending).toBe(true);
    end();
    expect(store.pending).toBe(false);
    store.pending = true;
    expect(store.pending).toBe(true);
  });

  it('should trigger convertToLexical when isEmpty() is true even though value is unchanged (branch 6)', async () => {
    const store = createEditorStore();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // isEmpty() returns true → triggers convertToLexical even when hasChange = false
    const mockEditor = /** @type {any} */ ({ getEditorState: () => ({ isEmpty: () => true }) });

    store.editor = mockEditor;
    store.initialized = true;
    store.inputValue = 'hello'; // hasChange=true → count[1] of binary-expr at line 88
    store.inputValue = 'hello'; // hasChange=false, isEmpty()=true → count[2] is hit
    await new Promise((r) => {
      setTimeout(r, 0);
    });
    expect(store.inputValue).toBe('hello');
    consoleSpy.mockRestore();
  });
});
