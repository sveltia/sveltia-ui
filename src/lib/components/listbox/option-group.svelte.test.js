import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { text } from '../../test-utils/snippets.js';
import OptionGroup from './option-group.svelte';

it('renders a group labelled with the given label', async () => {
  const screen = await render(OptionGroup, {
    label: 'Fruits',
    class: 'custom',
    children: text('child'),
  });

  const group = screen.getByRole('group', { name: 'Fruits' });
  const label = /** @type {HTMLElement} */ (group.element().querySelector('.label'));

  await expect.element(group).toHaveClass('sui', 'option-group', 'custom');
  await expect.element(group).toHaveAttribute('aria-roledescription', 'option group');
  expect(group.element().getAttribute('aria-labelledby')).toBe(label.id);
  expect(label.querySelector('.truncated-text')?.textContent?.trim()).toBe('Fruits');
  expect(group.element().textContent).toContain('child');
});

it('hides and disables the group', async () => {
  const screen = await render(OptionGroup, { label: 'Fruits', hidden: true, disabled: true });
  const group = /** @type {HTMLElement} */ (screen.container.querySelector('[role="group"]'));

  expect(group.hidden).toBe(true);
  expect(group.getAttribute('aria-hidden')).toBe('true');
  expect(group.getAttribute('aria-disabled')).toBe('true');
  expect(group.querySelector('.inner')?.hasAttribute('inert')).toBe(true);
});
