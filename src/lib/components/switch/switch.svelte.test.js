import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { text } from '../../test-utils/snippets.js';
import Switch from './switch.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

describe('Switch', () => {
  it('renders a switch button with the label', async () => {
    const screen = await render(Switch, { label: 'Dark mode', class: 'custom', 'data-x': '1' });
    const button = screen.getByRole('switch', { name: 'Dark mode' });

    await expect.element(button).toHaveClass('sui', 'switch', 'custom');
    await expect.element(button).toHaveAttribute('type', 'button');
    await expect.element(button).toHaveAttribute('data-x', '1');
    await expect.element(button).toHaveAttribute('aria-hidden', 'false');
    await expect.element(button).toHaveAttribute('aria-disabled', 'false');
    await expect.element(button).toHaveAttribute('aria-readonly', 'false');
    await expect.element(button).toHaveAttribute('aria-required', 'false');
    await expect.element(button).toHaveAttribute('aria-invalid', 'false');
    // `aria-checked` is required on the `switch` role, so it’s rendered even before any change
    await expect.element(button).toHaveAttribute('aria-checked', 'false');
  });

  it('renders children when there is no label, and supports an aria-label', async () => {
    const screen = await render(Switch, { ariaLabel: 'Toggle', children: text('Child') });
    const button = screen.getByRole('switch', { name: 'Toggle' });

    expect(button.element().textContent).toContain('Child');
  });

  it('toggles when clicked and reports the change', async () => {
    const onChange = vi.fn();
    /** @type {ComponentProps<typeof Switch>} */
    const props = $state({ label: 'Dark mode', checked: false, onChange });
    const screen = await render(Switch, props);
    const button = screen.getByRole('switch');

    await expect.element(button).toHaveAttribute('aria-checked', 'false');
    await button.click();
    await expect.element(button).toHaveAttribute('aria-checked', 'true');
    expect(props.checked).toBe(true);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].detail).toEqual({ checked: true });
    await button.click();
    expect(props.checked).toBe(false);
  });

  it('ignores clicks while disabled or read-only', async () => {
    /** @type {ComponentProps<typeof Switch>} */
    const props = $state({ checked: false, readonly: true });
    const screen = await render(Switch, props);
    const button = /** @type {HTMLButtonElement} */ (screen.container.querySelector('button'));

    button.click();
    expect(props.checked).toBe(false);

    props.readonly = false;
    props.disabled = true;
    await vi.waitFor(() => {
      expect(button.disabled).toBe(true);
    });
    button.click();
    expect(props.checked).toBe(false);
  });

  it('reflects the hidden, required and invalid states', async () => {
    const screen = await render(Switch, { hidden: true, required: true, invalid: true });
    const button = /** @type {HTMLButtonElement} */ (screen.container.querySelector('button'));

    expect(button.hidden).toBe(true);
    expect(button.getAttribute('aria-hidden')).toBe('true');
    expect(button.getAttribute('aria-required')).toBe('true');
    expect(button.getAttribute('aria-invalid')).toBe('true');
  });
});
