import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import EditorFixture from '../editor-fixture.test.svelte';
import ToggleBlockMenuItem from './toggle-block-menu-item.svelte';
import { getEditorStore } from '../../../test-utils/editor.js';

/**
 * @import { ComponentProps } from 'svelte';
 * @import { TextEditorBlockType, TextEditorStore } from '$lib/typedefs';
 */

/**
 * Render the menu item for the given block type with some text in the editor.
 * @param {TextEditorBlockType} type Block type.
 * @returns {Promise<{ screen: Awaited<ReturnType<typeof render<typeof EditorFixture>>>,
 * store: TextEditorStore }>} Rendered fixture and the store.
 */
const renderItem = async (type) => {
  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({
    store: undefined,
    component: ToggleBlockMenuItem,
    componentProps: { type },
  });

  const screen = await render(EditorFixture, props);
  const store = getEditorStore(props);

  await vi.waitFor(() => {
    expect(store.initialized).toBe(true);
  });
  store.inputValue = 'Hello';
  await vi.waitFor(() => {
    expect(screen.container.querySelector('.lexical-root')?.textContent).toBe('Hello');
  });

  return { screen, store };
};

it('renders a checkbox menu item with the label and icon', async () => {
  const { screen } = await renderItem('heading-1');
  const item = screen.getByRole('menuitemcheckbox', { name: /Heading 1/ });

  await expect.element(item).toHaveAttribute('aria-checked', 'false');
  expect(item.element().querySelector('.icon')?.textContent?.trim()).toBe('format_h1');
});

it('is checked while the selection has the block type', async () => {
  const { screen, store } = await renderItem('blockquote');

  store.selection = { ...store.selection, blockType: 'blockquote' };
  await expect
    .element(screen.getByRole('menuitemcheckbox', { name: /Block Quote/ }))
    .toHaveAttribute('aria-checked', 'true');
});

it.each(
  /** @type {[TextEditorBlockType, string][]} */ ([
    ['heading-2', '## Hello'],
    ['bulleted-list', '- Hello'],
    ['numbered-list', '1. Hello'],
    ['blockquote', '> Hello'],
    ['code-block', '```plain\nHello\n```'],
  ]),
)('changes the block type to %s when clicked', async (type, markdown) => {
  const { screen, store } = await renderItem(type);

  /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root')).focus();
  document.execCommand('selectAll');
  await screen.getByRole('menuitemcheckbox').click();
  await vi.waitFor(() => {
    expect(store.inputValue).toBe(markdown);
  });
});

it('does nothing when the selection already has the block type', async () => {
  const { screen, store } = await renderItem('paragraph');
  const item = screen.getByRole('menuitemcheckbox');

  await expect.element(item).toHaveAttribute('aria-checked', 'true');
  await item.click();
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  });
  expect(store.inputValue).toBe('Hello');
});

it('turns a heading back into a paragraph', async () => {
  const { screen, store } = await renderItem('paragraph');

  store.inputValue = '# Hello';
  await vi.waitFor(() => {
    expect(screen.container.querySelector('.lexical-root h1')).not.toBeNull();
  });
  /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root')).focus();
  document.execCommand('selectAll');
  // The item only acts once the selection is known to be of another type
  await vi.waitFor(() => {
    expect(store.selection.blockType).toBe('heading-1');
  });
  await screen.getByRole('menuitemcheckbox').click();
  await vi.waitFor(() => {
    expect(store.inputValue).toBe('Hello');
  });
});
