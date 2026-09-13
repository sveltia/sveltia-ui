import {
  $createParagraphNode as createParagraphNode,
  $createTextNode as createTextNode,
} from 'lexical';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import EditorFixture from '../editor-fixture.test.svelte';
import InsertMenuButton from './insert-menu-button.svelte';
import { getEditorStore } from '../../../test-utils/editor.js';

/**
 * @import { ComponentProps } from 'svelte';
 * @import { TextEditorComponent, TextEditorStore } from '$lib/typedefs';
 */

/** @type {TextEditorComponent[]} */
const components = [
  {
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
  },
  {
    id: 'farewell',
    label: 'Farewell',
    node: /** @type {any} */ (undefined),
    /**
     * Create a paragraph with some text.
     * @returns {import('lexical').LexicalNode} Node.
     */
    createNode: () => createParagraphNode().append(createTextNode('Goodbye')),
    transformer: /** @type {any} */ (undefined),
  },
];

it('lists the components in a menu and inserts the chosen one', async () => {
  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({
    store: undefined,
    component: InsertMenuButton,
    componentProps: { components },
  });

  const screen = await render(EditorFixture, props);
  const store = getEditorStore(props);
  const button = screen.getByRole('button', { name: 'Insert' });

  await vi.waitFor(() => {
    expect(store.initialized).toBe(true);
  });
  await expect.element(button).toHaveAttribute('aria-haspopup', 'menu');
  await button.click();

  const greeting = screen.getByRole('menuitem', { name: 'Greeting' });
  const farewell = screen.getByRole('menuitem', { name: 'Farewell' });

  await expect.element(greeting).toBeVisible();
  await expect.element(farewell).toBeVisible();
  expect(greeting.element().querySelector('.icon')?.textContent?.trim()).toBe('waving_hand');
  expect(farewell.element().querySelector('.icon')).toBeNull();

  await farewell.click();
  await vi.waitFor(() => {
    expect(screen.container.querySelector('.lexical-root')?.textContent).toContain('Goodbye');
  });
});

it('is disabled in plain text mode', async () => {
  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({
    store: undefined,
    component: InsertMenuButton,
    componentProps: { components },
  });

  const screen = await render(EditorFixture, props);
  const store = getEditorStore(props);

  store.useRichText = false;
  await expect.element(screen.getByRole('button', { name: 'Insert' })).toBeDisabled();
});
