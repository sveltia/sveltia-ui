import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { getEditorStore } from '../../../test-utils/editor.js';
import EditorFixture from '../editor-fixture.test.svelte';
import InsertTableButton from './insert-table-button.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 * @import { TextEditorStore } from '#lib/typedefs.js';
 */

/**
 * Render the button with a live editor.
 * @param {object} [options] Options.
 * @param {boolean} [options.disabled] Whether to disable the button.
 * @param {boolean} [options.plainText] Whether to use the plain text mode.
 * @returns {Promise<{ store: TextEditorStore, root: HTMLElement, textarea: HTMLTextAreaElement }>}
 * The store, the editor root and the `<textarea>`.
 */
const renderButton = async ({ disabled = false, plainText = false } = {}) => {
  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({
    store: undefined,
    config: { enabledButtons: ['bold', 'table'] },
    component: InsertTableButton,
    componentProps: { disabled },
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

/**
 * Open the dialog, and get its fields and buttons.
 * @returns {Promise<{ dialog: any, rows: any, columns: any, insert: any }>} Locators.
 */
const openDialog = async () => {
  await page.getByRole('button', { name: 'Insert Table' }).click();

  const dialog = page.getByRole('dialog', { name: 'Insert Table' });

  await expect.element(dialog).toBeVisible();

  return {
    dialog,
    rows: dialog.getByRole('spinbutton', { name: 'Rows' }),
    columns: dialog.getByRole('spinbutton', { name: 'Columns' }),
    insert: dialog.getByRole('button', { name: 'Insert' }),
  };
};

describe('InsertTableButton', () => {
  it('renders an iconic button controlling the editor', async () => {
    const { store } = await renderButton();
    const button = page.getByRole('button', { name: 'Insert Table' });

    await expect.element(button).toHaveClass('iconic');
    await expect.element(button).toHaveAttribute('aria-controls', `${store.editorId}-lexical-root`);
    await expect.element(button).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('can be disabled', async () => {
    await renderButton({ disabled: true });

    await expect
      .element(page.getByRole('button', { name: 'Insert Table' }))
      .toHaveAttribute('aria-disabled', 'true');
  });

  it('inserts a table of the chosen size with the caret in the first cell', async () => {
    const { store, root } = await renderButton();

    store.inputValue = 'Intro';
    await vi.waitFor(() => {
      expect(root.querySelector('p')?.textContent).toBe('Intro');
    });
    root.focus();
    document.execCommand('selectAll');
    document.getSelection()?.collapseToEnd();

    const { rows, columns, insert } = await openDialog();

    await expect.element(rows).toHaveValue('3');
    await expect.element(columns).toHaveValue('3');
    await rows.fill('2');
    await columns.fill('4');
    await insert.click();

    await vi.waitFor(() => {
      expect(store.inputValue).toBe(
        ['Intro', '', '|  |  |  |  |', '| --- | --- | --- | --- |', '|  |  |  |  |'].join('\n'),
      );
    });
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(root);
    });

    // The caret is in the first header cell
    await userEvent.keyboard('Name');
    await vi.waitFor(() => {
      expect(store.inputValue).toContain('| Name |  |  |  |');
    });
  });

  it('inserts the table with the Enter key, but not while a size is invalid', async () => {
    const { store, root } = await renderButton();

    root.focus();

    const { rows, columns, insert } = await openDialog();

    await rows.fill('0');
    await expect.element(insert).toHaveAttribute('aria-disabled', 'true');
    await expect.element(rows).toHaveAttribute('aria-invalid', 'true');
    await userEvent.keyboard('{Enter}');
    await expect.element(rows).toBeVisible();

    await rows.fill('1');
    await columns.fill('100');
    await expect.element(insert).toHaveAttribute('aria-disabled', 'true');
    await expect.element(columns).toHaveAttribute('aria-invalid', 'true');

    await columns.fill('1');
    await expect.element(insert).not.toHaveAttribute('aria-disabled', 'true');
    await userEvent.keyboard('{Enter}');

    await vi.waitFor(() => {
      expect(store.inputValue).toBe(['|  |', '| --- |'].join('\n'));
    });
  });

  it('keeps the size last chosen, but not an invalid one', async () => {
    const { root } = await renderButton();

    root.focus();

    const first = await openDialog();

    await first.rows.fill('4');
    await first.columns.fill('0');
    await first.dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect.element(first.dialog).not.toBeInTheDocument();

    const second = await openDialog();

    await expect.element(second.rows).toHaveValue('4');
    await expect.element(second.columns).toHaveValue('3');
    await second.rows.fill('0');
    await second.dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect.element(second.dialog).not.toBeInTheDocument();

    const third = await openDialog();

    await expect.element(third.rows).toHaveValue('3');
    await expect.element(third.columns).toHaveValue('3');
  });

  it('inserts nothing when canceled, moving the focus back to the editor', async () => {
    const { store, root } = await renderButton();

    root.focus();

    const { dialog } = await openDialog();

    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(root);
    });
    expect(root.querySelector('table')).toBeNull();
    expect(store.inputValue).toBe('');
  });

  it('inserts the table’s Markdown in the plain text mode, with the caret in the first cell', async () => {
    const { textarea } = await renderButton({ plainText: true });

    textarea.value = 'Before';
    textarea.focus();
    textarea.setSelectionRange(6, 6);

    const { rows, columns, insert } = await openDialog();

    await rows.fill('2');
    await columns.fill('2');
    await insert.click();

    const table = ['|  |  |', '| --- | --- |', '|  |  |'].join('\n');

    await vi.waitFor(() => {
      // Separated from the text around it, like any other block
      expect(textarea.value).toBe(`Before\n\n${table}\n\n`);
    });
    expect(document.activeElement).toBe(textarea);
    expect(textarea.selectionStart).toBe('Before\n\n| '.length);
    expect(textarea.selectionEnd).toBe('Before\n\n| '.length);
  });

  it('moves the focus back to the `<textarea>` when canceled in the plain text mode', async () => {
    const { textarea } = await renderButton({ plainText: true });

    textarea.focus();

    const { dialog } = await openDialog();

    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(textarea);
    });
    expect(textarea.value).toBe('');
  });
});
