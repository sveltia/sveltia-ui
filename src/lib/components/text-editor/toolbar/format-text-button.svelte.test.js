import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import EditorFixture from '../editor-fixture.test.svelte';
import FormatTextButton from './format-text-button.svelte';
import { getEditorStore } from '../../../test-utils/editor.js';

/**
 * @import { ComponentProps } from 'svelte';
 * @import { TextEditorStore } from '$lib/typedefs';
 */

it('renders an iconic button for the format', async () => {
  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({
    store: undefined,
    component: FormatTextButton,
    componentProps: { type: 'italic' },
  });

  const screen = await render(EditorFixture, props);
  const store = getEditorStore(props);
  const button = screen.getByRole('button', { name: 'Italic' });

  await expect.element(button).toHaveClass('iconic');
  await expect.element(button).toHaveAttribute('aria-pressed', 'false');
  await expect.element(button).toHaveAttribute('aria-controls', `${store.editorId}-lexical-root`);
  await expect.element(button).toBeEnabled();
  expect(button.element().querySelector('.icon')?.textContent?.trim()).toBe('format_italic');
});

it('reflects the selection state and the editing mode', async () => {
  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({
    store: undefined,
    component: FormatTextButton,
    componentProps: { type: 'bold' },
  });

  const screen = await render(EditorFixture, props);
  const store = getEditorStore(props);
  const button = screen.getByRole('button', { name: 'Bold' });

  store.selection = { blockNodeKey: null, blockType: 'paragraph', inlineTypes: ['bold'] };
  await expect.element(button).toHaveAttribute('aria-pressed', 'true');
  store.useRichText = false;
  await expect.element(button).toBeDisabled();
});

it('applies the format to the editor content when clicked', async () => {
  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({
    store: undefined,
    component: FormatTextButton,
    componentProps: { type: 'bold' },
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
  /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root')).focus();
  document.execCommand('selectAll');
  await screen.getByRole('button', { name: 'Bold' }).click();
  await vi.waitFor(() => {
    expect(store.inputValue).toBe('**Hello**');
  });
});
