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
    const screen = await render(NumberInput, { step: 0.5, min: 0 });

    await expect.element(screen.getByRole('spinbutton')).toHaveAttribute('inputmode', 'decimal');
  });

  it('uses the text input mode when a negative number is allowed', async () => {
    /** @type {ComponentProps<typeof NumberInput>} */
    const props = $state({ min: undefined });
    const screen = await render(NumberInput, props);
    const input = screen.getByRole('spinbutton');

    // The numeric keypad on iOS has no minus key
    await expect.element(input).toHaveAttribute('inputmode', 'text');
    props.min = -10;
    await expect.element(input).toHaveAttribute('inputmode', 'text');
    props.min = 0;
    await expect.element(input).toHaveAttribute('inputmode', 'numeric');
  });

  it('turns stepping off with a step of -1', async () => {
    /** @type {ComponentProps<typeof NumberInput>} */
    const props = $state({ value: 5, min: 0, max: 10, step: -1, ariaLabel: 'ID' });
    const screen = await render(NumberInput, props);
    const input = screen.getByRole('textbox', { name: 'ID' });

    await expect.element(input).toHaveValue('5');
    await expect.element(input).toHaveAttribute('inputmode', 'decimal');
    await expect.element(input).not.toHaveAttribute('aria-valuenow');
    await expect.element(input).not.toHaveAttribute('aria-valuemin');
    await expect.element(input).not.toHaveAttribute('aria-valuemax');
    // The range is described instead
    await expect.element(input).toHaveAccessibleDescription('From 0 to 10');
    expect(screen.container.querySelector('.buttons')).toBeNull();
    expect(screen.container.querySelectorAll('button')).toHaveLength(0);
    // The arrow keys are left alone
    await input.click();
    await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowDown}');
    expect(props.value).toBe(5);
    // The value can still be typed
    await input.fill('123456');
    expect(props.value).toBe(123456);
    // Only the minimum or the maximum, or neither
    props.max = undefined;
    await expect.element(input).toHaveAccessibleDescription('Minimum 0');
    props.min = undefined;
    props.max = 10;
    await expect.element(input).toHaveAccessibleDescription('Maximum 10');
    props.max = undefined;
    await expect.element(input).not.toHaveAttribute('aria-describedby');
  });

  it('keeps an outside description along with the range', async () => {
    /** @type {ComponentProps<typeof NumberInput>} */
    const props = $state({ step: -1, min: 1, 'aria-describedby': 'hint' });
    const screen = await render(NumberInput, props);
    const input = screen.getByRole('textbox');
    const { id } = input.element();

    await expect.element(input).toHaveAttribute('aria-describedby', `hint ${id}-range`);
    props.min = undefined;
    await expect.element(input).toHaveAttribute('aria-describedby', 'hint');
  });

  it('uses the decimal or numeric keypad as told by the fractional prop', async () => {
    /** @type {ComponentProps<typeof NumberInput>} */
    const props = $state({ min: 0, fractional: true });
    const screen = await render(NumberInput, props);
    const input = screen.getByRole('spinbutton');

    // The integer step would bring up the numeric keypad otherwise
    await expect.element(input).toHaveAttribute('inputmode', 'decimal');
    props.step = -1;
    props.fractional = false;
    await expect.element(screen.getByRole('textbox')).toHaveAttribute('inputmode', 'numeric');
  });

  it('steps by 1 with a step that isn’t a positive number', async () => {
    /** @type {ComponentProps<typeof NumberInput>} */
    const props = $state({ value: 5, step: 0, min: 0 });
    const screen = await render(NumberInput, props);
    const input = screen.getByRole('spinbutton');

    await expect.element(input).toHaveAttribute('inputmode', 'numeric');
    await screen.getByRole('button', { name: 'Increase' }).click();
    expect(props.value).toBe(6);
    // `null` from a config file, for example, as well as a negative step other than `-1`
    props.step = /** @type {any} */ (null);
    await screen.getByRole('button', { name: 'Increase' }).click();
    expect(props.value).toBe(7);
    props.step = -2;
    await screen.getByRole('button', { name: 'Decrease' }).click();
    expect(props.value).toBe(6);
  });

  it('accepts an input mode from outside', async () => {
    /** @type {ComponentProps<typeof NumberInput>} */
    const props = $state({ step: -1, inputmode: 'numeric' });
    const screen = await render(NumberInput, props);

    await expect.element(screen.getByRole('textbox')).toHaveAttribute('inputmode', 'numeric');
    props.inputmode = undefined;
    await expect.element(screen.getByRole('textbox')).toHaveAttribute('inputmode', 'text');
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
    // The text is left for the user to correct rather than wiped out
    await expect.element(input).toHaveValue('abc');
  });

  it('accepts the decimal separator of the field’s language', async () => {
    /** @type {ComponentProps<typeof NumberInput>} */
    const props = $state({ value: undefined, lang: 'de', step: 0.5 });
    const screen = await render(NumberInput, props);
    const input = screen.getByRole('spinbutton');

    await input.fill('1,5');
    expect(props.value).toBe(1.5);
    await expect.element(input).not.toHaveAttribute('aria-invalid', 'true');
    // The field can be stepped from there
    await screen.getByRole('button', { name: 'Increase' }).click();
    await expect.element(input).toHaveValue('2.0');
    expect(props.value).toBe(2);
    // A comma is not a decimal separator in English
    props.lang = 'en';
    await input.fill('1,5');
    expect(props.value).toBeUndefined();
  });

  it('keeps text that is still being typed', async () => {
    /** @type {ComponentProps<typeof NumberInput>} */
    const props = $state({ value: 1.5 });
    const screen = await render(NumberInput, props);
    const input = screen.getByRole('spinbutton');

    // Deleting the fraction digit leaves the decimal point in place
    await input.click();
    await userEvent.keyboard('{End}{Backspace}');
    await expect.element(input).toHaveValue('1.');
    expect(props.value).toBe(1);
    await userEvent.keyboard('7');
    expect(props.value).toBe(1.7);
    // Replacing the value with a minus sign to start a negative number
    await input.fill('-');
    await expect.element(input).toHaveValue('-');
    expect(props.value).toBeUndefined();
    await userEvent.keyboard('3');
    expect(props.value).toBe(-3);
  });

  it('steps an empty field from zero with the buttons', async () => {
    /** @type {ComponentProps<typeof NumberInput>} */
    const props = $state({ value: undefined });
    const screen = await render(NumberInput, props);
    const increase = screen.getByRole('button', { name: 'Increase' });

    await expect.element(increase).toBeEnabled();
    await increase.click();
    expect(props.value).toBe(1);
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

  it('calls the consumer’s keydown and input handlers', async () => {
    const onkeydown = vi.fn();
    const oninput = vi.fn();
    const screen = await render(NumberInput, { value: 1, onkeydown, oninput });
    const input = screen.getByRole('spinbutton');

    await input.click();
    await userEvent.keyboard('{ArrowUp}');
    expect(onkeydown).toHaveBeenCalled();
    await userEvent.keyboard('5');
    expect(oninput).toHaveBeenCalled();
  });

  it('ignores the arrow keys while read-only', async () => {
    /** @type {ComponentProps<typeof NumberInput>} */
    const props = $state({ value: 1, readonly: true });
    const screen = await render(NumberInput, props);

    await screen.getByRole('spinbutton').click();
    await userEvent.keyboard('{ArrowUp}');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');
    expect(props.value).toBe(1);
  });

  it('omits `aria-valuenow` while the field holds no number', async () => {
    /** @type {ComponentProps<typeof NumberInput>} */
    const props = $state({ value: undefined });
    const screen = await render(NumberInput, props);
    const input = screen.getByRole('spinbutton');

    await expect.element(input).not.toHaveAttribute('aria-valuenow');
    await input.fill('abc');
    await expect.element(input).not.toHaveAttribute('aria-valuenow');
    await input.fill('0');
    await expect.element(input).toHaveAttribute('aria-valuenow', '0');
  });
});
