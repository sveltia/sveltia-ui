import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { whenActivated } from '../../test-utils/group.js';
import SelectButtonGroupFixture from './select-button-group-fixture.test.svelte';
import SelectButtonGroup from './select-button-group.svelte';

it('renders a radio group with the state attributes', async () => {
  const screen = await render(SelectButtonGroup, {
    ariaLabel: 'View',
    class: 'custom',
    readonly: true,
    required: true,
    invalid: true,
  });

  const group = screen.getByRole('radiogroup', { name: 'View' });

  await expect.element(group).toHaveClass('sui', 'select-button-group', 'custom');
  await expect.element(group).toHaveAttribute('tabindex', '-1');
  await expect.element(group).toHaveAttribute('aria-readonly', 'true');
  await expect.element(group).toHaveAttribute('aria-required', 'true');
  await expect.element(group).toHaveAttribute('aria-invalid', 'true');
});

it('hides and disables the group', async () => {
  const screen = await render(SelectButtonGroup, { hidden: true, disabled: true });
  const group = /** @type {HTMLElement} */ (screen.container.querySelector('[role="radiogroup"]'));

  expect(group.hidden).toBe(true);
  expect(group.getAttribute('aria-hidden')).toBe('true');
  expect(group.getAttribute('aria-disabled')).toBe('true');
  expect(group.querySelector('.inner')?.hasAttribute('inert')).toBe(true);
});

it('lets one button be selected at a time', async () => {
  const onChange = vi.fn();
  const activated = whenActivated();
  const screen = await render(SelectButtonGroupFixture, { onChange });

  await activated;

  const grid = screen.getByRole('radio', { name: 'Grid' });
  const list = screen.getByRole('radio', { name: 'List' });

  await expect.element(grid).toHaveAttribute('aria-checked', 'true');
  await expect.element(list).toHaveAttribute('aria-checked', 'false');
  await list.click();
  await expect.element(list).toHaveAttribute('aria-checked', 'true');
  await expect.element(grid).toHaveAttribute('aria-checked', 'false');
  expect(onChange).toHaveBeenCalledOnce();
  expect(onChange.mock.calls[0][0].detail.value).toBe('list');
});
