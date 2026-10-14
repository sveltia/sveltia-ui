import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import ColorInput from './color-input.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

describe('ColorInput', () => {
  it('renders a color input with the default attributes', async () => {
    const screen = await render(ColorInput, { ariaLabel: 'Color', class: 'custom' });
    const input = screen.getByLabelText('Color');
    const element = /** @type {HTMLInputElement} */ (input.element());

    await expect.element(input).toHaveAttribute('type', 'color');
    // A color input always has a value, black by default
    await expect.element(input).toHaveValue('#000000');
    await expect.element(input).toHaveAttribute('aria-disabled', 'false');
    await expect.element(input).toHaveAttribute('aria-readonly', 'false');
    await expect.element(input).toHaveAttribute('aria-required', 'false');
    await expect.element(input).toHaveAttribute('aria-invalid', 'false');
    expect(element.classList.contains('sui')).toBe(true);
    expect(element.classList.contains('color-input')).toBe(true);
    expect(element.classList.contains('custom')).toBe(true);
    expect(element.disabled).toBe(false);
    expect(element.tabIndex).toBe(0);
  });

  it('accepts a plain aria-label attribute as well', async () => {
    const screen = await render(ColorInput, { 'aria-label': 'Plain' });

    await expect.element(screen.getByLabelText('Plain')).toBeVisible();
  });

  it('is as tall as a medium button', async () => {
    const screen = await render(ColorInput, { ariaLabel: 'Color' });
    const element = /** @type {HTMLInputElement} */ (screen.getByLabelText('Color').element());
    const expected = getComputedStyle(element).getPropertyValue('--sui-button-medium-height');

    expect(`${element.getBoundingClientRect().height}px`).toBe(expected.trim());
  });

  it('binds the value and element, and reports input and change', async () => {
    const oninput = vi.fn();
    const onchange = vi.fn();

    /** @type {ComponentProps<typeof ColorInput>} */
    const props = $state({
      value: '#336699',
      element: undefined,
      ariaLabel: 'Color',
      oninput,
      onchange,
    });

    const screen = await render(ColorInput, props);
    const input = screen.getByLabelText('Color');

    await expect.element(input).toHaveValue('#336699');
    expect(props.element).toBe(input.element());
    await input.fill('#ff0000');
    expect(props.value).toBe('#ff0000');
    expect(oninput).toHaveBeenCalled();
    expect(onchange).toHaveBeenCalled();

    props.value = '#00ff00';
    await expect.element(input).toHaveValue('#00ff00');
  });

  it('reflects the state props', async () => {
    /** @type {ComponentProps<typeof ColorInput>} */
    const props = $state({
      ariaLabel: 'Color',
      disabled: true,
      readonly: true,
      required: true,
      invalid: true,
    });

    const screen = await render(ColorInput, props);
    const input = screen.getByLabelText('Color');
    const element = /** @type {HTMLInputElement} */ (input.element());

    expect(element.disabled).toBe(true);
    await expect.element(input).toHaveAttribute('aria-disabled', 'true');
    await expect.element(input).toHaveAttribute('aria-readonly', 'true');
    await expect.element(input).toHaveAttribute('aria-required', 'true');
    await expect.element(input).toHaveAttribute('aria-invalid', 'true');

    props.disabled = false;
    await expect.element(input).toHaveAttribute('aria-disabled', 'false');
    expect(element.disabled).toBe(false);
  });

  it('keeps the picker closed but the input focusable while read-only', async () => {
    const onclick = vi.fn();
    /** @type {ComponentProps<typeof ColorInput>} */
    const props = $state({ value: '#336699', readonly: true, ariaLabel: 'Color', onclick });
    const screen = await render(ColorInput, props);
    const element = /** @type {HTMLInputElement} */ (screen.getByLabelText('Color').element());
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });

    expect(element.disabled).toBe(false);
    await userEvent.tab();
    expect(document.activeElement).toBe(element);
    element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(onclick).toHaveBeenCalledOnce();

    props.readonly = false;
    await expect.element(screen.getByLabelText('Color')).toHaveAttribute('aria-readonly', 'false');

    const editableEvent = new MouseEvent('click', { bubbles: true, cancelable: true });

    // Don’t actually open the picker in the test browser
    element.addEventListener('click', (e) => e.preventDefault(), { once: true });
    element.dispatchEvent(editableEvent);
    expect(onclick).toHaveBeenCalledTimes(2);
  });

  it('marks the input invalid with the error border', async () => {
    const screen = await render(ColorInput, { ariaLabel: 'Color', invalid: true });
    const plain = await render(ColorInput, { ariaLabel: 'Plain' });

    const invalidElement = /** @type {HTMLInputElement} */ (
      screen.getByLabelText('Color').element()
    );

    const plainElement = /** @type {HTMLInputElement} */ (plain.getByLabelText('Plain').element());

    expect(getComputedStyle(invalidElement).borderColor).not.toBe(
      getComputedStyle(plainElement).borderColor,
    );
  });

  it('forwards the other attributes and event handlers', async () => {
    const onfocus = vi.fn();
    const onblur = vi.fn();

    const screen = await render(ColorInput, {
      id: 'brand-color',
      name: 'brand',
      'aria-labelledby': 'label-id',
      'aria-errormessage': 'error-id',
      'data-x': '1',
      onfocus,
      onblur,
    });

    const element = /** @type {HTMLInputElement} */ (screen.container.querySelector('input'));

    expect(element.id).toBe('brand-color');
    expect(element.name).toBe('brand');
    expect(element.getAttribute('aria-labelledby')).toBe('label-id');
    expect(element.getAttribute('aria-errormessage')).toBe('error-id');
    expect(element.dataset.x).toBe('1');
    element.focus();
    expect(onfocus).toHaveBeenCalledOnce();
    element.blur();
    expect(onblur).toHaveBeenCalledOnce();
  });
});
