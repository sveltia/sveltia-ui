import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { $getRoot as getRoot } from 'lexical';
import { getEditorStore } from '../../test-utils/editor.js';
import EditorFixture from './editor-fixture.test.svelte';
import TableCellMenuButton from './table-cell-menu-button.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 * @import { TextEditorStore } from '#lib/typedefs.js';
 */

const TABLE = ['| Name | Role |', '| --- | --- |', '| Alice | Editor |', '| Bob | Author |'].join(
  '\n',
);

/**
 * Get the element positioning the button.
 * @returns {HTMLElement} Element.
 */
const getContainer = () =>
  /** @type {HTMLElement} */ (document.querySelector('.table-cell-menu-button'));

/**
 * Get the button, if shown.
 * @returns {HTMLButtonElement | null} Button.
 */
const getButton = () => getContainer().querySelector('button');

/**
 * Get the table cell with the given text.
 * @param {HTMLElement} root Editor root.
 * @param {string} text Text.
 * @returns {HTMLTableCellElement} Cell.
 */
const getCell = (root, text) =>
  /** @type {HTMLTableCellElement} */ (
    [...root.querySelectorAll('th, td')].find((cell) => cell.textContent === text)
  );

/**
 * Place the caret at the end of the given element’s text, moving the focus to the editor.
 * @param {HTMLElement} root Editor root.
 * @param {Node} node Node to place the caret in.
 */
const placeCaret = (root, node) => {
  const range = document.createRange();
  const selection = /** @type {Selection} */ (window.getSelection());

  root.focus();
  range.selectNodeContents(node);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
};

/**
 * Get the Markdown the editor exports, once it has been updated.
 * @param {TextEditorStore} store Editor store.
 * @param {string} expected Markdown expected.
 */
const waitForValue = async (store, expected) => {
  await vi.waitFor(() => {
    expect(store.inputValue).toBe(expected);
  });
};

/**
 * Render the button with a live editor holding the given Markdown.
 * @param {object} [options] Options.
 * @param {string} [options.value] Markdown.
 * @returns {Promise<{ store: TextEditorStore, root: HTMLElement }>} The store and the root.
 */
const renderEditor = async ({ value = TABLE } = {}) => {
  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({
    store: undefined,
    config: { enabledButtons: ['bold', 'table'] },
    component: TableCellMenuButton,
  });

  const screen = await render(EditorFixture, props);
  const store = getEditorStore(props);
  const root = /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root'));

  // The button is positioned against the element holding it, like the editor wrapper
  screen.container.style.position = 'relative';

  await vi.waitFor(() => {
    expect(store.initialized).toBe(true);
  });
  store.inputValue = value;
  await vi.waitFor(() => {
    expect(root.querySelector('table')).not.toBeNull();
  });

  return { store, root };
};

describe('TableCellMenuButton', () => {
  it('shows the button at the top end corner of the cell with the caret', async () => {
    const { root } = await renderEditor();
    const cell = getCell(root, 'Alice');

    expect(getButton()).toBeNull();
    placeCaret(root, cell);
    await vi.waitFor(() => {
      expect(getButton()).not.toBeNull();
    });

    const button = /** @type {HTMLButtonElement} */ (getButton());
    const cellRect = cell.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();

    expect(button.getAttribute('aria-label')).toBe('Show Table Options');
    expect(button.getAttribute('aria-haspopup')).toBe('menu');
    expect(buttonRect.right).toBeLessThanOrEqual(cellRect.right);
    expect(buttonRect.right).toBeGreaterThan(cellRect.right - 10);
    expect(buttonRect.top).toBeGreaterThanOrEqual(cellRect.top);
    expect(buttonRect.top).toBeLessThan(cellRect.top + 10);
  });

  it('shows the button at the top left corner of a cell in a right-to-left table', async () => {
    const { store, root } = await renderEditor();

    // Like the `dir` prop of `<TextEditor>` does
    store.editor?.update(() => {
      getRoot().setDirection('rtl');
    });
    await vi.waitFor(() => {
      expect(
        getComputedStyle(/** @type {HTMLElement} */ (root.querySelector('table'))).direction,
      ).toBe('rtl');
    });

    const cell = getCell(root, 'Alice');

    placeCaret(root, cell);
    await vi.waitFor(() => {
      expect(getButton()).not.toBeNull();
    });

    const cellRect = cell.getBoundingClientRect();
    const buttonRect = /** @type {HTMLButtonElement} */ (getButton()).getBoundingClientRect();

    expect(getContainer().classList.contains('rtl')).toBe(true);
    expect(buttonRect.left).toBeGreaterThanOrEqual(cellRect.left);
    expect(buttonRect.left).toBeLessThan(cellRect.left + 10);

    // The menu opens toward the inline end as well
    await userEvent.click(/** @type {HTMLButtonElement} */ (getButton()));
    await expect.element(page.getByRole('menu', { name: 'Table Options' })).toBeVisible();
  });

  it('follows the caret to another cell, and hides outside the table', async () => {
    const { root } = await renderEditor({ value: `Intro\n\n${TABLE}` });

    placeCaret(root, getCell(root, 'Alice'));
    await vi.waitFor(() => {
      expect(getButton()).not.toBeNull();
    });

    const firstTop = getContainer().getBoundingClientRect().top;

    placeCaret(root, getCell(root, 'Bob'));
    await vi.waitFor(() => {
      expect(getContainer().getBoundingClientRect().top).toBeGreaterThan(firstTop);
    });

    placeCaret(root, /** @type {HTMLElement} */ (root.querySelector('p')));
    await vi.waitFor(() => {
      expect(getButton()).toBeNull();
    });
  });

  it('hides the button once the focus leaves the editor', async () => {
    const { root } = await renderEditor();
    const outside = document.createElement('input');

    document.body.append(outside);
    placeCaret(root, getCell(root, 'Alice'));
    await vi.waitFor(() => {
      expect(getButton()).not.toBeNull();
    });

    outside.focus();
    await vi.waitFor(() => {
      expect(getButton()).toBeNull();
    });

    outside.remove();
  });

  it('hides the button in the plain text mode', async () => {
    const { store, root } = await renderEditor();

    placeCaret(root, getCell(root, 'Alice'));
    await vi.waitFor(() => {
      expect(getButton()).not.toBeNull();
    });

    store.useRichText = false;
    await vi.waitFor(() => {
      expect(getButton()).toBeNull();
    });
  });

  it('runs an operation from the menu, keeping the button while the menu is open', async () => {
    const { store, root } = await renderEditor();

    placeCaret(root, getCell(root, 'Alice'));
    await vi.waitFor(() => {
      expect(getButton()).not.toBeNull();
    });

    await userEvent.click(/** @type {HTMLButtonElement} */ (getButton()));

    const menu = page.getByRole('menu', { name: 'Table Options' });

    await expect.element(menu).toBeVisible();
    // The focus is on the menu, outside the editor
    expect(getButton()).not.toBeNull();
    expect(menu.getByRole('menuitem').elements()).toHaveLength(7);

    await menu.getByRole('menuitem', { name: 'Insert Row Below' }).click();
    await waitForValue(
      store,
      [
        '| Name | Role |',
        '| --- | --- |',
        '| Alice | Editor |',
        '|  |  |',
        '| Bob | Author |',
      ].join('\n'),
    );
    // The focus is back on the editor, with the caret where it was
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(root);
    });
    expect(getButton()).not.toBeNull();
  });

  it('follows the cell when a wide table is scrolled', async () => {
    const columns = Array.from({ length: 12 }, (_, index) => `Column ${index + 1}`);

    const value = [
      `| ${columns.join(' | ')} |`,
      `| ${columns.map(() => '---').join(' | ')} |`,
      `| ${columns.map((_, index) => `Cell ${index + 1}`).join(' | ')} |`,
    ].join('\n');

    const { root } = await renderEditor({ value });
    const wrapper = /** @type {HTMLElement} */ (root.querySelector('.table-wrapper'));

    root.style.width = '300px';
    placeCaret(root, getCell(root, 'Cell 1'));
    await vi.waitFor(() => {
      expect(getButton()).not.toBeNull();
    });

    expect(wrapper.scrollWidth).toBeGreaterThan(wrapper.clientWidth);

    // Scroll the cell out of view, which hides the button
    wrapper.scrollLeft = wrapper.scrollWidth;
    await vi.waitFor(() => {
      expect(getContainer().hidden).toBe(true);
    });

    // Scroll back, which shows it again
    wrapper.scrollLeft = 0;
    await vi.waitFor(() => {
      expect(getContainer().hidden).toBe(false);
    });
  });

  it('hides the button once the cell is scrolled out of the editor', async () => {
    const rows = Array.from({ length: 20 }, (_, index) => `| Row ${index + 1} | Value |`);

    const { root } = await renderEditor({
      value: ['| Name | Role |', '| --- | --- |', ...rows].join('\n'),
    });

    // Limit the editor height, like the `minimal` option of Sveltia CMS
    root.style.maxHeight = '120px';
    root.style.overflow = 'auto';
    placeCaret(root, getCell(root, 'Name'));
    await vi.waitFor(() => {
      expect(getButton()).not.toBeNull();
    });

    root.scrollTop = root.scrollHeight;
    await vi.waitFor(() => {
      expect(getContainer().hidden).toBe(true);
    });

    root.scrollTop = 0;
    await vi.waitFor(() => {
      expect(getContainer().hidden).toBe(false);
    });
  });

  it('follows the cell when the window is resized', async () => {
    const { root } = await renderEditor();
    const cell = getCell(root, 'Alice');

    placeCaret(root, cell);
    await vi.waitFor(() => {
      expect(getButton()).not.toBeNull();
    });

    const { left } = getContainer().style;

    cell.style.minWidth = '300px';
    window.dispatchEvent(new Event('resize'));
    await vi.waitFor(() => {
      expect(getContainer().style.left).not.toBe(left);
    });
  });
});
