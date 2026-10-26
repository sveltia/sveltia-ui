import { sleep } from '@sveltia/utils/misc';
import {
  $createParagraphNode as createParagraphNode,
  $createTextNode as createTextNode,
  $getRoot as getRoot,
  UNDO_COMMAND,
} from 'lexical';
import { flushSync } from 'svelte';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { setCodeHighlighterLoaders } from './shiki/loader.js';
import TextEditor from './text-editor.svelte';
import { createTestComponent } from '../../test-utils/editor.js';

/**
 * @import { LexicalEditor } from 'lexical';
 * @import { ComponentProps } from 'svelte';
 */

/**
 * Markdown with a paragraph in Arabic, “Hello”, followed by one in English.
 */
const MIXED_TEXT = 'مرحبا\n\nHello'; // cspell:disable-line

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

  it('applies the text direction to both text boxes, not the toolbar', async () => {
    const screen = await render(TextEditor, { value: MIXED_TEXT, dir: 'rtl', lang: 'ar' });
    const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.text-editor'));
    const root = await waitForContent(screen.container, 'Hello');
    const textarea = /** @type {HTMLTextAreaElement} */ (wrapper.querySelector('textarea'));
    const toolbar = screen.getByRole('toolbar', { name: 'Text Editor' }).element();

    /**
     * Get the direction of each paragraph as laid out.
     * @returns {string[]} Directions.
     */
    const getDirections = () =>
      [...root.querySelectorAll('p')].map((p) => getComputedStyle(p).direction);

    await vi.waitFor(() => {
      expect(root.getAttribute('dir')).toBe('rtl');
    });
    expect(textarea.getAttribute('dir')).toBe('rtl');
    // Every paragraph follows the editor, including a new one, like the lines of a text area
    expect(getDirections()).toEqual(['rtl', 'rtl']);
    focusEnd(root);
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => {
      expect(getDirections()).toEqual(['rtl', 'rtl', 'rtl']);
    });

    // The toolbar is part of the user interface, so it keeps the interface’s direction
    expect(getComputedStyle(toolbar).direction).toBe('ltr');
    // The language goes on the wrapper, which both text boxes inherit it from
    expect(wrapper.getAttribute('lang')).toBe('ar');
  });

  it('lets each paragraph take the direction of its own text by default', async () => {
    const screen = await render(TextEditor, { value: MIXED_TEXT });
    const root = await waitForContent(screen.container, 'Hello');

    expect(root.hasAttribute('dir')).toBe(false);
    expect([...root.querySelectorAll('p')].map((p) => p.getAttribute('dir'))).toEqual([
      'auto',
      'auto',
    ]);
    expect([...root.querySelectorAll('p')].map((p) => getComputedStyle(p).direction)).toEqual([
      'rtl',
      'ltr',
    ]);
  });

  it('follows a change to the direction', async () => {
    const screen = await render(TextEditor, { value: 'Hello', dir: 'rtl' });
    const root = await waitForContent(screen.container, 'Hello');

    await vi.waitFor(() => {
      expect(root.getAttribute('dir')).toBe('rtl');
    });

    await screen.rerender({ dir: 'auto' });
    await vi.waitFor(() => {
      expect(root.hasAttribute('dir')).toBe(false);
    });
    expect(root.querySelector('p')?.getAttribute('dir')).toBe('auto');
  });

  it('only sets the automatic direction on the text area once the plain text mode is shown', async () => {
    const screen = await render(TextEditor, {
      value: MIXED_TEXT,
      dir: 'auto',
      modes: ['rich-text', 'plain-text'],
    });

    const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.text-editor'));
    const textarea = /** @type {HTMLTextAreaElement} */ (wrapper.querySelector('textarea'));

    await waitForContent(screen.container, 'Hello');
    // The hidden text area gets the value on every change, which `auto` would make slow
    expect(textarea.dir).toBe('');

    await screen.getByRole('button', { name: 'Edit in Markdown' }).click();
    await vi.waitFor(() => {
      expect(textarea.checkVisibility()).toBe(true);
    });
    expect(textarea.getAttribute('dir')).toBe('auto');
    expect(getComputedStyle(textarea).direction).toBe('rtl');
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

  it('keeps a value set from outside as is until the user changes the content', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ value: '*Hello*' });
    const screen = await render(TextEditor, props);
    const root = await waitForContent(screen.container, '<em');

    // The editor writes italics as `_Hello_`, which is only a matter of style, so give it time to
    // convert the content, and check the value is left alone
    await sleep(300);
    expect(props.value).toBe('*Hello*');

    props.value = '__Bye__';
    await waitForContent(screen.container, '<strong');
    await sleep(300);
    expect(props.value).toBe('__Bye__');

    // Once the user changes the content, the value is written in the editor’s style
    focusEnd(root);
    await userEvent.keyboard('!');
    await vi.waitFor(() => {
      expect(props.value).toBe('**Bye!**');
    });

    // Undoing the change brings the value back as it was given
    await userEvent.keyboard('{Backspace}');
    await vi.waitFor(() => {
      expect(props.value).toBe('__Bye__');
    });
  });

  it('keeps the content when undoing right after the editor loads', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ value: 'Hello' });
    const screen = await render(TextEditor, props);
    const root = await waitForContent(screen.container, 'Hello');
    const editor = /** @type {LexicalEditor} */ (/** @type {any} */ (root).__lexicalEditor);

    // Nothing to undo, as the loaded content is the initial state rather than a change
    editor.dispatchCommand(UNDO_COMMAND, undefined);
    await sleep(300);
    expect(root.textContent).toBe('Hello');
    expect(props.value).toBe('Hello');
  });

  it('does not try to restore the empty initial state when undoing', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      /** @type {ComponentProps<typeof TextEditor>} */
      const props = $state({ value: '' });
      const screen = await render(TextEditor, props);
      const root = await waitForContent(screen.container, '<p');

      focusEnd(root);
      await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');
      await sleep(300);

      // Undo past the first change made by the user
      await userEvent.keyboard('a');
      await vi.waitFor(() => {
        expect(props.value).toBe('a');
      });
      await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');
      await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');
      await vi.waitFor(() => {
        expect(props.value).toBe('');
      });
      expect(root.innerHTML).toContain('<p');
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });

  it('clears the pending state when the editor is removed before converting a change', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ value: 'Hello', pending: false });
    const screen = await render(TextEditor, props);
    const root = await waitForContent(screen.container, 'Hello');
    const editor = /** @type {LexicalEditor} */ (/** @type {any} */ (root).__lexicalEditor);

    // Make the change and check it in one go, as it’s converted, and no longer pending, only 100ms
    // later, which a slow keystroke can miss
    editor.update(
      () => {
        getRoot().selectEnd().insertText('!');
      },
      { discrete: true },
    );
    flushSync();
    expect(props.pending).toBe(true);
    screen.unmount();
    expect(props.pending).toBe(false);
  });

  it('keeps a code block without a language as is', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ value: '```\ncode\n```\n\n*Hello*' });
    const screen = await render(TextEditor, props);

    // The editor gives the code block a default language as it loads it, which isn’t a change
    await waitForContent(screen.container, '<em');
    await sleep(300);
    expect(props.value).toBe('```\ncode\n```\n\n*Hello*');
  });

  it('reports a change made by the user as pending until the value is updated', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ value: 'Hello', pending: false });
    const screen = await render(TextEditor, props);
    const root = await waitForContent(screen.container, 'Hello');
    /** @type {boolean[]} */
    const states = [];

    // Sample the state often enough to catch the 100 ms or so the conversion takes
    const timer = setInterval(() => {
      states.push(/** @type {boolean} */ (props.pending));
    }, 5);

    // Loading a value set from outside isn’t a change
    props.value = 'Hi';
    await waitForContent(screen.container, 'Hi');
    await sleep(300);
    expect(states).not.toContain(true);

    focusEnd(root);
    await userEvent.keyboard('!');
    await vi.waitFor(() => {
      expect(props.value).toBe('Hi!');
    });
    // The value is updated in the same flush the pending state is cleared in
    expect(states).toContain(true);
    expect(props.pending).toBe(false);
    clearInterval(timer);
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
    // The formatting buttons edit the Markdown in plain text mode
    textarea.focus();
    textarea.select();
    await screen.getByRole('button', { name: 'Bold' }).click();
    await vi.waitFor(() => {
      expect(props.value).toBe('**Hello**');
    });

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

  it('follows the block type of the caret line in plain text mode', async () => {
    const screen = await render(TextEditor, {
      value: '# Title\n\n```js\ncode\n```',
      modes: ['plain-text', 'rich-text'],
    });

    const textarea = /** @type {HTMLTextAreaElement} */ (
      screen.container.querySelector('textarea')
    );

    const menuButton = screen.getByRole('button', { name: 'Show Text Style Options' });
    /**
     * Get the icon name of the block type menu button.
     * @returns {string | undefined} Icon name.
     */
    const getIcon = () => menuButton.element().querySelector('.icon')?.textContent?.trim();

    // The caret of an unfocused `<textarea>` is not where the user expects, so it’s not followed
    await vi.waitFor(() => {
      expect(getIcon()).toBe('format_paragraph');
    });

    textarea.focus();
    textarea.setSelectionRange(3, 3);
    await vi.waitFor(() => {
      expect(getIcon()).toBe('format_h1');
    });

    // The language switcher only works in rich text mode, so the formatting buttons stay
    textarea.setSelectionRange(15, 15);
    textarea.dispatchEvent(new Event('select'));
    await vi.waitFor(() => {
      expect(getIcon()).toBe('code_blocks');
    });
    await expect.element(screen.getByRole('button', { name: 'Bold' })).toBeVisible();
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

describe('TextEditor Markdown round trip', () => {
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

  /**
   * Render the editor with the given Markdown and wait for it to load the content.
   * @param {string} markdown Markdown.
   * @returns {Promise<{ props: ComponentProps<typeof TextEditor>, editor: LexicalEditor }>} Bound
   * props and the Lexical editor.
   */
  const loadEditor = async (markdown) => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ value: markdown });
    const screen = await render(TextEditor, props);
    const root = await waitForContent(screen.container, '<');
    const editor = /** @type {LexicalEditor} */ (/** @type {any} */ (root).__lexicalEditor);

    // Give the editor time to load the content
    await sleep(300);

    return { props, editor };
  };

  /**
   * Load the given Markdown, add a paragraph at the end, as the user would, so the editor exports
   * its content, and get the exported Markdown without the new paragraph.
   * @param {string} markdown Markdown.
   * @returns {Promise<string>} Exported Markdown.
   */
  const roundTrip = async (markdown) => {
    const { props, editor } = await loadEditor(markdown);

    editor.update(() => {
      getRoot().append(createParagraphNode().append(createTextNode('Added')));
    });
    await vi.waitFor(() => {
      expect(props.value).toMatch(/\n\nAdded$/);
    });

    return /** @type {string} */ (props.value).replace(/\n\nAdded$/, '');
  };

  it('keeps the backslashes in code and the needed escapes in text', async () => {
    const markdown = [
      '```js\nconst re = /\\\\d+/;\n```',
      'Match `\\\\` and `\\_` in text',
      '\\_not italic\\_ and \\\\\\* and a line break\\\\',
      'Next',
    ].join('\n\n');

    expect(await roundTrip(markdown)).toBe(markdown);
  });

  it('still removes the escapes that are not needed', async () => {
    expect(await roundTrip('snake\\_case and C:\\\\Users')).toBe('snake_case and C:\\Users');
  });

  it('leaves the formatting syntax in a code block alone', async () => {
    const markdown = '```md\nSome _italic\ntext_ here\n```\n\n```py\nx = 2 **a\nb** 3\n```';

    expect(await roundTrip(markdown)).toBe(markdown);
  });

  it('imports a code block fenced with tildes', async () => {
    expect(await roundTrip('~~~py\n# Comment\nx = **1**\n```\n~~~')).toBe(
      '````py\n# Comment\nx = **1**\n```\n````',
    );
  });

  it('keeps the info string of a code block', async () => {
    expect(await roundTrip('~~~js `x`\ncode\n~~~\n\n``` js title=x\ncode\n```')).toBe(
      '~~~js `x`\ncode\n~~~\n\n```js title=x\ncode\n```',
    );
    expect(await roundTrip('```js title=x\ncode')).toBe('```js title=x\ncode\n```');
  });

  it('keeps formatting across a line break at the start and the end of the value', async () => {
    expect(await roundTrip('**a\nb** c\n\nd _e\nf_')).toBe('**a**\n**b** c\n\nd _e_\n_f_');
  });

  it('keeps a code span made only of spaces and the formats around a link', async () => {
    expect(await roundTrip('` ` and `  `\n\n**_a_ [b](u)**')).toBe(
      '` ` and `  `\n\n**_a_** **[b](u)**',
    );
  });

  it('keeps the formats around inline code made only of spaces', async () => {
    expect(await roundTrip('**` `** _` `_ ~~` `~~\n\n**` `a** **a` `** **[` `](u)**')).toBe(
      '**` `** _` `_ ~~` `~~\n\n**` `a** **a` `** **[` `](u)**',
    );
  });

  it('keeps italic text before a backslash hard line break', async () => {
    expect(await roundTrip('_a_\\\nb __c__\\\nd\n\n*e*\\\nf\n\n_g\\\nh_')).toBe(
      '_a_\\\nb **c**\\\nd\n\n_e_\\\nf\n\n_g_\\\n_h_',
    );
  });

  it('keeps an escaped backslash at the end of a line', async () => {
    expect(await roundTrip('a\\\\\nb\n\n_c\\\\\nd_\n\n`e\\`\nf\n\ng\\\\\\\nh')).toBe(
      'a\\\\\nb\n\n_c\\\\_\n_d_\n\n`e\\`\nf\n\ng\\\\\\\nh',
    );
  });

  it('keeps double underscores, bold italic and bold within a word across a line break', async () => {
    expect(await roundTrip('__a\nb__ ***c\nd*** **e\nf**g __h\ni__j')).toBe(
      '**a**\n**b** **_c_**\n**_d_** **e**\n**f**g \\_\\_h\ni__j',
    );
  });

  it('keeps the tabs in a code span and a paragraph of whitespace code', async () => {
    const markdown = '`\t` a `\ta` `a\tb\t` **`\t`**\n\n`\t`\n\n` `\n\n**`  `**\n\nb\tc';

    expect(await roundTrip(markdown)).toBe(markdown);
  });

  it('keeps the formatting around a code span after other formatting or a link', async () => {
    const markdown = '**a** **`b`** [**c**](u)**`d`** _e_ _`f`_ ~~g~~ ~~`h`~~ `i` **j** **`k`**';

    expect(await roundTrip(markdown)).toBe(markdown);
    // Lexical puts the formats of a link with code next to it in the link text
    expect(await roundTrip('**[a](u)`b`**')).toBe('[**a**](u)**`b`**');
  });

  it('reads a formatting marker next to a backslash as CommonMark does', async () => {
    expect(await roundTrip('_a_\\x __b__\\y ~~c.~~\\z d \\\\_e_ f_\\_g [h](/i_\\j "k_\\l")')).toBe(
      '_a_\\x **b**\\y ~~c.~~\\z d \\\\_e_ f__g [h](/i_\\\\j "k_\\\\l")',
    );
  });

  it('keeps formatting across two or more line breaks', async () => {
    expect(await roundTrip('**a\nb\nc** _d\ne\\\nf_ ~~g\nh\ni~~')).toBe(
      '**a**\n**b**\n**c** _d_\n_e_\\\n_f_ ~~g~~\n~~h~~\n~~i~~',
    );
  });

  it('imports setext headings', async () => {
    expect(await roundTrip('Title\n=====\n\nSub\n---\n\nText\n\n---\n\nMore')).toBe(
      '# Title\n\n## Sub\n\nText\n\n***\n\nMore',
    );
  });

  it('keeps an escaped pipe in a table cell', async () => {
    const markdown = '| a | b |\n| --- | --- |\n| x \\| y | `c \\| d` |';

    expect(await roundTrip(markdown)).toBe(markdown);
  });

  it('keeps the backslashes in inline code in a table cell', async () => {
    const markdown = [
      '| Artifact | Location |',
      '| --- | --- |',
      '| MFT | `C:\\$MFT` |',
      '| Hive | `C:\\Users\\<name>\\Profile.DAT` |',
      '| Prefetch | `C:\\Windows\\Prefetch` |',
    ].join('\n');

    expect(await roundTrip(markdown)).toBe(markdown);
  });

  it('keeps the backslashes in inline code at the start of a paragraph', async () => {
    const markdown = [
      '`C:\\$MFT`',
      '**`a\\<b`**',
      '`` a\\` ``',
      '`C:\\$MFT` and `\\<`',
      'Text and `C:\\$MFT`',
    ].join('\n\n');

    expect(await roundTrip(markdown)).toBe(markdown);
  });

  it('removes the indentation of a top-level list instead of making it a code block', async () => {
    const markdown = [
      'Asterisk bullets:',
      '  * one\n  * two',
      'Dash bullets:',
      '   - three\n   - four',
      'Numbered list:',
      ' 1. five\n 2. six',
    ].join('\n\n');

    expect(await roundTrip(markdown)).toBe(
      [
        'Asterisk bullets:',
        '* one\n* two',
        'Dash bullets:',
        '- three\n- four',
        'Numbered list:',
        '1. five\n2. six',
      ].join('\n\n'),
    );
  });

  it('nests a list item indented to the content of the item above it', async () => {
    expect(await roundTrip('- a\n  - b\n    - c\n- d')).toBe('- a\n    - b\n        - c\n- d');
    expect(await roundTrip('  - a\n    - b')).toBe('- a\n    - b');
    expect(await roundTrip('1. a\n   - b\n2. c')).toBe('1. a\n    - b\n2. c');
    expect(await roundTrip('- foo\n\n  - bar\n\n  - baz\n    - boo')).toBe(
      '- foo\n    - bar\n    - baz\n        - boo',
    );
  });

  it('uses asterisks for italic text within a word', async () => {
    expect(await roundTrip('a*b*c and *d*')).toBe('a*b*c and _d_');
  });

  it('keeps the spaces around formatted text outside its delimiters', async () => {
    const { props, editor } = await loadEditor('Text');

    // Lexical used to encode the spaces as `&#32;` within the delimiters
    editor.update(() => {
      getRoot()
        .clear()
        .append(
          createParagraphNode().append(
            createTextNode('The main hall of '),
            createTextNode('City Hall ').toggleFormat('bold'),
            createTextNode('Utrecht, '),
            createTextNode('a ').toggleFormat('italic'),
            createTextNode('b ').toggleFormat('italic').toggleFormat('bold'),
            createTextNode('c').toggleFormat('italic'),
          ),
        );
    });
    await vi.waitFor(() => {
      expect(props.value).toBe('The main hall of **City Hall** Utrecht, _a **b** c_');
    });
  });

  it('keeps raw HTML as is', async () => {
    const markdown = [
      '<iframe src="https://example.com/embed/_abc123" title="Video"></iframe>',
      'An image: <img src="/_images/my_image.png" alt="x" />',
      '<table><tbody><tr><td>Total*</td><td>~10 g</td></tr></tbody></table>',
      '<div>Total* ~10 g</div>',
      '<div>\n\t<p>*not* \\_italic_</p>\n- not a list\n</div>',
      '<span title="a\\*b">x</span> and _y_ <b>**z**</b> `<i>_</i>` <i>a_b\\*</i>',
      '<script>\nconst a = b_c * d;\n\nconst e = `**`;\n</script>\nAfter _script_',
      '<!-- a_b *c* -->',
      'Text\n<div>a_b *c*</div>',
      '<div>\n[a](u) x_*y\n</div>',
      '| <i title="/_x*">a</i> | c |\n| --- | --- |\n| d | e |',
    ].join('\n\n');

    expect(await roundTrip(markdown)).toBe(markdown);
  });

  it('reads emphasis after Unicode punctuation', async () => {
    const markdown = [
      'See –**[here](https://example.com)** now.',
      'See –**_[here](https://example.com)_** now.',
      'See “**[here](https://example.com)**” now.',
    ].join('\n\n');

    expect(await roundTrip(markdown)).toBe(markdown);
  });

  it('keeps a table with an empty header row', async () => {
    const markdown = 'Text\n\n|  |  |\n| --- | --- |\n| a | b |\n| c | d |\n\nEnd';

    expect(await roundTrip(markdown)).toBe(markdown);
  });
});

describe('TextEditor with tables', () => {
  const TABLE = ['| Name | Role |', '| --- | --- |', '| Alice | Editor |'].join('\n');

  /**
   * Place the caret in the table cell with the given text.
   * @param {HTMLElement} root Editor root.
   * @param {string} text Text of the cell.
   */
  const placeCaretInCell = (root, text) => {
    const cell = /** @type {HTMLElement} */ (
      [...root.querySelectorAll('th, td')].find((element) => element.textContent === text)
    );

    const range = document.createRange();
    const selection = /** @type {Selection} */ (window.getSelection());

    root.focus();
    range.selectNodeContents(cell);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  it('shows the menu button on the table cell with the caret', async () => {
    const screen = await render(TextEditor, { buttons: ['bold', 'table'], value: TABLE });
    const root = await waitForContent(screen.container, '<table>');

    placeCaretInCell(root, 'Alice');
    await expect
      .element(screen.getByRole('button', { name: 'Show Table Options' }).first())
      .toBeVisible();
    // The toolbar has one as well, once the selection has been reported
    await vi.waitFor(() => {
      expect(screen.container.querySelectorAll('[aria-label="Show Table Options"]')).toHaveLength(
        2,
      );
    });
  });

  it.each([['disabled'], ['readonly']])('has no menu button on the cell while %s', async (prop) => {
    const screen = await render(TextEditor, {
      buttons: ['bold', 'table'],
      value: TABLE,
      [prop]: true,
    });

    await waitForContent(screen.container, '<table>');
    expect(screen.container.querySelector('.table-cell-menu-button')).toBeNull();
  });

  it('has no menu button on the cell without the table button', async () => {
    const screen = await render(TextEditor, { buttons: ['bold'], value: TABLE });

    await waitForContent(screen.container, '<table');
    expect(screen.container.querySelector('.table-cell-menu-button')).toBeNull();
  });

  it('adds a paragraph after a table at the end, without changing the value', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ buttons: ['bold', 'table'], value: TABLE });
    const screen = await render(TextEditor, props);
    const root = await waitForContent(screen.container, '<table>');

    await vi.waitFor(() => {
      expect(root.lastElementChild?.localName).toBe('p');
    });
    await sleep(200);
    expect(props.value).toBe(TABLE);
  });

  it('keeps the header row on top of a Markdown table after inserting a row above it', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ buttons: ['bold', 'table'], value: TABLE });
    const screen = await render(TextEditor, props);
    const root = await waitForContent(screen.container, '<table>');

    placeCaretInCell(root, 'Name');
    await screen.getByRole('button', { name: 'Show Table Options' }).first().click();
    await screen.getByRole('menuitem', { name: 'Insert Row Above' }).click();

    await vi.waitFor(() => {
      expect(props.value).toBe(
        ['|  |  |', '| --- | --- |', '| Name | Role |', '| Alice | Editor |'].join('\n'),
      );
    });
    expect(root.querySelectorAll('tr:first-child > th')).toHaveLength(2);
    expect(root.querySelectorAll('th')).toHaveLength(2);
  });

  describe('with editor components', () => {
    const badge = createTestComponent({
      id: 'badge',
      label: 'Badge',
      markdown: '[badge]',
      inline: true,
      pattern: /\[badge\]/,
    });

    const figure = createTestComponent({ id: 'figure', label: 'Figure', markdown: '<figure>' });

    it('imports and exports an inline component in a Markdown table cell', async () => {
      const value = ['| Name | Role |', '| --- | --- |', '| Alice [badge] | Editor |'].join('\n');
      /** @type {ComponentProps<typeof TextEditor>} */
      const props = $state({ buttons: ['bold', 'table'], components: [badge], value });
      const screen = await render(TextEditor, props);
      const root = await waitForContent(screen.container, '<table>');

      await vi.waitFor(() => {
        expect(root.querySelector('td [data-lexical-decorator]')?.textContent).toBe('Badge');
      });
      await sleep(200);
      expect(props.value).toBe(value);
    });

    it('inserts only an inline component into a Markdown table cell', async () => {
      /** @type {ComponentProps<typeof TextEditor>} */
      const props = $state({
        buttons: ['bold', 'table'],
        components: [badge, figure],
        value: TABLE,
      });

      const screen = await render(TextEditor, props);
      const root = await waitForContent(screen.container, '<table>');

      placeCaretInCell(root, 'Alice');
      await vi.waitFor(() => {
        expect(screen.container.querySelectorAll('[aria-label="Show Table Options"]')).toHaveLength(
          2,
        );
      });
      await screen.getByRole('button', { name: 'Insert', exact: true }).click();
      await expect.element(screen.getByRole('menuitem', { name: 'Badge' })).toBeVisible();
      // The block component is left out
      expect(
        screen
          .getByRole('menuitem')
          .all()
          .map((item) => item.element().textContent?.trim()),
      ).toEqual(['Badge']);
      await screen.getByRole('menuitem', { name: 'Badge' }).click();
      // The node is inserted within the cell, without a paragraph after it
      await vi.waitFor(() => {
        expect(props.value).toBe(
          ['| Name | Role |', '| --- | --- |', '| Alice[badge] | Editor |'].join('\n'),
        );
      });
      expect(root.querySelectorAll('td p')).toHaveLength(2);
    });
  });

  it('exports an HTML table without the scrolling wrapper', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({
      buttons: ['bold', 'table'],
      format: 'html',
      value: '<table><tr><th>Name</th></tr><tr><td>Alice</td></tr></table>',
    });

    const screen = await render(TextEditor, props);
    const root = await waitForContent(screen.container, '<table');

    expect(root.querySelector('.table-wrapper')).not.toBeNull();
    placeCaretInCell(root, 'Alice');
    await userEvent.keyboard('!');
    await vi.waitFor(() => {
      // The HTML parser adds the `<tbody>` element
      expect(props.value).toBe(
        '<table><tbody><tr><th>Name</th></tr><tr><td>Alice!</td></tr></tbody></table>',
      );
    });
  });
});

describe('TextEditor with horizontal rules', () => {
  it('selects a rule with a click, which can then be deleted', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({
      buttons: ['bold', 'horizontal-rule'],
      value: 'Before\n\n***\n\nAfter',
    });

    const screen = await render(TextEditor, props);
    const root = await waitForContent(screen.container, '<hr');
    const rule = /** @type {HTMLElement} */ (root.querySelector('hr'));

    await userEvent.click(rule);
    await vi.waitFor(() => {
      expect(rule.classList.contains('selected')).toBe(true);
    });

    await userEvent.keyboard('{Backspace}');
    await vi.waitFor(() => {
      expect(props.value).toBe('Before\n\nAfter');
    });
  });
});

describe('TextEditor single line', () => {
  const badge = createTestComponent({
    id: 'badge',
    label: 'Badge',
    markdown: '[badge]',
    inline: true,
    pattern: /\[badge\]/,
  });

  const figure = createTestComponent({ id: 'figure', label: 'Figure', markdown: '<figure>' });

  it('only offers inline buttons and components', async () => {
    const screen = await render(TextEditor, {
      multiline: false,
      components: [badge, figure],
      ariaLabel: 'Title',
    });

    const root = await waitForContent(screen.container, '<p');

    expect(root.getAttribute('aria-multiline')).toBe('false');
    await expect.element(screen.getByRole('button', { name: 'Bold' })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Link' })).toBeVisible();
    expect(document.querySelector('[aria-label="Show Text Style Options"]')).toBeNull();
    expect(document.querySelector('[aria-label="Bulleted List"]')).toBeNull();

    await screen.getByRole('button', { name: 'Insert' }).click();
    await expect.element(screen.getByRole('menuitem', { name: 'Badge' })).toBeVisible();
    expect(document.querySelector('[role="menuitem"][aria-label="Figure"]')).toBeNull();
  });

  it('keeps the content on a single line as the user types and pastes', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ value: 'One', multiline: false });
    const screen = await render(TextEditor, props);
    const root = await waitForContent(screen.container, 'One');

    focusEnd(root);
    await userEvent.keyboard('{Enter}{Shift>}{Enter}{/Shift} two');
    await vi.waitFor(() => {
      expect(props.value).toBe('One two');
    });

    const clipboardData = new DataTransfer();

    clipboardData.setData('text/plain', ' three\n\nfour\nfive');
    root.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true }));
    await vi.waitFor(() => {
      expect(props.value).toBe('One two three four five');
    });

    // The first pasted paragraph goes right after the caret, like pasted text
    await userEvent.keyboard(' ');

    const htmlData = new DataTransfer();

    htmlData.setData('text/html', '<p>six</p><h2>seven</h2><ul><li>eight</li></ul>');
    root.dispatchEvent(new ClipboardEvent('paste', { clipboardData: htmlData, bubbles: true }));
    await vi.waitFor(() => {
      expect(props.value).toBe('One two three four five six seven eight');
    });
    expect(root.querySelectorAll('p')).toHaveLength(1);
  });

  it('keeps a value with several paragraphs until the user changes the content', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ value: 'One\n\nTwo', multiline: false });
    const screen = await render(TextEditor, props);
    const root = await waitForContent(screen.container, 'One Two');

    await sleep(300);
    expect(props.value).toBe('One\n\nTwo');

    focusEnd(root);
    await userEvent.keyboard('!');
    await vi.waitFor(() => {
      expect(props.value).toBe('One Two!');
    });
  });

  it('keeps the Markdown source on a single line', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ value: 'One', multiline: false, modes: ['plain-text', 'rich-text'] });
    const screen = await render(TextEditor, props);

    const textarea = /** @type {HTMLTextAreaElement} */ (
      screen.container.querySelector('textarea')
    );

    await vi.waitFor(() => {
      expect(textarea.checkVisibility()).toBe(true);
    });

    expect(textarea.getAttribute('aria-multiline')).toBe('false');
    textarea.focus();
    textarea.setSelectionRange(3, 3);
    await userEvent.keyboard('{Enter}{Shift>}{Enter}{/Shift} two');
    await vi.waitFor(() => {
      expect(props.value).toBe('One two');
    });

    // Pasted text goes through the same `input` event
    document.execCommand('insertText', false, ' three\n\nfour');
    await vi.waitFor(() => {
      expect(props.value).toBe('One two three four');
    });
    expect(textarea.selectionStart).toBe('One two three four'.length);
  });

  it('keeps a paste into the Markdown source in the undo history', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ value: 'One', multiline: false, modes: ['plain-text', 'rich-text'] });
    const screen = await render(TextEditor, props);

    const textarea = /** @type {HTMLTextAreaElement} */ (
      screen.container.querySelector('textarea')
    );

    const source = document.createElement('textarea');

    document.body.append(source);
    source.value = ' two\n\nthree';
    source.select();
    await userEvent.copy();
    source.remove();

    textarea.focus();
    textarea.setSelectionRange(3, 3);
    await userEvent.paste();
    await vi.waitFor(() => {
      expect(props.value).toBe('One two three');
    });

    await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');
    await vi.waitFor(() => {
      expect(props.value).toBe('One');
    });
  });

  it('has no plain text mode for HTML', async () => {
    const screen = await render(TextEditor, {
      multiline: false,
      format: 'html',
      value: '<p>One</p>',
    });

    await waitForContent(screen.container, 'One');
    expect(document.querySelector('[aria-label="Edit in HTML"]')).toBeNull();

    // A multiline editor has one
    await render(TextEditor, { format: 'html', value: '<p>Two</p>' });
    await expect.element(page.getByRole('button', { name: 'Edit in HTML' })).toBeVisible();
  });
});

describe('TextEditor minimal', () => {
  const LONG_VALUE = Array.from({ length: 30 }, (_, index) => `Paragraph ${index + 1}.`).join(
    '\n\n',
  );

  it('starts with the height of a single line', async () => {
    const screen = await render(TextEditor, { minimal: true, value: 'One' });
    const root = await waitForContent(screen.container, 'One');
    const style = getComputedStyle(root);

    expect(screen.container.querySelector('.sui.text-editor')?.classList.contains('minimal')).toBe(
      true,
    );
    expect(root.getBoundingClientRect().height).toBeCloseTo(
      parseFloat(style.lineHeight) +
        parseFloat(style.paddingTop) +
        parseFloat(style.paddingBottom) +
        parseFloat(style.borderTopWidth) +
        parseFloat(style.borderBottomWidth),
      0,
    );
  });

  it('limits the height, scrolling the content', async () => {
    const screen = await render(TextEditor, { minimal: true, value: LONG_VALUE });
    const root = await waitForContent(screen.container, 'Paragraph 30.');

    expect(root.getBoundingClientRect().height).toBeLessThanOrEqual(240);
    expect(root.scrollHeight).toBeGreaterThan(root.clientHeight);
  });

  it('limits the height of the plain text mode too', async () => {
    const screen = await render(TextEditor, {
      minimal: true,
      value: LONG_VALUE,
      modes: ['plain-text', 'rich-text'],
    });

    const textarea = /** @type {HTMLTextAreaElement} */ (
      screen.container.querySelector('textarea')
    );

    await vi.waitFor(() => {
      expect(textarea.checkVisibility()).toBe(true);
    });
    expect(textarea.getBoundingClientRect().height).toBeLessThanOrEqual(240);
    expect(
      /** @type {HTMLElement} */ (
        screen.container.querySelector('.text-area')
      ).getBoundingClientRect().height,
    ).toBeLessThanOrEqual(240);
    expect(textarea.scrollHeight).toBeGreaterThan(textarea.clientHeight);
  });

  it('leaves the boxes of a nested editor alone', async () => {
    const screen = await render(TextEditor, { minimal: true, value: 'One' });
    const root = await waitForContent(screen.container, 'One');
    const editor = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.text-editor'));
    // Stand in for an editor nested in an editor component, with the same classes
    const holder = document.createElement('div');

    holder.innerHTML =
      '<div class="lexical-root"></div><div class="sui text-area"><textarea></textarea></div>';
    editor.append(holder);

    expect(getComputedStyle(root).maxHeight).toBe('240px');
    expect(getComputedStyle(root).getPropertyValue('--sui-text-editor-inner-toolbar-top')).toBe(
      '0px',
    );

    holder.querySelectorAll('.lexical-root, textarea').forEach((element) => {
      expect(getComputedStyle(element).maxHeight).toBe('none');
    });

    holder.remove();
  });

  it('grows with its content by default', async () => {
    const screen = await render(TextEditor, { value: LONG_VALUE });
    const root = await waitForContent(screen.container, 'Paragraph 30.');

    expect(root.getBoundingClientRect().height).toBeGreaterThan(240);
  });
});
