import {
  $createParagraphNode as createParagraphNode,
  $createTextNode as createTextNode,
} from 'lexical';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import EditorFixture from '../editor-fixture.test.svelte';
import InsertItemButton from './insert-item-button.svelte';
import { createTestComponent, getEditorStore } from '../../../test-utils/editor.js';

/**
 * @import { ComponentProps } from 'svelte';
 * @import { TextEditorComponent, TextEditorStore } from '$lib/typedefs';
 */

/**
 * A component that inserts a paragraph, standing in for a custom block.
 * @type {TextEditorComponent}
 */
const component = {
  id: 'greeting',
  label: 'Greeting',
  icon: 'waving_hand',
  node: /** @type {any} */ (undefined),
  /**
   * Create a paragraph with some text.
   * @returns {import('lexical').LexicalNode} Node.
   */
  createNode: () => createParagraphNode().append(createTextNode('Hello there')),
  transformer: /** @type {any} */ (undefined),
};

it('renders an iconic button for a component with an icon', async () => {
  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({
    store: undefined,
    component: InsertItemButton,
    componentProps: { component },
  });

  const screen = await render(EditorFixture, props);
  const store = getEditorStore(props);
  const button = screen.getByRole('button', { name: 'Greeting' });

  await expect.element(button).toHaveClass('iconic');
  await expect.element(button).toHaveAttribute('title', 'Greeting');
  await expect.element(button).toHaveAttribute('aria-controls', `${store.editorId}-lexical-root`);
  expect(button.element().querySelector('.icon')?.textContent?.trim()).toBe('waving_hand');
  expect(button.element().querySelector('.label')).toBeNull();
});

it('renders a labelled button for a component without an icon', async () => {
  const screen = await render(EditorFixture, {
    component: InsertItemButton,
    componentProps: { component: { ...component, icon: undefined } },
  });

  const button = screen.getByRole('button', { name: 'Greeting' });

  await expect.element(button).not.toHaveClass('iconic');
  expect(button.element().querySelector('.label')?.textContent?.trim()).toBe('Greeting');
});

it('inserts the node into the editor when clicked', async () => {
  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({
    store: undefined,
    component: InsertItemButton,
    componentProps: { component },
  });

  const screen = await render(EditorFixture, props);
  const store = getEditorStore(props);
  const button = screen.getByRole('button', { name: 'Greeting' });

  await vi.waitFor(() => {
    expect(store.initialized).toBe(true);
  });
  await button.click();
  await vi.waitFor(() => {
    expect(screen.container.querySelector('.lexical-root')?.textContent).toContain('Hello there');
  });
});

it('inserts the component’s Markdown through a dialog in plain text mode', async () => {
  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({
    store: undefined,
    component: InsertItemButton,
    componentProps: {
      component: createTestComponent({ id: 'figure', label: 'Figure', markdown: '<figure>' }),
    },
    withTextArea: true,
  });

  const screen = await render(EditorFixture, props);
  const store = getEditorStore(props);
  const textarea = /** @type {HTMLTextAreaElement} */ (screen.container.querySelector('textarea'));

  store.useRichText = false;
  textarea.value = 'Before After';
  textarea.focus();
  textarea.setSelectionRange(6, 7);
  await screen.getByRole('button', { name: 'Figure' }).click();

  const dialog = screen.getByRole('dialog', { name: 'Figure' });

  await expect.element(dialog).toBeVisible();
  // The component is rendered in a separate editor within the dialog
  await expect.element(dialog.getByRole('textbox', { name: 'Figure' })).toHaveTextContent('Figure');
  await expect.element(dialog.getByRole('button', { name: 'Insert' })).toBeEnabled();
  await dialog.getByRole('button', { name: 'Insert' }).click();
  // A block is inserted between blank lines
  await vi.waitFor(() => {
    expect(textarea.value).toBe('Before\n\n<figure>\n\nAfter');
  });
  expect(document.activeElement).toBe(textarea);
});

it('inserts the latest Markdown even if the component has just changed', async () => {
  let markdown = '<old>';
  /**
   * Get the current Markdown output of the component.
   * @returns {string} Markdown.
   */
  const getMarkdown = () => markdown;

  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({
    store: undefined,
    component: InsertItemButton,
    componentProps: {
      component: createTestComponent({ id: 'note', label: 'Note', markdown: getMarkdown }),
    },
    withTextArea: true,
  });

  const screen = await render(EditorFixture, props);
  const store = getEditorStore(props);
  const textarea = /** @type {HTMLTextAreaElement} */ (screen.container.querySelector('textarea'));

  store.useRichText = false;
  textarea.focus();
  await screen.getByRole('button', { name: 'Note' }).click();

  const dialog = screen.getByRole('dialog', { name: 'Note' });

  await expect.element(dialog.getByRole('button', { name: 'Insert' })).toBeEnabled();
  // Change the output without an editor update, like a field changed right before submitting
  markdown = '<new>';
  await dialog.getByRole('button', { name: 'Insert' }).click();
  await vi.waitFor(() => {
    expect(textarea.value).toBe('<new>\n\n');
  });
});
