import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import EditorFixture from '../editor-fixture.test.svelte';
import InsertLinkButton from './insert-link-button.svelte';
import { getEditorStore } from '../../../test-utils/editor.js';

/**
 * @import { ComponentProps } from 'svelte';
 * @import { TextEditorStore } from '$lib/typedefs';
 */

/**
 * Get the link dialog.
 * @returns {HTMLDialogElement | null} Element.
 */
const getDialog = () => document.querySelector('dialog.sui.modal');

/**
 * Render the button with the given content in the editor.
 * @param {string} [value] Markdown.
 * @returns {Promise<{ screen: Awaited<ReturnType<typeof render<typeof EditorFixture>>>,
 * store: TextEditorStore, root: HTMLElement }>} Rendered fixture, the store and the editor root.
 */
const renderButton = async (value = '') => {
  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({ store: undefined, component: InsertLinkButton });
  const screen = await render(EditorFixture, props);
  const store = getEditorStore(props);
  const root = /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root'));

  await vi.waitFor(() => {
    expect(store.initialized).toBe(true);
  });

  if (value) {
    store.inputValue = value;
    await vi.waitFor(() => {
      expect(root.textContent).not.toBe('');
    });
  }

  return { screen, store, root };
};

describe('InsertLinkButton', () => {
  it('renders the link button', async () => {
    const { screen, store } = await renderButton();
    const button = screen.getByRole('button', { name: 'Link' });

    await expect.element(button).toHaveClass('iconic');
    await expect.element(button).toHaveAttribute('aria-pressed', 'false');
    await expect.element(button).toHaveAttribute('aria-controls', `${store.editorId}-lexical-root`);
    expect(button.element().querySelector('.icon')?.textContent?.trim()).toBe('link');
    expect(getDialog()).toBeNull();
  });

  it('opens the dialog to insert a link with text where nothing is selected', async () => {
    const { screen, store, root } = await renderButton();

    root.focus();
    await screen.getByRole('button', { name: 'Link' }).click();
    await vi.waitFor(() => {
      expect(getDialog()?.open).toBe(true);
    });

    const dialog = /** @type {HTMLDialogElement} */ (getDialog());

    expect(dialog.querySelector('.title')?.textContent?.trim()).toBe('Insert Link');
    expect(dialog.querySelector('button.primary')?.textContent?.trim()).toBe('Insert');
    expect(/** @type {HTMLButtonElement} */ (dialog.querySelector('button.primary')).disabled).toBe(
      true,
    );

    const url = screen.getByRole('textbox', { name: 'URL' });
    const text = screen.getByRole('textbox', { name: 'Text' });

    await expect.element(url).toBeVisible();
    await expect.element(text).toBeVisible();
    await url.fill('https://example.com/');
    await expect.element(screen.getByRole('button', { name: 'Insert' })).toBeEnabled();
    await text.fill('Example');
    await screen.getByRole('button', { name: 'Insert' }).click();
    await vi.waitFor(() => {
      expect(store.inputValue).toBe('[Example](https://example.com/)');
    });
    await vi.waitFor(() => {
      expect(getDialog()).toBeNull();
    });
  });

  it('uses the URL as the text when none is given, and submits with Enter', async () => {
    const { screen, store, root } = await renderButton();

    root.focus();
    await screen.getByRole('button', { name: 'Link' }).click();
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'URL' }).element());
    });
    // Enter does nothing while the URL is empty
    await userEvent.keyboard('{Enter}');
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    expect(getDialog()?.open).toBe(true);
    await screen.getByRole('textbox', { name: 'URL' }).fill('https://example.com/');
    await screen.getByRole('textbox', { name: 'Text' }).fill('  ');
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => {
      expect(store.inputValue).toBe('[https://example.com/](https://example.com/)');
    });
  });

  it('inserts a link even when the editor has never had a selection', async () => {
    const { screen, store } = await renderButton();

    await screen.getByRole('button', { name: 'Link' }).click();
    await screen.getByRole('textbox', { name: 'URL' }).fill('https://example.com/');
    await screen.getByRole('button', { name: 'Insert' }).click();
    await vi.waitFor(() => {
      expect(store.inputValue).toBe('[https://example.com/](https://example.com/)');
    });
  });

  it('links the selected text, prefilling the URL field with it', async () => {
    const { screen, store, root } = await renderButton('https://example.com/');

    root.focus();
    document.execCommand('selectAll');
    await screen.getByRole('button', { name: 'Link' }).click();
    await vi.waitFor(() => {
      expect(getDialog()?.open).toBe(true);
    });
    await expect
      .element(screen.getByRole('textbox', { name: 'URL' }))
      .toHaveValue('https://example.com/');
    // The text field is left out, since the selection provides the text
    expect(getDialog()?.querySelector('[aria-label="Text"]')).toBeNull();
    await screen.getByRole('button', { name: 'Insert' }).click();
    await vi.waitFor(() => {
      expect(store.inputValue).toBe('[https://example.com/](https://example.com/)');
    });
  });

  it('does nothing when the dialog is cancelled', async () => {
    const { screen, store, root } = await renderButton('Hello');

    root.focus();
    document.execCommand('selectAll');
    await screen.getByRole('button', { name: 'Link' }).click();
    await vi.waitFor(() => {
      expect(getDialog()?.open).toBe(true);
    });
    await screen.getByRole('textbox', { name: 'URL' }).fill('https://example.com/');
    await screen.getByRole('button', { name: 'Cancel' }).click();
    await vi.waitFor(() => {
      expect(getDialog()).toBeNull();
    });
    expect(store.inputValue).toBe('Hello');
  });

  it('updates or removes an existing link', async () => {
    const { screen, store, root } = await renderButton('[Example](https://example.com/)');
    const button = screen.getByRole('button', { name: 'Link' });

    root.focus();
    document.execCommand('selectAll');
    await vi.waitFor(() => {
      expect(store.selection.inlineTypes).toContain('link');
    });
    await expect.element(button).toHaveAttribute('aria-pressed', 'true');
    await button.click();
    await vi.waitFor(() => {
      expect(getDialog()?.open).toBe(true);
    });
    expect(getDialog()?.querySelector('.title')?.textContent?.trim()).toBe('Update Link');
    await expect
      .element(screen.getByRole('textbox', { name: 'URL' }))
      .toHaveValue('https://example.com/');
    await screen.getByRole('textbox', { name: 'URL' }).fill('https://example.org/');
    await screen.getByRole('button', { name: 'Update' }).click();
    await vi.waitFor(() => {
      expect(store.inputValue).toBe('[Example](https://example.org/)');
    });

    await button.click();
    await vi.waitFor(() => {
      expect(getDialog()?.open).toBe(true);
    });
    await screen.getByRole('button', { name: 'Remove' }).click();
    await vi.waitFor(() => {
      expect(store.inputValue).toBe('Example');
    });
  });

  it('opens the dialog with the keyboard shortcut', async () => {
    const { screen, root } = await renderButton('Hello');
    const modifier = navigator.platform.includes('Mac') ? 'Meta' : 'Control';

    root.focus();
    // Other keys are left to the editor
    await userEvent.keyboard('x');
    expect(getDialog()).toBeNull();
    await userEvent.keyboard(`{${modifier}>}k{/${modifier}}`);
    await vi.waitFor(() => {
      expect(getDialog()?.open).toBe(true);
    });
    expect(screen.container).toBeDefined();
  });

  it('is disabled in plain text mode', async () => {
    const { screen, store } = await renderButton();

    store.useRichText = false;
    await expect.element(screen.getByRole('button', { name: 'Link' })).toBeDisabled();
  });
});
