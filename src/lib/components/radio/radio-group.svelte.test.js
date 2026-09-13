import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import { whenActivated } from '../../test-utils/group.js';
import { text } from '../../test-utils/snippets.js';
import RadioGroupFixture from './radio-group-fixture.test.svelte';
import RadioGroup from './radio-group.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

it('renders a labelled radio group with the state attributes', async () => {
  const screen = await render(RadioGroup, {
    ariaLabel: 'Color',
    class: 'custom',
    orientation: 'vertical',
    readonly: true,
    required: true,
    invalid: true,
    children: text('child'),
  });

  const group = screen.getByRole('radiogroup', { name: 'Color' });

  await expect.element(group).toHaveClass('sui', 'radio-group', 'custom', 'vertical');
  await expect.element(group).toHaveAttribute('aria-orientation', 'vertical');
  await expect.element(group).toHaveAttribute('aria-readonly', 'true');
  await expect.element(group).toHaveAttribute('aria-required', 'true');
  await expect.element(group).toHaveAttribute('aria-invalid', 'true');
  expect(group.element().textContent).toContain('child');
});

it('hides and disables the group', async () => {
  const screen = await render(RadioGroup, { hidden: true, disabled: true });
  const group = /** @type {HTMLElement} */ (screen.container.querySelector('[role="radiogroup"]'));

  expect(group.hidden).toBe(true);
  expect(group.getAttribute('aria-hidden')).toBe('true');
  expect(group.getAttribute('aria-disabled')).toBe('true');
  expect(group.querySelector('.inner')?.hasAttribute('inert')).toBe(true);
});

it('checks one radio at a time and updates the bound value', async () => {
  const onChange = vi.fn();
  /** @type {ComponentProps<typeof RadioGroupFixture>} */
  const props = $state({ group: 'red', onChange });
  const activated = whenActivated();
  const screen = await render(RadioGroupFixture, props);

  await activated;

  const red = screen.getByRole('radio', { name: 'Red' });
  const green = screen.getByRole('radio', { name: 'Green' });

  await expect.element(red).toHaveAttribute('aria-checked', 'true');
  await expect.element(red).toHaveAttribute('tabindex', '0');
  await green.click();
  await expect.element(green).toHaveAttribute('aria-checked', 'true');
  await expect.element(red).toHaveAttribute('aria-checked', 'false');
  expect(props.group).toBe('green');
  expect(onChange).toHaveBeenCalled();
  expect(onChange.mock.lastCall?.[0].detail.value).toBe('green');
});

it('moves the selection with the arrow keys', async () => {
  /** @type {ComponentProps<typeof RadioGroupFixture>} */
  const props = $state({ group: 'red' });
  const activated = whenActivated();
  const screen = await render(RadioGroupFixture, props);

  await activated;

  const red = screen.getByRole('radio', { name: 'Red' });
  const green = screen.getByRole('radio', { name: 'Green' });

  /** @type {HTMLElement} */ (red.element()).focus();
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(green).toHaveAttribute('aria-checked', 'true');
  await vi.waitFor(() => {
    expect(document.activeElement).toBe(green.element());
  });
  expect(props.group).toBe('green');
});
