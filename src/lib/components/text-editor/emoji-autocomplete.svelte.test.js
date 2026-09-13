import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import EditorFixture from './editor-fixture.test.svelte';
import EmojiAutocomplete from './emoji-autocomplete.svelte';
import { getEditorStore } from '../../test-utils/editor.js';

/**
 * @import { ComponentProps } from 'svelte';
 * @import { TextEditorStore } from '$lib/typedefs';
 */

/**
 * Get the suggestion list.
 * @returns {HTMLElement | null} Element.
 */
const getList = () => document.querySelector('.sui.emoji-suggestions');

/**
 * Render the autocomplete with a live editor holding the given Markdown, and place the caret at
 * the end of the content.
 * @param {string} [value] Markdown.
 * @returns {Promise<{ store: TextEditorStore, root: HTMLElement }>} The store and the editor root.
 */
const renderEditor = async (value = '') => {
  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({ store: undefined, component: EmojiAutocomplete });
  const screen = await render(EditorFixture, props);
  const store = getEditorStore(props);
  const root = /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root'));

  await vi.waitFor(() => {
    expect(store.initialized).toBe(true);
  });

  // Setting the value, even an empty one, gives the editor its initial paragraph
  store.inputValue = value;
  await vi.waitFor(() => {
    expect(root.querySelector('p, code')).not.toBeNull();
  });

  const range = document.createRange();
  const selection = /** @type {Selection} */ (window.getSelection());

  root.focus();
  range.selectNodeContents(root);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);

  return { store, root };
};

describe('EmojiAutocomplete (text editor)', () => {
  it('advertises the autocomplete on the editor root', async () => {
    const { root } = await renderEditor();

    expect(root.getAttribute('aria-autocomplete')).toBe('list');
    expect(root.getAttribute('aria-haspopup')).toBe('listbox');
  });

  it('suggests emojis for a shortcode and inserts the chosen one', async () => {
    const { store, root } = await renderEditor();

    await userEvent.keyboard('Hi :tad');
    await vi.waitFor(() => {
      expect(getList()).not.toBeNull();
    });
    expect(root.getAttribute('aria-controls')).toBe(getList()?.id);
    await userEvent.keyboard('{ArrowDown}{ArrowUp}{Enter}');
    await vi.waitFor(() => {
      expect(store.inputValue).toMatch(/^Hi 🎉 ?$/u);
    });
    expect(getList()).toBeNull();
  });

  it('inserts with Tab, and dismisses with Escape', async () => {
    const { store } = await renderEditor();

    await userEvent.keyboard(':tad');
    await vi.waitFor(() => {
      expect(getList()).not.toBeNull();
    });
    await userEvent.keyboard('{Escape}');
    expect(getList()).toBeNull();
    await userEvent.keyboard('a');
    expect(getList()).toBeNull();
    await vi.waitFor(() => {
      expect(store.inputValue).toBe(':tada');
    });

    await userEvent.keyboard(' :smi');
    await vi.waitFor(() => {
      expect(getList()).not.toBeNull();
    });
    await userEvent.keyboard('{Tab}');
    await vi.waitFor(() => {
      expect(store.inputValue).toMatch(/^:tada \S+ ?$/u);
    });
  });

  it('leaves the keys to the editor while the list is closed', async () => {
    const { store } = await renderEditor('Line');

    await userEvent.keyboard('{ArrowDown}{ArrowUp}{Escape}{Tab}');
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    expect(getList()).toBeNull();
    expect(store.inputValue).toBe('Line');
  });

  it('gives up on an insertion when the shortcode has gone', async () => {
    const { store, root } = await renderEditor();

    await userEvent.keyboard(':tad');
    await vi.waitFor(() => {
      expect(getList()).not.toBeNull();
    });
    // Replace the content behind the list’s back
    store.editor?.update(() => {
      root.querySelector('span')?.remove();
    });
    store.inputValue = 'Other';
    await vi.waitFor(() => {
      expect(root.textContent).toBe('Other');
    });
    await userEvent.keyboard('{Enter}');
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    expect(store.inputValue).not.toContain('🎉');
  });

  it('does not suggest within code', async () => {
    await renderEditor('```\ncode\n```');
    await userEvent.keyboard(' :tad');
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    expect(getList()).toBeNull();
  });

  it('closes the list when the editor switches to plain text', async () => {
    const { store } = await renderEditor();

    await userEvent.keyboard(':tad');
    await vi.waitFor(() => {
      expect(getList()).not.toBeNull();
    });
    store.useRichText = false;
    await vi.waitFor(() => {
      expect(getList()).toBeNull();
    });
  });
});
