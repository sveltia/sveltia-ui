import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { text } from '../../test-utils/snippets.js';
import Group from './group.svelte';

it('renders a group with a label and children', async () => {
  const screen = await render(Group, {
    ariaLabel: 'Options',
    class: 'custom',
    'data-test': 'yes',
    children: text('child'),
  });

  const group = screen.getByRole('group', { name: 'Options' });

  await expect.element(group).toBeVisible();
  await expect.element(group).toHaveClass('sui', 'group', 'custom');
  await expect.element(group).toHaveAttribute('data-test', 'yes');
  await expect.element(group).toHaveAttribute('aria-hidden', 'false');
  await expect.element(group).toHaveAttribute('aria-disabled', 'false');
  await expect.element(screen.getByText('child')).toBeVisible();
});

it('hides the group', async () => {
  const screen = await render(Group, { hidden: true, children: text('child') });
  const group = screen.container.querySelector('[role="group"]');

  expect(group?.hasAttribute('hidden')).toBe(true);
  expect(group?.getAttribute('aria-hidden')).toBe('true');
  await expect.element(screen.getByText('child')).not.toBeVisible();
});

it('makes the content inert when disabled', async () => {
  const screen = await render(Group, { disabled: true, children: text('child') });
  const group = screen.container.querySelector('[role="group"]');

  expect(group?.getAttribute('aria-disabled')).toBe('true');
  expect(group?.querySelector('.inner')?.hasAttribute('inert')).toBe(true);
});
