import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { html } from '../../test-utils/snippets.js';
import SecretInput from './secret-input.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

describe('SecretInput', () => {
  it('renders a concealed text field with a Show button', async () => {
    const screen = await render(SecretInput, { ariaLabel: 'Token', class: 'custom', flex: true });
    const input = screen.getByRole('textbox', { name: 'Token' });
    const button = screen.getByRole('button', { name: 'Show Secret' });

    const wrapper = /** @type {HTMLElement} */ (
      screen.container.querySelector('.sui.secret-input')
    );

    // The field stays a text field, and is concealed with CSS instead
    await expect.element(input).toHaveAttribute('type', 'text');
    await expect.element(input).toHaveAttribute('dir', 'ltr');
    await expect.element(input).toHaveAttribute('spellcheck', 'false');
    expect(input.element().closest('.text-input')?.classList.contains('monospace')).toBe(true);
    expect(button.element().getAttribute('aria-controls')).toBe(input.element().id);
    await expect.element(button).toHaveAttribute('aria-pressed', 'false');
    expect(wrapper.classList.contains('custom')).toBe(true);
    expect(wrapper.classList.contains('flex')).toBe(true);
    expect(wrapper.classList.contains('show')).toBe(false);
  });

  it('toggles the visibility of the secret', async () => {
    const screen = await render(SecretInput, { value: 'secret' });

    const wrapper = /** @type {HTMLElement} */ (
      screen.container.querySelector('.sui.secret-input')
    );

    await screen.getByRole('button', { name: 'Show Secret' }).click();
    expect(wrapper.classList.contains('show')).toBe(true);
    await expect
      .element(screen.getByRole('button', { name: 'Hide Secret' }))
      .toHaveAttribute('aria-pressed', 'true');
    expect(wrapper.querySelector('.icon')?.textContent?.trim()).toBe('visibility_off');
    await screen.getByRole('button', { name: 'Hide Secret' }).click();
    expect(wrapper.classList.contains('show')).toBe(false);
  });

  it('binds the value', async () => {
    /** @type {ComponentProps<typeof SecretInput>} */
    const props = $state({ value: 'a' });
    const screen = await render(SecretInput, props);

    await expect.element(screen.getByRole('textbox')).toHaveValue('a');
    await screen.getByRole('textbox').fill('b');
    expect(props.value).toBe('b');
  });

  it('disables the button while disabled or read-only, and reflects the states', async () => {
    const screen = await render(SecretInput, {
      disabled: true,
      required: true,
      invalid: true,
      hidden: true,
    });

    const wrapper = /** @type {HTMLElement} */ (
      screen.container.querySelector('.sui.secret-input')
    );

    const input = /** @type {HTMLInputElement} */ (wrapper.querySelector('input'));

    expect(/** @type {HTMLButtonElement} */ (wrapper.querySelector('button')).disabled).toBe(true);
    expect(wrapper.classList.contains('disabled')).toBe(true);
    expect(wrapper.hidden).toBe(true);
    expect(input.disabled).toBe(true);
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-invalid')).toBe('true');

    const readonly = await render(SecretInput, { readonly: true });

    expect(
      /** @type {HTMLButtonElement} */ (readonly.container.querySelector('button')).disabled,
    ).toBe(true);
    expect(
      readonly.container.querySelector('.sui.secret-input')?.classList.contains('readonly'),
    ).toBe(true);
  });

  it('renders a custom visibility icon', async () => {
    const screen = await render(SecretInput, { visibilityIcon: html('<i class="eye">o</i>') });

    expect(screen.container.querySelector('button .eye')).not.toBeNull();
    expect(screen.container.querySelector('button .sui.icon')).toBeNull();
  });
});
