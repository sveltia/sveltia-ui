import { HEADING } from '@lexical/markdown';
import {
  $createParagraphNode as createParagraphNode,
  $createTextNode as createTextNode,
  ParagraphNode,
} from 'lexical';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import EditorFixture from '../editor-fixture.test.svelte';
import TextEditorToolbar from './text-editor-toolbar.svelte';
import { getEditorStore } from '../../../test-utils/editor.js';

/**
 * @import { ComponentProps } from 'svelte';
 * @import { TextEditorComponent, TextEditorConfig, TextEditorStore } from '$lib/typedefs';
 */

/**
 * Render the toolbar with the given editor config.
 * @param {Partial<TextEditorConfig>} [config] Config.
 * @param {Record<string, any>} [componentProps] Toolbar props.
 * @returns {Promise<{ screen: Awaited<ReturnType<typeof render<typeof EditorFixture>>>,
 * store: TextEditorStore }>} Rendered fixture and the store.
 */
const renderToolbar = async (config = {}, componentProps = {}) => {
  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({ store: undefined, config, component: TextEditorToolbar, componentProps });
  const screen = await render(EditorFixture, props);

  return { screen, store: getEditorStore(props) };
};

/**
 * A component that inserts a paragraph, standing in for a custom block. The editor registers the
 * node and transformer of every component, so built-in ones are used here.
 * @type {TextEditorComponent}
 */
const component = {
  id: 'greeting',
  label: 'Greeting',
  node: /** @type {any} */ (ParagraphNode),
  /**
   * Create a paragraph with some text.
   * @returns {import('lexical').LexicalNode} Node.
   */
  createNode: () => createParagraphNode().append(createTextNode('Hello there')),
  transformer: HEADING,
};

describe('TextEditorToolbar', () => {
  it('renders every kind of button by default', async () => {
    const { screen } = await renderToolbar();

    await expect.element(screen.getByRole('toolbar', { name: 'Text Editor' })).toBeVisible();
    await expect
      .element(screen.getByRole('button', { name: 'Show Text Style Options' }))
      .toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Bold' })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Italic' })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Strikethrough' })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Code' })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Link' })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Edit in Markdown' })).toBeVisible();
    expect(document.querySelector('[aria-label="Insert"]')).toBeNull();
  });

  it('lists the enabled block types in the text style menu', async () => {
    const { screen } = await renderToolbar({ enabledButtons: ['heading-1', 'blockquote', 'bold'] });

    await screen.getByRole('button', { name: 'Show Text Style Options' }).click();
    await expect.element(screen.getByRole('menu', { name: 'Text Style Options' })).toBeVisible();

    const items = screen.getByRole('menuitemcheckbox').all();

    expect(
      items.map((item) => item.element().querySelector('.content')?.textContent?.trim()),
    ).toEqual(['Paragraph', 'Heading 1', 'Block Quote']);
  });

  it('omits the text style menu and inline buttons when nothing is enabled', async () => {
    const { screen } = await renderToolbar({ enabledButtons: [] });

    expect(document.querySelector('[aria-label="Show Text Style Options"]')).toBeNull();
    expect(document.querySelector('[aria-label="Bold"]')).toBeNull();
    expect(screen.container.querySelector('.sui.button-group')).toBeNull();
  });

  it('shows the current block type’s icon on the text style button', async () => {
    const { screen, store } = await renderToolbar();
    const button = screen.getByRole('button', { name: 'Show Text Style Options' });

    expect(button.element().querySelector('.icon')?.textContent?.trim()).toBe('format_paragraph');
    store.selection = { ...store.selection, blockType: 'heading-1' };
    await vi.waitFor(() => {
      expect(button.element().querySelector('.icon')?.textContent?.trim()).toBe('format_h1');
    });
    // A block type without a button of its own falls back to the paragraph icon
    store.selection = { ...store.selection, blockType: /** @type {any} */ ('table') };
    await vi.waitFor(() => {
      expect(button.element().querySelector('.icon')?.textContent?.trim()).toBe('format_paragraph');
    });
  });

  it('omits the Insert menu when every component is a button', async () => {
    const { screen } = await renderToolbar({
      components: [{ ...component, id: 'a', label: 'As Button', trigger: 'button' }],
    });

    await expect.element(screen.getByRole('button', { name: 'As Button' })).toBeVisible();
    expect(document.querySelector('[aria-label="Insert"]')).toBeNull();
  });

  it('swaps the inline buttons for the language switcher within a code block', async () => {
    const { screen, store } = await renderToolbar();

    await expect.element(screen.getByRole('button', { name: 'Bold' })).toBeVisible();
    store.selection = { ...store.selection, blockType: 'code-block' };
    await expect.element(screen.getByRole('combobox', { name: 'Language' })).toBeVisible();
    expect(document.querySelector('[aria-label="Bold"]')).toBeNull();
  });

  it('places the components on the toolbar or under the Insert menu', async () => {
    const { screen } = await renderToolbar({
      components: [
        { ...component, id: 'a', label: 'As Button', trigger: 'button' },
        { ...component, id: 'b', label: 'As Item' },
      ],
    });

    await expect.element(screen.getByRole('button', { name: 'As Button' })).toBeVisible();
    await screen.getByRole('button', { name: 'Insert' }).click();
    await expect.element(screen.getByRole('menuitem', { name: 'As Item' })).toBeVisible();
  });

  it('toggles the editing mode and converts the Markdown back', async () => {
    const { screen, store } = await renderToolbar();
    const toggle = screen.getByRole('button', { name: 'Edit in Markdown' });
    const root = /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root'));

    await vi.waitFor(() => {
      expect(store.initialized).toBe(true);
    });
    await expect.element(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    expect(store.useRichText).toBe(false);
    await expect.element(toggle).toHaveAttribute('aria-pressed', 'true');
    // In plain text mode, the value is not converted to rich text…
    store.inputValue = '# Typed in Markdown';
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    expect(root.querySelector('h1')).toBeNull();
    // …until the editor is switched back
    await toggle.click();
    expect(store.useRichText).toBe(true);
    await vi.waitFor(() => {
      expect(root.querySelector('h1')?.textContent).toBe('Typed in Markdown');
    });
  });

  it('omits the mode toggle with a single mode, and disables it on a converter error', async () => {
    const single = await renderToolbar({ modes: ['rich-text'] });

    expect(document.querySelector('[aria-label="Edit in Markdown"]')).toBeNull();
    await single.screen.unmount();

    const { screen, store } = await renderToolbar();

    store.hasConverterError = true;
    await expect.element(screen.getByRole('button', { name: 'Edit in Markdown' })).toBeDisabled();
    await expect
      .element(screen.getByRole('button', { name: 'Edit in Markdown' }))
      .toHaveAttribute('aria-pressed', 'true');
  });

  it('disables the toolbar while disabled or read-only', async () => {
    const disabled = await renderToolbar({}, { disabled: true });

    await expect
      .element(disabled.screen.getByRole('toolbar'))
      .toHaveAttribute('aria-disabled', 'true');
    await disabled.screen.unmount();

    const readonly = await renderToolbar({}, { readonly: true });

    await expect
      .element(readonly.screen.getByRole('toolbar'))
      .toHaveAttribute('aria-disabled', 'true');
  });
});
