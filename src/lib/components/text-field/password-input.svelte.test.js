import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { html } from '../../test-utils/snippets.js';
import PasswordInput from './password-input.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

describe('PasswordInput', () => {
  it('renders a password field with a Show button', async () => {
    const screen = await render(PasswordInput, {
      ariaLabel: 'Password',
      class: 'custom',
      flex: true,
    });

    const input = /** @type {HTMLInputElement} */ (screen.container.querySelector('input'));
    const button = screen.getByRole('button', { name: 'Show Password' });

    const wrapper = /** @type {HTMLElement} */ (
      screen.container.querySelector('.sui.password-input')
    );

    expect(input.type).toBe('password');
    expect(input.getAttribute('aria-label')).toBe('Password');
    expect(input.getAttribute('dir')).toBe('ltr');
    expect(input.getAttribute('spellcheck')).toBe('false');
    expect(input.closest('.text-input')?.classList.contains('monospace')).toBe(true);
    expect(button.element().getAttribute('aria-controls')).toBe(input.id);
    await expect.element(button).toHaveAttribute('aria-pressed', 'false');
    expect(button.element().querySelector('.icon')?.textContent?.trim()).toBe('visibility');
    expect(wrapper.classList.contains('custom')).toBe(true);
    expect(wrapper.classList.contains('flex')).toBe(true);
  });

  it('toggles the visibility of the password', async () => {
    const screen = await render(PasswordInput, { value: 'secret' });
    const input = /** @type {HTMLInputElement} */ (screen.container.querySelector('input'));
    const button = screen.getByRole('button', { name: 'Show Password' });

    await button.click();
    expect(input.type).toBe('text');
    await expect
      .element(screen.getByRole('button', { name: 'Hide Password' }))
      .toHaveAttribute('aria-pressed', 'true');
    expect(screen.container.querySelector('.icon')?.textContent?.trim()).toBe('visibility_off');
    await screen.getByRole('button', { name: 'Hide Password' }).click();
    expect(input.type).toBe('password');
  });

  it('binds the value', async () => {
    /** @type {ComponentProps<typeof PasswordInput>} */
    const props = $state({ value: 'a' });
    const screen = await render(PasswordInput, props);
    const input = /** @type {HTMLInputElement} */ (screen.container.querySelector('input'));

    expect(input.value).toBe('a');
    await screen.getByRole('textbox', { includeHidden: true }).fill('b');
    expect(props.value).toBe('b');
  });

  it('disables the button while disabled or read-only, and reflects the states', async () => {
    const screen = await render(PasswordInput, {
      readonly: true,
      required: true,
      invalid: true,
      hidden: true,
    });

    const wrapper = /** @type {HTMLElement} */ (
      screen.container.querySelector('.sui.password-input')
    );

    const input = /** @type {HTMLInputElement} */ (wrapper.querySelector('input'));

    expect(/** @type {HTMLButtonElement} */ (wrapper.querySelector('button')).disabled).toBe(true);
    expect(wrapper.classList.contains('readonly')).toBe(true);
    expect(wrapper.hidden).toBe(true);
    expect(input.readOnly).toBe(true);
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-invalid')).toBe('true');

    const disabled = await render(PasswordInput, { disabled: true });

    expect(
      /** @type {HTMLButtonElement} */ (disabled.container.querySelector('button')).disabled,
    ).toBe(true);
    expect(
      disabled.container.querySelector('.sui.password-input')?.classList.contains('disabled'),
    ).toBe(true);
  });

  it('renders a custom visibility icon', async () => {
    const screen = await render(PasswordInput, { visibilityIcon: html('<i class="eye">o</i>') });

    expect(screen.container.querySelector('button .eye')).not.toBeNull();
    expect(screen.container.querySelector('button .sui.icon')).toBeNull();
  });
});
