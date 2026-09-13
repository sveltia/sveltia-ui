import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import { html } from '../../test-utils/snippets.js';
import NumberInput from './number-input.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

describe('NumberInput', () => {
  it('renders a spin button with the range and the spin buttons', async () => {
    const screen = await render(NumberInput, {
      value: 5,
      min: 0,
      max: 10,
      ariaLabel: 'Count',
      class: 'custom',
    });

    const input = screen.getByRole('spinbutton', { name: 'Count' });
    const increase = screen.getByRole('button', { name: 'Increase' });
    const decrease = screen.getByRole('button', { name: 'Decrease' });

    await expect.element(input).toHaveValue('5');
    await expect.element(input).toHaveAttribute('aria-valuenow', '5');
    await expect.element(input).toHaveAttribute('aria-valuemin', '0');
    await expect.element(input).toHaveAttribute('aria-valuemax', '10');
    await expect.element(input).toHaveAttribute('inputmode', 'numeric');
    await expect.element(input).toHaveAttribute('dir', 'ltr');
    await expect.element(input).toHaveAttribute('spellcheck', 'false');
    expect(increase.element().getAttribute('aria-controls')).toBe(input.element().id);
    expect(decrease.element().getAttribute('aria-controls')).toBe(input.element().id);
    expect(screen.container.querySelector('.sui.number-input')?.classList.contains('custom')).toBe(
      true,
    );
  });

  it('uses the decimal input mode for a fractional step', async () => {
    const screen = await render(NumberInput, { step: 0.5 });

    await expect.element(screen.getByRole('spinbutton')).toHaveAttribute('inputmode', 'decimal');
  });

  it('steps the value with the buttons, within the range', async () => {
    /** @type {ComponentProps<typeof NumberInput>} */
    const props = $state({ value: 9, min: 0, max: 10 });
    const screen = await render(NumberInput, props);
    const input = screen.getByRole('spinbutton');
    const increase = screen.getByRole('button', { name: 'Increase' });
    const decrease = screen.getByRole('button', { name: 'Decrease' });

    await increase.click();
    expect(props.value).toBe(10);
    await expect.element(input).toHaveValue('10');
    // At the maximum, the button is disabled
    await expect.element(increase).toBeDisabled();
    await decrease.click();
    expect(props.value).toBe(9);
    await expect.element(increase).toBeEnabled();
  });

  it('steps the value with the arrow keys, formatting decimals', async () => {
    /** @type {ComponentProps<typeof NumberInput>} */
    const props = $state({ value: 0.2, step: 0.1 });
    const screen = await render(NumberInput, props);
    const input = screen.getByRole('spinbutton');

    await input.click();
    await userEvent.keyboard('{ArrowUp}');
    expect(props.value).toBe(0.3);
    await expect.element(input).toHaveValue('0.3');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(props.value).toBe(0.1);
    // Modifier keys are left alone
    await userEvent.keyboard('{Shift>}{ArrowUp}{/Shift}');
    expect(props.value).toBe(0.1);

    props.max = 0.1;
    await userEvent.keyboard('{ArrowUp}');
    expect(props.value).toBe(0.1);
  });

  it('parses the typed value and clears it when not a number', async () => {
    /** @type {ComponentProps<typeof NumberInput>} */
    const props = $state({ value: undefined });
    const screen = await render(NumberInput, props);
    const input = screen.getByRole('spinbutton');

    await input.fill('42');
    expect(props.value).toBe(42);
    await input.fill('abc');
    expect(props.value).toBeUndefined();
    // Once the value is gone, the field is reset along with it
    await expect.element(input).toHaveValue('');
  });

  it('follows a value set from outside', async () => {
    /** @type {ComponentProps<typeof NumberInput>} */
    const props = $state({ value: 1 });
    const screen = await render(NumberInput, props);

    props.value = 7;
    await expect.element(screen.getByRole('spinbutton')).toHaveValue('7');
    props.value = undefined;
    await expect.element(screen.getByRole('spinbutton')).toHaveValue('');
  });

  it('flags an invalid value only once the field has been edited', async () => {
    /** @type {ComponentProps<typeof NumberInput>} */
    const props = $state({ value: 50, min: 0, max: 10, invalid: false });
    const screen = await render(NumberInput, props);
    const input = screen.getByRole('spinbutton');

    // Out of range from the start, but not yet edited
    await expect.element(input).toHaveAttribute('aria-invalid', 'false');
    await input.fill('11');
    await expect.element(input).toHaveAttribute('aria-invalid', 'true');
    expect(props.invalid).toBe(true);
    await input.fill('5');
    await expect.element(input).toHaveAttribute('aria-invalid', 'false');
    // Text that is not a number is invalid when typed into an empty field
    await input.fill('');
    await input.fill('x');
    await expect.element(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('flags an empty required field once edited', async () => {
    /** @type {ComponentProps<typeof NumberInput>} */
    const props = $state({ value: 1, required: true, invalid: false });
    const screen = await render(NumberInput, props);
    const input = screen.getByRole('spinbutton');

    await input.fill('');
    await expect.element(input).toHaveAttribute('aria-invalid', 'true');
    await expect.element(input).toHaveAttribute('aria-required', 'true');
  });

  it('disables the buttons while disabled, read-only or holding no number', async () => {
    /** @type {ComponentProps<typeof NumberInput>} */
    const props = $state({ value: 1, readonly: true });
    const screen = await render(NumberInput, props);

    const buttons = /** @type {HTMLButtonElement[]} */ ([
      ...screen.container.querySelectorAll('button'),
    ]);

    buttons.forEach((button) => {
      expect(button.disabled).toBe(true);
    });
    expect(
      screen.container.querySelector('.sui.number-input')?.classList.contains('readonly'),
    ).toBe(true);

    props.readonly = false;
    await vi.waitFor(() => {
      buttons.forEach((button) => {
        expect(button.disabled).toBe(false);
      });
    });

    props.disabled = true;
    await vi.waitFor(() => {
      buttons.forEach((button) => {
        expect(button.disabled).toBe(true);
      });
    });
    expect(
      screen.container.querySelector('.sui.number-input')?.classList.contains('disabled'),
    ).toBe(true);
  });

  it('renders custom spin icons and can be hidden', async () => {
    const screen = await render(NumberInput, {
      hidden: true,
      increaseIcon: html('<i class="up">+</i>'),
      decreaseIcon: html('<i class="down">-</i>'),
    });

    expect(
      /** @type {HTMLElement} */ (screen.container.querySelector('.sui.number-input')).hidden,
    ).toBe(true);
    expect(screen.container.querySelector('.up')).not.toBeNull();
    expect(screen.container.querySelector('.down')).not.toBeNull();
    expect(screen.container.querySelector('.sui.icon')).toBeNull();
  });
});
