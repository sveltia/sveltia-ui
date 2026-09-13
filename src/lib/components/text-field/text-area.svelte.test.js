import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import TextArea from './text-area.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

describe('TextArea', () => {
  it('renders a text area with the given attributes', async () => {
    const screen = await render(TextArea, {
      'aria-label': 'Notes',
      class: 'custom',
      name: 'notes',
      dir: 'auto',
      flex: true,
      'data-x': '1',
    });

    const textarea = screen.getByRole('textbox', { name: 'Notes' });
    const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.text-area'));

    expect(textarea.element().tagName).toBe('TEXTAREA');
    await expect.element(textarea).toHaveAttribute('name', 'notes');
    await expect.element(textarea).toHaveAttribute('dir', 'auto');
    await expect.element(textarea).toHaveAttribute('data-x', '1');
    await expect.element(textarea).toHaveAttribute('aria-hidden', 'false');
    await expect.element(textarea).toHaveAttribute('aria-disabled', 'false');
    await expect.element(textarea).toHaveAttribute('aria-readonly', 'false');
    await expect.element(textarea).toHaveAttribute('aria-required', 'false');
    await expect.element(textarea).toHaveAttribute('aria-invalid', 'false');
    expect(wrapper.classList.contains('custom')).toBe(true);
    expect(wrapper.classList.contains('flex')).toBe(true);
    expect(wrapper.querySelector('.clone')).toBeNull();
  });

  it('reflects the state props', async () => {
    const screen = await render(TextArea, {
      hidden: true,
      disabled: true,
      readonly: true,
      required: true,
      invalid: true,
    });

    const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.text-area'));
    const textarea = /** @type {HTMLTextAreaElement} */ (wrapper.querySelector('textarea'));

    expect(wrapper.hidden).toBe(true);
    expect(wrapper.classList.contains('disabled')).toBe(true);
    expect(wrapper.classList.contains('readonly')).toBe(true);
    expect(textarea.disabled).toBe(true);
    expect(textarea.readOnly).toBe(true);
    expect(textarea.getAttribute('aria-hidden')).toBe('true');
    expect(textarea.getAttribute('aria-disabled')).toBe('true');
    expect(textarea.getAttribute('aria-readonly')).toBe('true');
    expect(textarea.getAttribute('aria-required')).toBe('true');
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
  });

  it('binds the value and element', async () => {
    /** @type {ComponentProps<typeof TextArea>} */
    const props = $state({ value: 'Hi', element: undefined });
    const screen = await render(TextArea, props);
    const textarea = screen.getByRole('textbox');

    await expect.element(textarea).toHaveValue('Hi');
    expect(props.element).toBe(textarea.element());
    await textarea.fill('Hello\nWorld');
    expect(props.value).toBe('Hello\nWorld');
    props.value = 'Reset';
    await expect.element(textarea).toHaveValue('Reset');
  });

  it('mirrors the value in a clone for auto-resizing', async () => {
    /** @type {ComponentProps<typeof TextArea>} */
    const props = $state({ value: 'One', autoResize: true, dir: 'rtl' });
    const screen = await render(TextArea, props);
    const clone = /** @type {HTMLElement} */ (screen.container.querySelector('.clone'));

    expect(screen.container.querySelector('textarea')?.classList.contains('auto-resize')).toBe(
      true,
    );
    expect(clone.getAttribute('aria-hidden')).toBe('true');
    expect(clone.getAttribute('dir')).toBe('rtl');
    // A trailing line break keeps the clone as tall as the text area
    expect(clone.textContent).toBe('One\n');
    props.value = 'One\nTwo';
    await vi.waitFor(() => {
      expect(clone.textContent).toBe('One\nTwo\n');
    });
  });

  it('suggests emojis while typing a shortcode', async () => {
    /** @type {ComponentProps<typeof TextArea>} */
    const props = $state({ value: '', useEmojiAutocomplete: true });
    const screen = await render(TextArea, props);

    await screen.getByRole('textbox').click();
    await userEvent.keyboard(':tada');
    await expect.element(screen.getByRole('listbox', { name: 'Emoji Suggestions' })).toBeVisible();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => {
      expect(props.value).toMatch(/^🎉 $/u);
    });
  });

  it('does not suggest emojis while disabled', async () => {
    const screen = await render(TextArea, { disabled: true, useEmojiAutocomplete: true });

    expect(screen.container.querySelectorAll('*').length).toBe(2);
  });
});
