import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { getEditorStore } from '../../../test-utils/editor.js';
import EditorFixture from '../editor-fixture.test.svelte';
import InsertHorizontalRuleButton from './insert-horizontal-rule-button.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 * @import { TextEditorStore } from '#lib/typedefs.js';
 */

/**
 * Render the button with a live editor.
 * @param {object} [options] Options.
 * @param {boolean} [options.plainText] Whether to use the plain text mode.
 * @returns {Promise<{ store: TextEditorStore, root: HTMLElement, textarea: HTMLTextAreaElement }>}
 * The store, the editor root and the `<textarea>`.
 */
const renderButton = async ({ plainText = false } = {}) => {
  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({
    store: undefined,
    config: { enabledButtons: ['bold', 'horizontal-rule'] },
    component: InsertHorizontalRuleButton,
    withTextArea: plainText,
  });

  const screen = await render(EditorFixture, props);
  const store = getEditorStore(props);

  await vi.waitFor(() => {
    expect(store.initialized).toBe(true);
  });

  if (plainText) {
    store.useRichText = false;
  }

  return {
    store,
    root: /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root')),
    textarea: /** @type {HTMLTextAreaElement} */ (screen.container.querySelector('textarea')),
  };
};

describe('InsertHorizontalRuleButton', () => {
  it('renders an iconic button controlling the editor', async () => {
    const { store } = await renderButton();
    const button = page.getByRole('button', { name: 'Insert Horizontal Rule' });

    await expect.element(button).toHaveClass('iconic');
    await expect.element(button).toHaveAttribute('aria-controls', `${store.editorId}-lexical-root`);
  });

  it('inserts a rule, with the caret below it', async () => {
    const { store, root } = await renderButton();

    store.inputValue = 'Intro';
    await vi.waitFor(() => {
      expect(root.querySelector('p')?.textContent).toBe('Intro');
    });
    root.focus();
    document.execCommand('selectAll');
    document.getSelection()?.collapseToEnd();

    await page.getByRole('button', { name: 'Insert Horizontal Rule' }).click();
    await vi.waitFor(() => {
      expect(root.querySelector('hr')).not.toBeNull();
      expect(document.activeElement).toBe(root);
    });

    await userEvent.keyboard('Outro');
    await vi.waitFor(() => {
      expect(store.inputValue).toBe('Intro\n\n***\n\nOutro');
    });
  });

  it('inserts the rule’s Markdown in the plain text mode', async () => {
    const { textarea } = await renderButton({ plainText: true });

    textarea.value = 'Intro';
    textarea.focus();
    textarea.setSelectionRange(5, 5);

    await page.getByRole('button', { name: 'Insert Horizontal Rule' }).click();
    await vi.waitFor(() => {
      expect(textarea.value).toBe('Intro\n\n***\n\n');
    });
    expect(document.activeElement).toBe(textarea);
  });
});
