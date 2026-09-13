import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { text } from '../../test-utils/snippets.js';
import Menu from './menu.svelte';

it('renders a menu with the state attributes', async () => {
  const screen = await render(Menu, {
    ariaLabel: 'Actions',
    class: 'custom',
    'data-x': '1',
    children: text('child'),
  });

  const menu = screen.getByRole('menu', { name: 'Actions' });

  await expect.element(menu).toHaveClass('sui', 'menu', 'custom');
  await expect.element(menu).toHaveAttribute('data-x', '1');
  await expect.element(menu).toHaveAttribute('aria-hidden', 'false');
  await expect.element(menu).toHaveAttribute('aria-disabled', 'false');
  expect(menu.element().textContent).toContain('child');
});

it('hides and disables the menu, and forwards the Change event', async () => {
  const onChange = vi.fn();
  const screen = await render(Menu, { hidden: true, disabled: true, onChange });
  const menu = /** @type {HTMLElement} */ (screen.container.querySelector('[role="menu"]'));

  expect(menu.hidden).toBe(true);
  expect(menu.getAttribute('aria-hidden')).toBe('true');
  expect(menu.getAttribute('aria-disabled')).toBe('true');
  menu.dispatchEvent(new CustomEvent('Change', { detail: { value: 'x' } }));
  expect(onChange).toHaveBeenCalledOnce();
});
