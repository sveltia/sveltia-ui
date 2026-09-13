import {
  $createParagraphNode as createParagraphNode,
  $createTextNode as createTextNode,
} from 'lexical';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import EditorFixture from '../editor-fixture.test.svelte';
import InsertItemButton from './insert-item-button.svelte';
import { getEditorStore } from '../../../test-utils/editor.js';

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

it('inserts the node into the editor when clicked, unless in plain text mode', async () => {
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

  store.useRichText = false;
  await expect.element(button).toBeDisabled();
});
