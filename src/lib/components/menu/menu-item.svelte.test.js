import { afterEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { html, text } from '../../test-utils/snippets.js';
import MenuItem from './menu-item.svelte';
import { setRTL } from '../../test-utils/locale.js';

afterEach(() => {
  setRTL(false);
});

it('renders a menu item with the label', async () => {
  const onclick = vi.fn();

  const screen = await render(MenuItem, {
    label: 'Rename',
    labelDir: 'auto',
    class: 'custom',
    onclick,
  });

  const item = screen.getByRole('menuitem', { name: 'Rename' });
  const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.menuitem'));

  expect(wrapper.classList.contains('custom')).toBe(true);
  expect(item.element().hasAttribute('aria-haspopup')).toBe(false);
  expect(item.element().hasAttribute('aria-expanded')).toBe(false);
  expect(item.element().querySelector('.content')?.getAttribute('dir')).toBe('auto');
  expect(item.element().querySelector('.content')?.classList.contains('label')).toBe(true);
  expect(item.element().querySelector('.icon-outer')).toBeNull();
  await item.click();
  expect(onclick).toHaveBeenCalledOnce();
});

it('renders children instead of a label, along with the icons', async () => {
  const screen = await render(MenuItem, {
    children: text('Custom'),
    startIcon: html('<i class="start">S</i>'),
    endIcon: html('<i class="end">E</i>'),
  });

  const item = /** @type {HTMLElement} */ (screen.container.querySelector('[role="menuitem"]'));

  expect(item.querySelector('.content')?.textContent?.trim()).toBe('Custom');
  expect(item.querySelector('.content')?.classList.contains('label')).toBe(false);
  expect(item.querySelector('.start')).not.toBeNull();
  expect(item.querySelector('.end')).not.toBeNull();
});

it('supports the checkbox and radio roles', async () => {
  const checkbox = await render(MenuItem, { label: 'Pin', role: 'menuitemcheckbox' });

  expect(checkbox.container.querySelector('[role="menuitemcheckbox"]')).not.toBeNull();

  const radio = await render(MenuItem, { label: 'Asc', role: 'menuitemradio' });

  expect(radio.container.querySelector('[role="menuitemradio"]')).not.toBeNull();
});

it('marks an item with a submenu, and shows a chevron', async () => {
  const screen = await render(MenuItem, {
    label: 'Share',
    items: html('<div role="menuitem">Sub</div>'),
  });

  const item = screen.getByRole('menuitem', { name: /Share/ });

  await expect.element(item).toHaveAttribute('aria-haspopup', 'menu');
  await expect.element(item).toHaveAttribute('aria-expanded', 'false');
  expect(item.element().querySelector('.icon-outer .icon')?.textContent?.trim()).toBe(
    'chevron_right',
  );
});

it('mirrors the chevron in a right-to-left locale', async () => {
  setRTL(true);

  const screen = await render(MenuItem, {
    label: 'Share',
    items: html('<div role="menuitem">Sub</div>'),
  });

  expect(screen.container.querySelector('.icon-outer .icon')?.textContent?.trim()).toBe(
    'chevron_left',
  );
});

it('renders a custom chevron for the submenu', async () => {
  const screen = await render(MenuItem, {
    label: 'Share',
    items: html('<div role="menuitem">Sub</div>'),
    chevronIcon: html('<i class="chevron">></i>'),
  });

  expect(screen.container.querySelector('.icon-outer .chevron')).not.toBeNull();
});

it('hides and disables the item', async () => {
  const screen = await render(MenuItem, { label: 'Rename', hidden: true, disabled: true });
  const wrapper = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.menuitem'));
  const item = /** @type {HTMLButtonElement} */ (wrapper.querySelector('[role="menuitem"]'));

  expect(wrapper.hidden).toBe(true);
  expect(item.hidden).toBe(true);
  expect(item.disabled).toBe(true);
});
