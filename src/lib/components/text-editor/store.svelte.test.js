/* eslint-disable jsdoc/require-jsdoc */

import { describe, expect, it, vi } from 'vitest';
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
      isCodeEditor: false,
    };
    expect(store.useRichText).toBe(false);
  });

  it('should set useRichText to true when isCodeEditor is true regardless of modes', () => {
    const store = createEditorStore();

    store.config = { modes: [], enabledButtons: [], components: [], isCodeEditor: true };
    expect(store.useRichText).toBe(true);
  });

  it('should set useRichText to false when modes is empty and isCodeEditor is false', () => {
    const store = createEditorStore();

    store.config = { modes: [], enabledButtons: [], components: [], isCodeEditor: false };
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
      inlineTypes: /** @type {import('$lib/typedefs').TextEditorInlineType[]} */ ([
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

  it('should expose convertMarkdown as a function', () => {
    const store = createEditorStore();

    expect(typeof store.convertMarkdown).toBe('function');
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

  it('should call convertMarkdown (returns early) when inputValue changes with useRichText=true', async () => {
    const store = createEditorStore();

    // useRichText is true by default; no editor set → convertMarkdown returns early (line 40)
    store.inputValue = 'hello'; // triggers line 89: convertMarkdown()
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
    store.inputValue = 'some text'; // triggers convertMarkdown (line 89), which awaits the rejection
    await new Promise((r) => {
      setTimeout(r, 0);
    });
    expect(store.hasConverterError).toBe(true);
    consoleSpy.mockRestore();
  });
});
