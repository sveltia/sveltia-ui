import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Divider from './divider.svelte';

it('renders a horizontal separator by default', async () => {
  const screen = await render(Divider, { class: 'custom', 'data-x': '1' });
  const divider = screen.getByRole('separator');

  await expect.element(divider).toHaveClass('sui', 'divider', 'custom');
  await expect.element(divider).toHaveAttribute('aria-orientation', 'horizontal');
  await expect.element(divider).toHaveAttribute('aria-hidden', 'false');
  await expect.element(divider).toHaveAttribute('data-x', '1');
});

it('supports the vertical orientation and a label', async () => {
  const screen = await render(Divider, { orientation: 'vertical', ariaLabel: 'Section' });
  const divider = screen.getByRole('separator', { name: 'Section' });

  await expect.element(divider).toHaveAttribute('aria-orientation', 'vertical');
});

it('can be hidden', async () => {
  const screen = await render(Divider, { hidden: true });
  const divider = /** @type {HTMLElement} */ (screen.container.querySelector('.divider'));

  expect(divider.hidden).toBe(true);
  expect(divider.getAttribute('aria-hidden')).toBe('true');
});
