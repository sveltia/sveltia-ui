import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import TextInput from './text-input.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

describe('TextInput', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a text box with the default attributes', async () => {
    const screen = await render(TextInput, { ariaLabel: 'Name', class: 'custom', name: 'name' });
    const input = screen.getByRole('textbox', { name: 'Name' });
    const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.text-input'));

    await expect.element(input).toHaveAttribute('type', 'text');
    await expect.element(input).toHaveAttribute('name', 'name');
    await expect.element(input).toHaveAttribute('inputmode', 'text');
    await expect.element(input).toHaveAttribute('tabindex', '0');
    await expect.element(input).toHaveAttribute('aria-hidden', 'false');
    await expect.element(input).toHaveAttribute('aria-disabled', 'false');
    await expect.element(input).toHaveAttribute('aria-readonly', 'false');
    await expect.element(input).toHaveAttribute('aria-required', 'false');
    await expect.element(input).toHaveAttribute('aria-invalid', 'false');
    expect(wrapper.classList.contains('custom')).toBe(true);
    expect(wrapper.classList.contains('flex')).toBe(false);
    expect(input.element().hasAttribute('aria-keyshortcuts')).toBe(false);
  });

  it('accepts a plain aria-label attribute as well', async () => {
    const screen = await render(TextInput, { 'aria-label': 'Plain' });

    await expect.element(screen.getByRole('textbox', { name: 'Plain' })).toBeVisible();
  });

  it('applies the role, direction, input mode and layout options', async () => {
    const screen = await render(TextInput, {
      role: 'searchbox',
      dir: 'rtl',
      inputmode: 'numeric',
      flex: true,
      monospace: true,
      keyShortcuts: 'Accel+K',
      'data-x': '1',
    });

    const input = screen.getByRole('searchbox');
    const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.text-input'));

    await expect.element(input).toHaveAttribute('dir', 'rtl');
    await expect.element(input).toHaveAttribute('inputmode', 'numeric');
    await expect.element(input).toHaveAttribute('data-x', '1');
    expect(input.element().getAttribute('aria-keyshortcuts')).toMatch(/^(Ctrl|Meta)\+K$/);
    expect(wrapper.classList.contains('flex')).toBe(true);
    expect(wrapper.classList.contains('monospace')).toBe(true);
  });

  it('reflects the state props', async () => {
    const screen = await render(TextInput, {
      hidden: true,
      disabled: true,
      readonly: true,
      required: true,
      invalid: true,
    });

    const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.text-input'));
    const input = /** @type {HTMLInputElement} */ (wrapper.querySelector('input'));

    expect(wrapper.hidden).toBe(true);
    expect(wrapper.classList.contains('disabled')).toBe(true);
    expect(wrapper.classList.contains('readonly')).toBe(true);
    expect(input.disabled).toBe(true);
    expect(input.readOnly).toBe(true);
    expect(input.tabIndex).toBe(-1);
    expect(input.getAttribute('aria-hidden')).toBe('true');
    expect(input.getAttribute('aria-disabled')).toBe('true');
    expect(input.getAttribute('aria-readonly')).toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('binds the value and element, and reports input', async () => {
    const oninput = vi.fn();
    /** @type {ComponentProps<typeof TextInput>} */
    const props = $state({ value: 'Hi', element: undefined, oninput });
    const screen = await render(TextInput, props);
    const input = screen.getByRole('textbox');

    await expect.element(input).toHaveValue('Hi');
    expect(props.element).toBe(input.element());
    await input.fill('Hello');
    expect(props.value).toBe('Hello');
    expect(oninput).toHaveBeenCalled();

    props.value = 'Reset';
    await expect.element(input).toHaveValue('Reset');
  });

  it('debounces the input on demand', async () => {
    vi.useFakeTimers();

    const oninput = vi.fn();
    /** @type {ComponentProps<typeof TextInput>} */
    const props = $state({ value: '', debounce: true, oninput });
    const screen = await render(TextInput, props);
    const input = /** @type {HTMLInputElement} */ (screen.container.querySelector('input'));

    input.value = 'a';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    input.value = 'ab';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    expect(props.value).toBe('');
    expect(oninput).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(299);
    expect(props.value).toBe('');
    await vi.advanceTimersByTimeAsync(1);
    expect(props.value).toBe('ab');
    expect(oninput).toHaveBeenCalledOnce();
  });

  it('accepts a custom debounce delay', async () => {
    vi.useFakeTimers();

    /** @type {ComponentProps<typeof TextInput>} */
    const props = $state({ value: '', debounce: 50 });
    const screen = await render(TextInput, props);
    const input = /** @type {HTMLInputElement} */ (screen.container.querySelector('input'));

    input.value = 'x';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(50);
    expect(props.value).toBe('x');
  });

  it('shows the label inline while empty', async () => {
    /** @type {ComponentProps<typeof TextInput>} */
    const props = $state({ value: '', ariaLabel: 'Search', showInlineLabel: true });
    const screen = await render(TextInput, props);
    const label = /** @type {HTMLElement} */ (screen.container.querySelector('.label'));

    expect(label.textContent?.trim()).toBe('Search');
    expect(label.classList.contains('hidden')).toBe(false);
    props.value = 'x';
    await vi.waitFor(() => {
      expect(label.classList.contains('hidden')).toBe(true);
    });

    const plain = await render(TextInput, { ariaLabel: 'Search' });

    expect(plain.container.querySelector('.label')).toBeNull();
  });

  it('suggests emojis while typing a shortcode', async () => {
    /** @type {ComponentProps<typeof TextInput>} */
    const props = $state({ value: '', useEmojiAutocomplete: true });
    const screen = await render(TextInput, props);
    const input = screen.getByRole('textbox');

    await input.click();
    await userEvent.keyboard(':smile');
    await expect.element(screen.getByRole('listbox', { name: 'Emoji Suggestions' })).toBeVisible();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => {
      expect(props.value).toMatch(/^😄 $/u);
    });
    expect(document.querySelector('.emoji-suggestions')).toBeNull();
  });

  it('does not suggest emojis while read-only', async () => {
    const screen = await render(TextInput, { readonly: true, useEmojiAutocomplete: true });

    expect(screen.container.querySelector('.emoji-suggestions')).toBeNull();
    // The autocomplete component isn’t even mounted
    expect(screen.container.querySelectorAll('*').length).toBe(2);
  });
});
