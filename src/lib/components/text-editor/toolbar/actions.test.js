import { describe, expect, it, vi } from 'vitest';
import { refocusEditor, runEditorAction } from './actions.js';

/**
 * @import { TextEditorStore } from '#lib/typedefs.js';
 */

/**
 * Create a stand-in for the editor store, with an editor that records the calls made to it.
 * @param {object} args Arguments.
 * @param {boolean} [args.useRichText] Whether the rich text mode is used.
 * @param {boolean} [args.withEditor] Whether the editor is there.
 * @returns {{ store: TextEditorStore, calls: string[], textArea: HTMLTextAreaElement }} Store, the
 * calls made, and the `<textarea>`.
 */
const createStore = ({ useRichText = true, withEditor = true } = {}) => {
  /** @type {string[]} */
  const calls = [];
  const textArea = document.createElement('textarea');

  const editor = {
    /**
     * Record the focus.
     * @param {() => void} callback Callback.
     */
    focus: (callback) => {
      calls.push('focus');
      callback();
    },
  };

  const store = /** @type {TextEditorStore} */ (
    /** @type {unknown} */ ({ editor: withEditor ? editor : undefined, textArea, useRichText })
  );

  return { store, calls, textArea };
};

/**
 * Create an edit that records itself.
 * @param {string[]} calls Calls made.
 * @param {object} [options] Options.
 * @param {boolean} [options.async] Whether to record it after a microtask.
 * @returns {() => Promise<void>} Edit.
 */
const recordEdit =
  (calls, { async = false } = {}) =>
  async () => {
    if (async) {
      await Promise.resolve();
    }

    calls.push('rich');
  };

describe('runEditorAction()', () => {
  it('edits the rich text editor, then focuses it by default', async () => {
    const { store, calls } = createStore();
    const raw = vi.fn();

    await runEditorAction(store, {
      raw,
      rich: recordEdit(calls),
    });

    expect(calls).toEqual(['rich', 'focus']);
    expect(raw).not.toHaveBeenCalled();
  });

  it('focuses the rich text editor before the edit if asked', async () => {
    const { store, calls } = createStore();

    await runEditorAction(store, {
      rich: recordEdit(calls),
      focus: 'before',
    });

    expect(calls).toEqual(['focus', 'rich']);
  });

  it('leaves the focus alone if asked', async () => {
    const { store, calls } = createStore();

    await runEditorAction(store, {
      rich: recordEdit(calls),
      focus: false,
    });

    expect(calls).toEqual(['rich']);
  });

  it('waits for an asynchronous edit before focusing', async () => {
    const { store, calls } = createStore();

    await runEditorAction(store, {
      rich: recordEdit(calls, { async: true }),
    });

    expect(calls).toEqual(['rich', 'focus']);
  });

  it('does nothing in the rich text mode without the editor', async () => {
    const { store } = createStore({ withEditor: false });
    const rich = vi.fn();

    await runEditorAction(store, { rich });

    expect(rich).not.toHaveBeenCalled();
  });

  it('edits the `<textarea>` in the plain text mode', async () => {
    const { store, calls, textArea } = createStore({ useRichText: false });
    const raw = vi.fn();
    const rich = vi.fn();

    await runEditorAction(store, { raw, rich });

    expect(raw).toHaveBeenCalledWith(textArea);
    expect(rich).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  });

  it('does nothing in the plain text mode without a plain text edit', async () => {
    const { store, calls } = createStore({ useRichText: false });
    const rich = vi.fn();

    await runEditorAction(store, { rich });

    expect(rich).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  });
});

describe('refocusEditor()', () => {
  it('focuses the rich text editor', async () => {
    const { store, calls } = createStore();

    await refocusEditor(store);

    expect(calls).toEqual(['focus']);
  });

  it('does nothing in the rich text mode without the editor', async () => {
    const { store, calls } = createStore({ withEditor: false });

    await expect(refocusEditor(store)).resolves.toBeUndefined();
    expect(calls).toEqual([]);
  });

  it('focuses the `<textarea>` in the plain text mode', async () => {
    const { store, calls, textArea } = createStore({ useRichText: false });

    document.body.append(textArea);
    await refocusEditor(store);

    expect(document.activeElement).toBe(textArea);
    expect(calls).toEqual([]);
    textArea.remove();
  });
});
