import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { text } from '../../test-utils/snippets.js';
import MenuItemGroup from './menu-item-group.svelte';

it('renders an unlabelled group by default', async () => {
  const screen = await render(MenuItemGroup, { class: 'custom', children: text('child') });
  const group = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.menu-item-group'));

  expect(group.getAttribute('role')).toBe('group');
  expect(group.getAttribute('aria-roledescription')).toBe('menu item group');
  expect(group.classList.contains('custom')).toBe(true);
  expect(group.id).toBeTruthy();
  expect(group.hasAttribute('aria-labelledby')).toBe(false);
  expect(group.querySelector('.title')).toBeNull();
  expect(group.textContent).toContain('child');
});

it('renders the title and labels the group with it', async () => {
  const screen = await render(MenuItemGroup, { title: 'Sort by' });
  const group = screen.getByRole('group', { name: 'Sort by' });
  const title = /** @type {HTMLElement} */ (group.element().querySelector('.title'));

  expect(group.element().getAttribute('aria-labelledby')).toBe(title.id);
});

it('hides and disables the group', async () => {
  const screen = await render(MenuItemGroup, { hidden: true, disabled: true });
  const group = /** @type {HTMLElement} */ (screen.container.querySelector('[role="group"]'));

  expect(group.hidden).toBe(true);
  expect(group.getAttribute('aria-hidden')).toBe('true');
  expect(group.getAttribute('aria-disabled')).toBe('true');
  expect(group.querySelector('.inner')?.hasAttribute('inert')).toBe(true);
});
