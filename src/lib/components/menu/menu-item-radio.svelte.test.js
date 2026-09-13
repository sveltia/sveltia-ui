import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { html, text } from '../../test-utils/snippets.js';
import MenuItemRadio from './menu-item-radio.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

it('renders a radio menu item with a check icon while checked', async () => {
  const screen = await render(MenuItemRadio, {
    label: 'Ascending',
    checked: true,
    class: 'custom',
  });

  const item = screen.getByRole('menuitemradio', { name: /Ascending/ });

  await expect.element(item).toHaveAttribute('aria-checked', 'true');
  expect(screen.container.querySelector('.sui.menu-item-radio')?.classList.contains('custom')).toBe(
    true,
  );
  expect(item.element().querySelector('.icon')?.textContent?.trim()).toBe('check');
});

it('hides the check icon while unchecked, and renders the snippets', async () => {
  const screen = await render(MenuItemRadio, {
    checked: false,
    startIcon: html('<i class="start">S</i>'),
    children: text('Custom'),
  });

  const item = /** @type {HTMLElement} */ (
    screen.container.querySelector('[role="menuitemradio"]')
  );

  expect(item.getAttribute('aria-checked')).toBe('false');
  expect(item.querySelector('.icon')).toBeNull();
  expect(item.querySelector('.start')).not.toBeNull();
  expect(item.textContent).toContain('Custom');
});

it('follows the Change event from the parent menu', async () => {
  const onChange = vi.fn();
  /** @type {ComponentProps<typeof MenuItemRadio>} */
  const props = $state({ label: 'Ascending', checked: false, onChange });
  const screen = await render(MenuItemRadio, props);

  const item = /** @type {HTMLElement} */ (
    screen.container.querySelector('[role="menuitemradio"]')
  );

  item.dispatchEvent(new CustomEvent('Change', { detail: { checked: true } }));
  expect(props.checked).toBe(true);
  expect(onChange).toHaveBeenCalledOnce();
  await vi.waitFor(() => {
    expect(item.querySelector('.icon')).not.toBeNull();
  });
});

it('hides and disables the item', async () => {
  const screen = await render(MenuItemRadio, { label: 'Ascending', hidden: true, disabled: true });

  const item = /** @type {HTMLButtonElement} */ (
    screen.container.querySelector('[role="menuitemradio"]')
  );

  expect(item.hidden).toBe(true);
  expect(item.disabled).toBe(true);
});
