import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import { setCodeHighlighterLoaders } from './shiki/loader.js';
import TextEditor from './text-editor.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

/**
 * Wait until the rich text editor has rendered the given HTML.
 * @param {HTMLElement} container Container.
 * @param {string} html HTML to look for.
 * @returns {Promise<HTMLElement>} The editor root.
 */
const waitForContent = async (container, html) => {
  const root = /** @type {HTMLElement} */ (container.querySelector('.lexical-root'));

  await vi.waitFor(() => {
    expect(root.innerHTML).toContain(html);
  });

  return root;
};

/**
 * Place the caret at the end of the editor content. Focusing the root element alone leaves the
 * caret wherever the browser puts it, which is not necessarily the end.
 * @param {HTMLElement} root Editor root.
 */
const focusEnd = (root) => {
  const range = document.createRange();
  const selection = /** @type {Selection} */ (window.getSelection());

  root.focus();
  range.selectNodeContents(root);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
};

describe('TextEditor', () => {
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

  it('renders the toolbar, the rich text editor and a hidden plain text editor', async () => {
    const screen = await render(TextEditor, { value: '# Hello\n\nSome **bold** text', class: 'x' });
    const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.text-editor'));
    const root = await waitForContent(screen.container, '<strong');

    await expect.element(screen.getByRole('toolbar', { name: 'Text Editor' })).toBeVisible();
    expect(root.getAttribute('role')).toBe('textbox');
    expect(root.getAttribute('aria-multiline')).toBe('true');
    expect(root.contentEditable).toBe('true');
    expect(root.querySelector('h1')?.textContent).toBe('Hello');
    expect(root.querySelector('strong')?.textContent).toBe('bold');
    expect(root.id).toMatch(/-lexical-root$/);

    const textarea = /** @type {HTMLTextAreaElement} */ (wrapper.querySelector('textarea'));

    expect(textarea.closest('.text-area')?.checkVisibility()).toBe(false);
    expect(textarea.value).toBe('# Hello\n\nSome **bold** text');
    // The toolbar buttons control the editor root
    expect(
      screen.getByRole('button', { name: 'Bold' }).element().getAttribute('aria-controls'),
    ).toBe(root.id);
  });

  it('names both text boxes, not the wrapper', async () => {
    const screen = await render(TextEditor, {
      value: 'Hi',
      ariaLabel: 'Body',
      'aria-describedby': 'body-hint',
    });

    const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.text-editor'));
    const root = await waitForContent(screen.container, 'Hi');
    const textarea = /** @type {HTMLTextAreaElement} */ (wrapper.querySelector('textarea'));

    expect(wrapper.hasAttribute('aria-label')).toBe(false);
    expect(root.getAttribute('aria-label')).toBe('Body');
    expect(root.getAttribute('aria-describedby')).toBe('body-hint');
    expect(textarea.getAttribute('aria-label')).toBe('Body');
    expect(textarea.getAttribute('aria-describedby')).toBe('body-hint');

    const byId = await render(TextEditor, { value: 'Hi', 'aria-labelledby': 'body-label' });
    const root2 = /** @type {HTMLElement} */ (byId.container.querySelector('.lexical-root'));

    expect(root2.getAttribute('aria-labelledby')).toBe('body-label');
    expect(root2.hasAttribute('aria-label')).toBe(false);
  });

  it('renders only the enabled buttons', async () => {
    const screen = await render(TextEditor, { buttons: ['bold', 'italic'] });

    await expect.element(screen.getByRole('button', { name: 'Bold' })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Italic' })).toBeVisible();
    expect(document.querySelector('[aria-label="Link"]')).toBeNull();
    // Without any block level button besides the paragraph, there is no text style menu
    expect(document.querySelector('[aria-label="Show Text Style Options"]')).toBeNull();
  });

  it('updates the value as the user types, and follows a value set from outside', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ value: 'Hello' });
    const screen = await render(TextEditor, props);
    const root = await waitForContent(screen.container, 'Hello');

    focusEnd(root);
    await userEvent.keyboard(' world');
    await vi.waitFor(() => {
      expect(props.value).toBe('Hello world');
    });

    props.value = 'Replaced';
    await waitForContent(screen.container, 'Replaced');
  });

  it('switches to the plain text editor and back', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ value: 'Hello' });
    const screen = await render(TextEditor, props);
    const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.text-editor'));
    const toggle = screen.getByRole('button', { name: 'Edit in Markdown' });
    const textarea = /** @type {HTMLTextAreaElement} */ (wrapper.querySelector('textarea'));
    const root = /** @type {HTMLElement} */ (wrapper.querySelector('.lexical-root'));

    await waitForContent(screen.container, 'Hello');
    await expect.element(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect.element(toggle).toHaveAttribute('aria-pressed', 'true');
    await vi.waitFor(() => {
      expect(textarea.checkVisibility()).toBe(true);
      expect(root.checkVisibility()).toBe(false);
    });
    // The formatting buttons only work in rich text mode
    await expect.element(screen.getByRole('button', { name: 'Bold' })).toBeDisabled();

    await screen.getByRole('textbox', { name: '' }).nth(0).fill('Changed **here**');
    await vi.waitFor(() => {
      expect(props.value).toBe('Changed **here**');
    });

    await toggle.click();
    await vi.waitFor(() => {
      expect(root.checkVisibility()).toBe(true);
    });
    await waitForContent(screen.container, '<strong');
  });

  it('starts in plain text mode without the mode toggle when only that mode is enabled', async () => {
    const screen = await render(TextEditor, { value: 'Plain', modes: ['plain-text'] });
    const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.text-editor'));

    expect(document.querySelector('[aria-label="Edit in Markdown"]')).toBeNull();
    await vi.waitFor(() => {
      expect(wrapper.querySelector('textarea')?.checkVisibility()).toBe(true);
    });
    expect(wrapper.querySelector('.lexical-root')?.checkVisibility()).toBe(false);
  });

  it('formats the selection with the toolbar buttons', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ value: 'Hello' });
    const screen = await render(TextEditor, props);
    const root = await waitForContent(screen.container, 'Hello');
    const bold = screen.getByRole('button', { name: 'Bold' });

    root.focus();
    document.execCommand('selectAll');
    await bold.click();
    await vi.waitFor(() => {
      expect(props.value).toBe('**Hello**');
    });
    await expect.element(bold).toHaveAttribute('aria-pressed', 'true');
  });

  it('changes the block type from the text style menu', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ value: 'Hello' });
    const screen = await render(TextEditor, props);
    const root = await waitForContent(screen.container, 'Hello');

    root.focus();
    await screen.getByRole('button', { name: 'Show Text Style Options' }).click();

    const paragraph = screen.getByRole('menuitemcheckbox', { name: /Paragraph/ });

    await expect.element(paragraph).toHaveAttribute('aria-checked', 'true');
    await screen.getByRole('menuitemcheckbox', { name: /Heading 2/ }).click();
    await vi.waitFor(() => {
      expect(props.value).toBe('## Hello');
    });
    await vi.waitFor(() => {
      expect(root.querySelector('h2')).not.toBeNull();
    });
  });

  it('switches the language of a code block from the toolbar', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ value: '```plain\nlet a;\n```' });
    const screen = await render(TextEditor, props);
    const root = await waitForContent(screen.container, 'let a;');

    focusEnd(root);
    await expect.element(screen.getByRole('combobox', { name: 'Language' })).toBeVisible();
    expect(document.querySelector('[aria-label="Bold"]')).toBeNull();
    await screen.getByRole('combobox', { name: 'Language' }).click();
    await screen.getByRole('searchbox', { name: 'Filter Options' }).fill('javascript');
    await screen.getByRole('option', { name: 'JavaScript' }).click();
    await vi.waitFor(() => {
      expect(props.value).toBe('```javascript\nlet a;\n```');
    });
  });

  it('reflects the state props on the editor', async () => {
    const screen = await render(TextEditor, {
      hidden: true,
      disabled: true,
      required: true,
      invalid: true,
      flex: true,
    });

    const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.text-editor'));
    const root = /** @type {HTMLElement} */ (wrapper.querySelector('.lexical-root'));

    expect(wrapper.hidden).toBe(true);
    expect(wrapper.classList.contains('flex')).toBe(true);
    expect(root.getAttribute('aria-disabled')).toBe('true');
    expect(root.getAttribute('aria-required')).toBe('true');
    expect(root.getAttribute('aria-invalid')).toBe('true');
    expect(root.contentEditable).toBe('false');
    await expect
      .element(screen.getByRole('toolbar', { includeHidden: true }))
      .toHaveAttribute('aria-disabled', 'true');
  });

  it('makes the editor read-only', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ value: 'Hello', readonly: true });
    const screen = await render(TextEditor, props);
    const root = await waitForContent(screen.container, 'Hello');

    expect(root.getAttribute('aria-readonly')).toBe('true');
    expect(root.contentEditable).toBe('false');
    props.readonly = false;
    await vi.waitFor(() => {
      expect(root.contentEditable).toBe('true');
    });
  });

  it('suggests emojis while typing a shortcode in the rich text editor', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ value: '' });
    const screen = await render(TextEditor, props);
    const root = /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root'));

    await vi.waitFor(() => {
      expect(root.querySelector('p')).not.toBeNull();
    });
    root.focus();
    await userEvent.keyboard('Hi :tad');
    await expect.element(screen.getByRole('listbox', { name: 'Emoji Suggestions' })).toBeVisible();
    expect(root.getAttribute('aria-autocomplete')).toBe('list');
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => {
      expect(props.value).toMatch(/^Hi 🎉 ?$/u);
    });
    expect(document.querySelector('.emoji-suggestions')).toBeNull();
  });

  it('can do without the emoji autocomplete', async () => {
    const screen = await render(TextEditor, { value: '', useEmojiAutocomplete: false });
    const root = /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root'));

    await vi.waitFor(() => {
      expect(root.querySelector('p')).not.toBeNull();
    });
    expect(root.hasAttribute('aria-autocomplete')).toBe(false);
    root.focus();
    await userEvent.keyboard(':tad');
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    expect(document.querySelector('.emoji-suggestions')).toBeNull();
  });
});
