import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { html, text } from '../../test-utils/snippets.js';
import Checkbox from './checkbox.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

describe('Checkbox', () => {
  it('renders an unchecked checkbox labelled by its label', async () => {
    const screen = await render(Checkbox, { label: 'Agree', class: 'custom', name: 'agree' });
    const checkbox = screen.getByRole('checkbox', { name: 'Agree' });
    const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.checkbox'));

    await expect.element(checkbox).toBeVisible();
    // `aria-checked` is required on the `checkbox` role, so it’s rendered even before any change
    await expect.element(checkbox).toHaveAttribute('aria-checked', 'false');
    await expect.element(checkbox).toHaveAttribute('aria-invalid', 'false');
    await expect.element(checkbox).toHaveAttribute('data-name', 'agree');
    expect(wrapper.classList.contains('custom')).toBe(true);
    expect(wrapper.classList.contains('checked')).toBe(false);
    expect(checkbox.element().getAttribute('aria-labelledby')).toBe(
      wrapper.querySelector('label')?.id,
    );
    expect(checkbox.element().querySelector('.icon')).toBeNull();
  });

  it('uses an aria-label instead of the visible label when given', async () => {
    const screen = await render(Checkbox, { ariaLabel: 'Select row' });
    const checkbox = screen.getByRole('checkbox', { name: 'Select row' });

    expect(checkbox.element().hasAttribute('aria-labelledby')).toBe(false);
    expect(screen.container.querySelector('label')).toBeNull();
  });

  it('renders children as the label', async () => {
    const screen = await render(Checkbox, { children: text('Rich label') });

    expect(screen.container.querySelector('label')?.textContent?.trim()).toBe('Rich label');
  });

  it('toggles when clicked and reports the change', async () => {
    const onChange = vi.fn();
    /** @type {ComponentProps<typeof Checkbox>} */
    const props = $state({ label: 'Agree', checked: false, onChange });
    const screen = await render(Checkbox, props);
    const checkbox = screen.getByRole('checkbox');
    const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.checkbox'));

    await checkbox.click();
    await expect.element(checkbox).toHaveAttribute('aria-checked', 'true');
    expect(props.checked).toBe(true);
    expect(wrapper.classList.contains('checked')).toBe(true);
    expect(checkbox.element().querySelector('.icon')?.textContent?.trim()).toBe('check');
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].detail).toEqual({ checked: true });

    await checkbox.click();
    await expect.element(checkbox).toHaveAttribute('aria-checked', 'false');
    expect(props.checked).toBe(false);
  });

  it('toggles when the label is clicked', async () => {
    /** @type {ComponentProps<typeof Checkbox>} */
    const props = $state({ label: 'Agree', checked: false });
    const screen = await render(Checkbox, props);

    await screen.getByText('Agree').click();
    expect(props.checked).toBe(true);
  });

  it('becomes checked from the indeterminate state', async () => {
    /** @type {ComponentProps<typeof Checkbox>} */
    const props = $state({ label: 'All', checked: 'mixed' });
    const screen = await render(Checkbox, props);
    const checkbox = screen.getByRole('checkbox');
    const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.checkbox'));

    await expect.element(checkbox).toHaveAttribute('aria-checked', 'mixed');
    expect(wrapper.classList.contains('indeterminate')).toBe(true);
    expect(checkbox.element().querySelector('.icon')?.textContent?.trim()).toBe('remove');
    await checkbox.click();
    expect(props.checked).toBe(true);
  });

  it('ignores clicks while disabled or read-only', async () => {
    /** @type {ComponentProps<typeof Checkbox>} */
    const props = $state({ label: 'Agree', checked: false, readonly: true });
    const screen = await render(Checkbox, props);

    const checkbox = /** @type {HTMLElement} */ (
      screen.container.querySelector('[role="checkbox"]')
    );

    expect(checkbox.getAttribute('aria-readonly')).toBe('true');
    checkbox.click();
    expect(props.checked).toBe(false);

    props.readonly = false;
    props.disabled = true;
    await vi.waitFor(() => {
      expect(checkbox.getAttribute('aria-disabled')).toBe('true');
    });
    expect(screen.container.querySelector('.inner')?.hasAttribute('inert')).toBe(true);
    checkbox.click();
    expect(props.checked).toBe(false);
  });

  it('reflects the unchecked, required and invalid states', async () => {
    const screen = await render(Checkbox, { checked: false, required: true, invalid: true });
    const checkbox = screen.getByRole('checkbox');

    await expect.element(checkbox).toHaveAttribute('aria-checked', 'false');
    await expect.element(checkbox).toHaveAttribute('required');
    await expect.element(checkbox).toHaveAttribute('aria-invalid', 'true');
  });

  it('syncs with a bound group of values', async () => {
    /** @type {ComponentProps<typeof Checkbox>} */
    const props = $state({ label: 'B', value: 'b', group: ['a'] });
    const screen = await render(Checkbox, props);
    const checkbox = screen.getByRole('checkbox');

    await expect.element(checkbox).toHaveAttribute('aria-checked', 'false');
    await checkbox.click();
    expect(props.group).toEqual(['a', 'b']);
    await checkbox.click();
    expect(props.group).toEqual(['a']);

    props.group = ['a', 'b'];
    await expect.element(checkbox).toHaveAttribute('aria-checked', 'true');
    props.group = [];
    await expect.element(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  it('renders a custom check icon', async () => {
    const screen = await render(Checkbox, {
      checked: true,
      checkIcon: html('<i class="custom-check">x</i>'),
    });

    expect(screen.container.querySelector('.custom-check')).not.toBeNull();
    expect(screen.container.querySelector('.sui.icon')).toBeNull();
  });

  it('can be hidden', async () => {
    const screen = await render(Checkbox, { hidden: true });

    expect(
      /** @type {HTMLElement} */ (screen.container.querySelector('.sui.checkbox')).hidden,
    ).toBe(true);
  });
});
