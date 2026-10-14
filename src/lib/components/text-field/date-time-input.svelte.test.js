import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DateTimeInput from './date-time-input.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

describe('DateTimeInput', () => {
  it('renders a date input with the default attributes', async () => {
    const screen = await render(DateTimeInput, { ariaLabel: 'Date', class: 'custom' });
    const input = screen.getByLabelText('Date');
    const element = /** @type {HTMLInputElement} */ (input.element());

    await expect.element(input).toHaveAttribute('type', 'date');
    await expect.element(input).toHaveValue('');
    await expect.element(input).toHaveAttribute('aria-disabled', 'false');
    await expect.element(input).toHaveAttribute('aria-readonly', 'false');
    await expect.element(input).toHaveAttribute('aria-required', 'false');
    await expect.element(input).toHaveAttribute('aria-invalid', 'false');
    expect(element.classList.contains('sui')).toBe(true);
    expect(element.classList.contains('date-time-input')).toBe(true);
    expect(element.classList.contains('custom')).toBe(true);
    expect(element.disabled).toBe(false);
    expect(element.readOnly).toBe(false);
    expect(element.hasAttribute('min')).toBe(false);
    expect(element.hasAttribute('max')).toBe(false);
    expect(element.hasAttribute('step')).toBe(false);
  });

  it('accepts a plain aria-label attribute as well', async () => {
    const screen = await render(DateTimeInput, { 'aria-label': 'Plain' });

    await expect.element(screen.getByLabelText('Plain')).toBeVisible();
  });

  it.each([
    ['date', '2026-10-14'],
    ['datetime-local', '2026-10-14T13:30'],
    ['time', '13:30'],
  ])('supports the %s type', async (type, newValue) => {
    /** @type {ComponentProps<typeof DateTimeInput>} */
    const props = $state({
      type: /** @type {'date' | 'datetime-local' | 'time'} */ (type),
      value: '',
      ariaLabel: 'Field',
    });

    const screen = await render(DateTimeInput, props);
    const input = screen.getByLabelText('Field');

    await expect.element(input).toHaveAttribute('type', type);
    await input.fill(newValue);
    expect(props.value).toBe(newValue);
  });

  it('binds the value and element, and reports input and change', async () => {
    const oninput = vi.fn();
    const onchange = vi.fn();

    /** @type {ComponentProps<typeof DateTimeInput>} */
    const props = $state({
      value: '2026-01-01',
      element: undefined,
      ariaLabel: 'Date',
      oninput,
      onchange,
    });

    const screen = await render(DateTimeInput, props);
    const input = screen.getByLabelText('Date');

    await expect.element(input).toHaveValue('2026-01-01');
    expect(props.element).toBe(input.element());
    await input.fill('2026-10-14');
    expect(props.value).toBe('2026-10-14');
    expect(oninput).toHaveBeenCalled();
    expect(onchange).toHaveBeenCalled();
    // The bound value is already updated when the callback runs
    expect(/** @type {Event} */ (oninput.mock.calls[0][0]).type).toBe('input');

    props.value = '2025-12-31';
    await expect.element(input).toHaveValue('2025-12-31');
    props.value = undefined;
    await expect.element(input).toHaveValue('');
  });

  it('passes the range and step through', async () => {
    /** @type {ComponentProps<typeof DateTimeInput>} */
    const props = $state({
      type: 'time',
      min: '09:00',
      max: '17:00',
      step: 1,
      ariaLabel: 'Time',
    });

    const screen = await render(DateTimeInput, props);
    const input = screen.getByLabelText('Time');
    const element = /** @type {HTMLInputElement} */ (input.element());

    await expect.element(input).toHaveAttribute('min', '09:00');
    await expect.element(input).toHaveAttribute('max', '17:00');
    await expect.element(input).toHaveAttribute('step', '1');
    element.value = '18:00';
    expect(element.validity.rangeOverflow).toBe(true);
    props.step = 'any';
    await expect.element(input).toHaveAttribute('step', 'any');
  });

  it('reflects the state props', async () => {
    /** @type {ComponentProps<typeof DateTimeInput>} */
    const props = $state({
      ariaLabel: 'Date',
      disabled: true,
      readonly: true,
      required: true,
      invalid: true,
    });

    const screen = await render(DateTimeInput, props);
    const input = screen.getByLabelText('Date');
    const element = /** @type {HTMLInputElement} */ (input.element());

    expect(element.disabled).toBe(true);
    expect(element.readOnly).toBe(true);
    await expect.element(input).toHaveAttribute('aria-disabled', 'true');
    await expect.element(input).toHaveAttribute('aria-readonly', 'true');
    await expect.element(input).toHaveAttribute('aria-required', 'true');
    await expect.element(input).toHaveAttribute('aria-invalid', 'true');

    props.disabled = false;
    props.readonly = false;
    await expect.element(input).toHaveAttribute('aria-disabled', 'false');
    expect(element.disabled).toBe(false);
    expect(element.readOnly).toBe(false);
  });

  it('marks the input invalid with the error border', async () => {
    const screen = await render(DateTimeInput, { ariaLabel: 'Date', invalid: true });
    const element = /** @type {HTMLInputElement} */ (screen.getByLabelText('Date').element());
    const { borderColor } = getComputedStyle(element);
    const plain = await render(DateTimeInput, { ariaLabel: 'Plain' });

    expect(borderColor).not.toBe(
      getComputedStyle(/** @type {HTMLInputElement} */ (plain.getByLabelText('Plain').element()))
        .borderColor,
    );
  });

  it('keeps the read-only input from being edited', async () => {
    /** @type {ComponentProps<typeof DateTimeInput>} */
    const props = $state({ value: '2026-10-14', readonly: true, ariaLabel: 'Date' });
    const screen = await render(DateTimeInput, props);
    const element = /** @type {HTMLInputElement} */ (screen.getByLabelText('Date').element());

    expect(element.matches(':read-only')).toBe(true);
    expect(element.willValidate).toBe(false);
  });

  it('forwards the other attributes and event handlers', async () => {
    const onfocus = vi.fn();
    const onblur = vi.fn();

    const screen = await render(DateTimeInput, {
      id: 'start-date',
      name: 'start',
      'aria-labelledby': 'label-id',
      'aria-errormessage': 'error-id',
      'data-x': '1',
      onfocus,
      onblur,
    });

    const element = /** @type {HTMLInputElement} */ (screen.container.querySelector('input'));

    expect(element.id).toBe('start-date');
    expect(element.name).toBe('start');
    expect(element.getAttribute('aria-labelledby')).toBe('label-id');
    expect(element.getAttribute('aria-errormessage')).toBe('error-id');
    expect(element.dataset.x).toBe('1');
    element.focus();
    expect(onfocus).toHaveBeenCalledOnce();
    element.blur();
    expect(onblur).toHaveBeenCalledOnce();
  });
});
