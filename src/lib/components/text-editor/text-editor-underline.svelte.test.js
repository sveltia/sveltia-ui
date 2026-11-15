import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import TextEditor from './text-editor.svelte';
import { createPasteEvent } from '../../test-utils/editor.js';

/**
 * @import { ComponentProps } from 'svelte';
 */

/**
 * Render the editor, wait for its content and select all of it.
 * @param {ComponentProps<typeof TextEditor>} props Props.
 * @returns {Promise<Awaited<ReturnType<typeof render<typeof TextEditor>>>>} Rendered editor.
 */
const renderAndSelectAll = async (props) => {
  const screen = await render(TextEditor, props);
  const root = /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root'));

  await vi.waitFor(() => {
    expect(root.textContent).toBe('Hello');
  });

  root.focus();
  await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}');

  return screen;
};

describe('TextEditor underline', () => {
  it('underlines the selection with the button or the shortcut in HTML', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({
      format: 'html',
      value: '<p>Hello</p>',
      buttons: ['bold', 'underline'],
    });

    const screen = await renderAndSelectAll(props);
    const button = screen.getByRole('button', { name: 'Underline' });

    await expect.element(button).toHaveAttribute('aria-pressed', 'false');
    await button.click();
    await vi.waitFor(() => {
      expect(props.value).toBe('<p><u>Hello</u></p>');
    });
    await expect.element(button).toHaveAttribute('aria-pressed', 'true');
    expect(
      getComputedStyle(
        /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root .underline')),
      ).textDecorationLine,
    ).toBe('underline');

    await userEvent.keyboard('{ControlOrMeta>}u{/ControlOrMeta}');
    await vi.waitFor(() => {
      expect(props.value).toBe('<p>Hello</p>');
    });
  });

  it('shows both lines for underlined text that is struck through', async () => {
    const screen = await render(TextEditor, {
      format: 'html',
      value: '<p><s><u>Hello</u></s></p>',
      buttons: ['underline', 'strikethrough'],
    });

    await vi.waitFor(() => {
      const text = /** @type {HTMLElement} */ (
        screen.container.querySelector('.lexical-root .underline.strikethrough')
      );

      expect(getComputedStyle(text).textDecorationLine).toBe('underline line-through');
    });
  });

  it.each(
    /** @type {const} */ ([
      ['without the button in HTML', 'html', '<p>Hello</p>', ['bold']],
      ['in Markdown, even with the button', 'markdown', 'Hello', ['bold', 'underline']],
    ]),
  )('ignores the shortcut and hides the button %s', async (_name, format, value, buttons) => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ format, value, buttons: [...buttons] });
    const screen = await renderAndSelectAll(props);

    await expect.element(screen.getByRole('button', { name: 'Bold' })).toBeVisible();
    expect(document.querySelector('[aria-label="Underline"]')).toBeNull();
    await userEvent.keyboard('{ControlOrMeta>}u{/ControlOrMeta}');
    // Bold still works, so the value changes, without an underline
    await userEvent.keyboard('{ControlOrMeta>}b{/ControlOrMeta}');
    await vi.waitFor(() => {
      expect(props.value).toBe(format === 'html' ? '<p><strong>Hello</strong></p>' : '**Hello**');
    });
    expect(screen.container.querySelector('.lexical-root .underline')).toBeNull();
  });

  it.each([
    ['all of it', '<p><u>Hello</u></p>'],
    ['part of it, after plain text', '<p>He<u>llo</u></p>'],
  ])(
    'still removes an existing underline with the shortcut without the button, selecting %s',
    async (_name, value) => {
      /** @type {ComponentProps<typeof TextEditor>} */
      const props = $state({ format: 'html', value, buttons: ['bold'] });

      await renderAndSelectAll(props);
      await userEvent.keyboard('{ControlOrMeta>}u{/ControlOrMeta}');
      await vi.waitFor(() => {
        expect(props.value).toBe('<p>Hello</p>');
      });
      // Pressing it again doesn’t bring it back
      await userEvent.keyboard('{ControlOrMeta>}u{/ControlOrMeta}');
      await userEvent.keyboard('{ControlOrMeta>}b{/ControlOrMeta}');
      await vi.waitFor(() => {
        expect(props.value).toBe('<p><strong>Hello</strong></p>');
      });
    },
  );

  it('removes underline from pasted HTML in Markdown, which can’t hold it', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ value: 'Hello', buttons: ['bold', 'italic', 'underline'] });
    const screen = await renderAndSelectAll(props);
    const root = /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root'));
    const clipboardData = new DataTransfer();

    clipboardData.setData('text/html', '<p>Due <u><em>1 March</em></u></p>');
    root.dispatchEvent(createPasteEvent(clipboardData));
    await vi.waitFor(() => {
      expect(props.value).toBe('Due _1 March_');
    });
    expect(root.querySelector('.underline')).toBeNull();
  });

  it('leaves the button out by default', async () => {
    const screen = await render(TextEditor, { format: 'html', value: '<p>Hello</p>' });

    await expect.element(screen.getByRole('button', { name: 'Bold' })).toBeVisible();
    expect(document.querySelector('[aria-label="Underline"]')).toBeNull();
  });
});
