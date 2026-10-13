import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { getEditorStore } from '../../../test-utils/editor.js';
import EditorFixture from '../editor-fixture.test.svelte';
import AlignMenuButton from './align-menu-button.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 * @import { TextEditorStore } from '#lib/typedefs.js';
 */

/**
 * Render the button with a live HTML editor holding the given value, with the caret at the end.
 * @param {string} value HTML.
 * @returns {Promise<{ store: TextEditorStore, root: HTMLElement }>} The store and the root.
 */
const renderButton = async (value) => {
  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({
    store: undefined,
    config: { enabledButtons: ['bold', 'heading-2', 'horizontal-rule', 'align'], format: 'html' },
    component: AlignMenuButton,
  });

  const screen = await render(EditorFixture, props);
  const store = getEditorStore(props);
  const root = /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root'));

  await vi.waitFor(() => {
    expect(store.initialized).toBe(true);
  });
  store.inputValue = value;
  await vi.waitFor(() => {
    expect(root.textContent).not.toBe('');
  });
  root.focus();
  document.execCommand('selectAll');
  document.getSelection()?.collapseToEnd();

  return { store, root };
};

/**
 * Get the name of the icon on the menu button.
 * @returns {string | undefined} Icon name.
 */
const getButtonIcon = () =>
  page
    .getByRole('button', { name: 'Show Alignment Options' })
    .element()
    .querySelector('.icon')
    ?.textContent?.trim();

describe('AlignMenuButton', () => {
  it('aligns the block with the caret, showing the alignment on the button and the menu', async () => {
    const { store, root } = await renderButton('<p>One</p><h2>Two</h2>');

    await vi.waitFor(() => {
      expect(getButtonIcon()).toBe('format_align_left');
    });

    await page.getByRole('button', { name: 'Show Alignment Options' }).click();

    const menu = page.getByRole('menu', { name: 'Alignment Options' });

    await expect.element(menu).toBeVisible();
    expect(
      menu
        .getByRole('menuitemradio')
        .all()
        .map((item) => item.element().querySelector('.content')?.textContent?.trim()),
    ).toEqual(['Left Align', 'Center Align', 'Right Align', 'Justify Align']);
    // The default alignment isn’t one of the options
    expect(menu.getByRole('menuitemradio', { checked: true }).all()).toHaveLength(0);

    await menu.getByRole('menuitemradio', { name: 'Center Align' }).click();
    await vi.waitFor(() => {
      expect(store.inputValue).toBe('<p>One</p><h2 style="text-align: center;">Two</h2>');
    });
    // The focus is back on the editor
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(root);
    });
    await vi.waitFor(() => {
      expect(getButtonIcon()).toBe('format_align_center');
    });

    await page.getByRole('button', { name: 'Show Alignment Options' }).click();
    await expect
      .element(page.getByRole('menuitemradio', { name: 'Center Align' }))
      .toHaveAttribute('aria-checked', 'true');
  });

  it('shows a logical alignment the menu doesn’t offer as left aligned', async () => {
    await renderButton('<p style="text-align: end;">End</p>');

    await vi.waitFor(() => {
      expect(getButtonIcon()).toBe('format_align_left');
    });
  });

  it('keeps the menu in line with the content when nothing can be aligned', async () => {
    const { store, root } = await renderButton('<p>One</p><hr><p>Two</p>');

    // A selected horizontal rule is not in any block that can be aligned
    await userEvent.click(/** @type {HTMLElement} */ (root.querySelector('hr')));
    await vi.waitFor(() => {
      expect(root.querySelector('hr')?.classList.contains('selected')).toBe(true);
    });

    await page.getByRole('button', { name: 'Show Alignment Options' }).click();
    await page.getByRole('menuitemradio', { name: 'Center Align' }).click();
    await expect
      .element(page.getByRole('button', { name: 'Show Alignment Options' }))
      .toHaveAttribute('aria-expanded', 'false');
    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });
    expect(store.inputValue).toBe('<p>One</p><hr><p>Two</p>');

    await page.getByRole('button', { name: 'Show Alignment Options' }).click();
    await expect
      .element(page.getByRole('menuitemradio', { name: 'Center Align' }))
      .toHaveAttribute('aria-checked', 'false');
  });
});
