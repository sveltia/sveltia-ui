import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import CodeEditor from './code-editor.svelte';
import { setCodeHighlighterLoaders } from './shiki/loader.js';

/**
 * @import { ComponentProps } from 'svelte';
 */

/**
 * Wait until the editor has rendered the given text.
 * @param {HTMLElement} container Container.
 * @param {string} text Text to look for.
 * @returns {Promise<HTMLElement>} The editor root.
 */
const waitForContent = async (container, text) => {
  const root = /** @type {HTMLElement} */ (container.querySelector('.lexical-root'));

  await vi.waitFor(() => {
    expect(root.textContent).toContain(text);
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

describe('CodeEditor', () => {
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

  it('renders the code in a single code block', async () => {
    const screen = await render(CodeEditor, { code: 'const a = 1;\nconst b = 2;', class: 'x' });
    const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.code-editor'));
    const root = await waitForContent(screen.container, 'const b = 2;');

    expect(root.classList.contains('code')).toBe(true);
    expect(root.getAttribute('role')).toBe('textbox');
    expect(root.querySelectorAll('code')).toHaveLength(1);
    expect(root.querySelector('code')?.textContent).toContain('const a = 1;');
    // No language switcher by default
    expect(wrapper.querySelector('[role="toolbar"]')).toBeNull();
  });

  it('names the text box, not the wrapper', async () => {
    const screen = await render(CodeEditor, { code: 'x', ariaLabel: 'Snippet' });
    const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.code-editor'));
    const root = await waitForContent(screen.container, 'x');

    expect(wrapper.hasAttribute('aria-label')).toBe(false);
    expect(root.getAttribute('aria-label')).toBe('Snippet');
  });

  it('renders the language switcher on demand', async () => {
    const screen = await render(CodeEditor, {
      code: 'x',
      lang: 'plain',
      showLanguageSwitcher: true,
    });

    await expect.element(screen.getByRole('toolbar', { name: 'Code Editor' })).toBeVisible();

    const select = screen.getByRole('combobox', { name: 'Language' });

    await expect.element(select).toBeVisible();
    expect(select.element().textContent).toContain('Plain Text');
  });

  it('updates the code as the user types, and follows values set from outside', async () => {
    /** @type {ComponentProps<typeof CodeEditor>} */
    const props = $state({ code: 'one', lang: 'plain' });
    const screen = await render(CodeEditor, props);
    const root = await waitForContent(screen.container, 'one');

    focusEnd(root);
    await userEvent.keyboard('{Enter}two');
    await vi.waitFor(() => {
      expect(props.code).toBe('one\ntwo');
    });

    props.code = 'three';
    await waitForContent(screen.container, 'three');
    await vi.waitFor(() => {
      expect(root.textContent).not.toContain('one');
    });
  });

  it('switches the language of the code block', async () => {
    /** @type {ComponentProps<typeof CodeEditor>} */
    const props = $state({ code: 'a', lang: 'plain', showLanguageSwitcher: true });
    const screen = await render(CodeEditor, props);

    await waitForContent(screen.container, 'a');
    await screen.getByRole('combobox', { name: 'Language' }).click();
    // The list is long, so narrow it down with the filter first
    await screen.getByRole('searchbox', { name: 'Filter Options' }).fill('javascript');
    await screen.getByRole('option', { name: 'JavaScript' }).click();
    await vi.waitFor(() => {
      expect(props.lang).toBe('javascript');
    });
    expect(props.code).toBe('a');
    expect(screen.getByRole('combobox', { name: 'Language' }).element().textContent).toContain(
      'JavaScript',
    );
  });

  it('reflects the state props', async () => {
    const screen = await render(CodeEditor, {
      hidden: true,
      disabled: true,
      readonly: true,
      required: true,
      invalid: true,
      flex: true,
      showLanguageSwitcher: true,
    });

    const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.code-editor'));
    const root = /** @type {HTMLElement} */ (wrapper.querySelector('.lexical-root'));

    expect(wrapper.hidden).toBe(true);
    expect(wrapper.classList.contains('flex')).toBe(true);
    expect(root.getAttribute('aria-disabled')).toBe('true');
    expect(root.getAttribute('aria-readonly')).toBe('true');
    expect(root.getAttribute('aria-required')).toBe('true');
    expect(root.getAttribute('aria-invalid')).toBe('true');
    expect(root.contentEditable).toBe('false');
    expect(wrapper.querySelector('[role="toolbar"]')?.getAttribute('aria-disabled')).toBe('true');
    expect(wrapper.querySelector('[role="combobox"]')?.getAttribute('aria-disabled')).toBe('true');
  });
});
