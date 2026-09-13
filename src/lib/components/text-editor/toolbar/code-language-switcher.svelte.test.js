import { beforeAll, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { $getRoot as getRoot } from 'lexical';
import { $isCodeNode as isCodeNode } from '@lexical/code-core';
import EditorFixture from '../editor-fixture.test.svelte';
import { setCodeHighlighterLoaders } from '../shiki/loader.js';
import CodeLanguageSwitcher from './code-language-switcher.svelte';
import { getEditorStore } from '../../../test-utils/editor.js';

/**
 * @import { ComponentProps } from 'svelte';
 * @import { TextEditorStore } from '$lib/typedefs';
 */

beforeAll(() => {
  // Keep the syntax highlighter off the network: without an engine, code stays plain text
  setCodeHighlighterLoaders({
    /**
     * Fail to load the engine.
     * @throws {Error} Always.
     */
    loadEngine: async () => {
      throw new Error('Not available in tests');
    },
  });
});

it('lists the languages with plain text first', async () => {
  const screen = await render(EditorFixture, {
    config: { isCodeEditor: true },
    component: CodeLanguageSwitcher,
  });

  const select = screen.getByRole('combobox', { name: 'Language' });

  expect(select.element().textContent).toContain('Plain Text');
  await select.click();
  await vi.waitFor(() => {
    expect(document.querySelectorAll('dialog.popup [role="option"]').length).toBeGreaterThan(10);
  });

  const first = /** @type {HTMLElement} */ (document.querySelector('dialog.popup [role="option"]'));

  expect(first.getAttribute('data-label')).toBe('Plain Text');
  expect(first.getAttribute('data-value')).toBe('plain');
  expect(first.getAttribute('aria-selected')).toBe('true');
  expect(first.getAttribute('dir')).toBe('ltr');
});

it('follows the language of the code block at the selection', async () => {
  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({
    store: undefined,
    config: { isCodeEditor: true, defaultLanguage: 'plain' },
    component: CodeLanguageSwitcher,
  });

  const screen = await render(EditorFixture, props);
  const store = getEditorStore(props);

  await vi.waitFor(() => {
    expect(store.initialized).toBe(true);
  });
  store.inputValue = '```css\na {}\n```';
  await vi.waitFor(() => {
    expect(screen.container.querySelector('.lexical-root code')).not.toBeNull();
  });
  // The switcher looks at the block at the selection, reported by the editor
  store.selection = { ...store.selection, blockNodeKey: 'x' };
  await vi.waitFor(() => {
    expect(screen.getByRole('combobox').element().textContent).toContain('CSS');
  });
});

it('changes the language of the code block', async () => {
  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({
    store: undefined,
    config: { isCodeEditor: true },
    component: CodeLanguageSwitcher,
  });

  const screen = await render(EditorFixture, props);
  const store = getEditorStore(props);

  await vi.waitFor(() => {
    expect(store.initialized).toBe(true);
  });
  store.inputValue = '```plain\nx\n```';
  await vi.waitFor(() => {
    expect(screen.container.querySelector('.lexical-root code')).not.toBeNull();
  });
  await screen.getByRole('combobox', { name: 'Language' }).click();
  await screen.getByRole('searchbox', { name: 'Filter Options' }).fill('html');
  await screen.getByRole('option', { name: 'HTML' }).click();
  await vi.waitFor(() => {
    expect(store.inputValue).toBe('```html\nx\n```');
  });
});

it.each([
  ['the default language', 'css', 'CSS'],
  ['plain text', undefined, 'Plain Text'],
])('falls back to %s for a code block without a language', async (_, defaultLanguage, label) => {
  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({
    store: undefined,
    config: { isCodeEditor: true, defaultLanguage },
    component: CodeLanguageSwitcher,
  });

  const screen = await render(EditorFixture, props);
  const store = getEditorStore(props);

  await vi.waitFor(() => {
    expect(store.initialized).toBe(true);
  });
  store.inputValue = '```\nx\n```';
  await vi.waitFor(() => {
    expect(screen.container.querySelector('.lexical-root code')).not.toBeNull();
  });
  // Strip the language off the block, then let the switcher take another look
  store.editor?.update(() => {
    const node = getRoot().getChildren()[0];

    if (isCodeNode(node)) {
      node.setLanguage(null);
    }
  });
  await new Promise((resolve) => {
    setTimeout(resolve, 50);
  });
  store.selection = { ...store.selection, blockNodeKey: 'x' };
  await vi.waitFor(() => {
    expect(screen.getByRole('combobox').element().textContent).toContain(label);
  });
});

it('leaves the code block alone when the same language is picked', async () => {
  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({
    store: undefined,
    config: { isCodeEditor: true },
    component: CodeLanguageSwitcher,
  });

  const screen = await render(EditorFixture, props);
  const store = getEditorStore(props);

  await vi.waitFor(() => {
    expect(store.initialized).toBe(true);
  });
  store.inputValue = '```plain\nx\n```';
  await screen.getByRole('combobox', { name: 'Language' }).click();
  await screen.getByRole('option', { name: 'Plain Text' }).click();
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  });
  expect(store.inputValue).toBe('```plain\nx\n```');
});

it('does nothing in the rich text editor while the selection is not in a code block', async () => {
  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({ store: undefined, component: CodeLanguageSwitcher });
  const screen = await render(EditorFixture, props);
  const store = getEditorStore(props);

  await vi.waitFor(() => {
    expect(store.initialized).toBe(true);
  });
  store.inputValue = 'Just text';
  await vi.waitFor(() => {
    expect(screen.container.querySelector('.lexical-root p')).not.toBeNull();
  });
  await screen.getByRole('combobox', { name: 'Language' }).click();
  await screen.getByRole('searchbox', { name: 'Filter Options' }).fill('html');
  await screen.getByRole('option', { name: 'HTML' }).click();
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  });
  expect(store.inputValue).toBe('Just text');
});

it('can be disabled', async () => {
  const screen = await render(EditorFixture, {
    config: { isCodeEditor: true },
    component: CodeLanguageSwitcher,
    componentProps: { disabled: true },
  });

  await expect
    .element(screen.getByRole('combobox', { name: 'Language' }))
    .toHaveAttribute('aria-disabled', 'true');
});
