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

/**
 * Render the button for the given component in plain text mode.
 * @param {import('$lib/typedefs').TextEditorComponent} editorComponent Component.
 * @returns {Promise<{ screen: any, textarea: HTMLTextAreaElement }>} Rendered fixture and the
 * `<textarea>`.
 */
const renderPlainText = async (editorComponent) => {
  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({
    store: undefined,
    component: InsertItemButton,
    componentProps: { component: editorComponent },
    withTextArea: true,
  });

  const screen = await render(EditorFixture, props);
  const textarea = /** @type {HTMLTextAreaElement} */ (screen.container.querySelector('textarea'));

  getEditorStore(props).useRichText = false;
  textarea.value = 'Before After';
  textarea.focus();
  textarea.setSelectionRange(6, 7);

  return { screen, textarea };
};

it('inserts the component’s Markdown as a block in plain text mode', async () => {
  const { screen, textarea } = await renderPlainText(
    createTestComponent({ id: 'figure', label: 'Figure', markdown: '<figure>' }),
  );

  await screen.getByRole('button', { name: 'Figure' }).click();
  await vi.waitFor(() => {
    expect(textarea.value).toBe('Before\n\n<figure>\n\nAfter');
  });
  expect(document.activeElement).toBe(textarea);
  expect(document.querySelector('dialog')).toBeNull();
});

it('inserts nothing in plain text mode if the component has no Markdown', async () => {
  const { screen, textarea } = await renderPlainText(
    createTestComponent({ id: 'image', label: 'Image', markdown: '' }),
  );

  await screen.getByRole('button', { name: 'Image' }).click();
  await vi.waitFor(() => {
    expect(document.activeElement).toBe(textarea);
  });
  expect(textarea.value).toBe('Before After');
});

it('prefers the component’s own Markdown in plain text mode', async () => {
  const { screen, textarea } = await renderPlainText({
    ...createTestComponent({ id: 'image', label: 'Image', markdown: '' }),
    /**
     * Create the Markdown of an empty image.
     * @returns {string} Markdown.
     */
    createMarkdown: () => '![]()',
  });

  await screen.getByRole('button', { name: 'Image' }).click();
  await vi.waitFor(() => {
    expect(textarea.value).toBe('Before\n\n![]()\n\nAfter');
  });
});
