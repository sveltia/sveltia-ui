import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { text } from '../../test-utils/snippets.js';
import CheckboxGroup from './checkbox-group.svelte';

it('renders a horizontal group by default', async () => {
  const screen = await render(CheckboxGroup, {
    ariaLabel: 'Toppings',
    class: 'custom',
    'data-x': '1',
    children: text('child'),
  });

  const group = screen.getByRole('group', { name: 'Toppings' });

  await expect.element(group).toHaveClass('sui', 'checkbox-group', 'custom', 'horizontal');
  await expect.element(group).toHaveAttribute('aria-roledescription', 'checkbox group');
  await expect.element(group).toHaveAttribute('data-x', '1');
  expect(group.element().textContent).toContain('child');
});

it('supports the vertical orientation', async () => {
  const screen = await render(CheckboxGroup, { orientation: 'vertical' });

  await expect.element(screen.getByRole('group')).toHaveClass('vertical');
});

it('hides and disables the group', async () => {
  const screen = await render(CheckboxGroup, { hidden: true, disabled: true });
  const group = /** @type {HTMLElement} */ (screen.container.querySelector('[role="group"]'));

  expect(group.hidden).toBe(true);
  expect(group.getAttribute('aria-hidden')).toBe('true');
  expect(group.getAttribute('aria-disabled')).toBe('true');
  expect(group.querySelector('.inner')?.hasAttribute('inert')).toBe(true);
});
