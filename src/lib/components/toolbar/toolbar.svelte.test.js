import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { text } from '../../test-utils/snippets.js';
import Toolbar from './toolbar.svelte';

it('renders a horizontal toolbar by default', async () => {
  const screen = await render(Toolbar, {
    ariaLabel: 'Editing',
    class: 'custom',
    variant: 'primary',
    'data-x': '1',
    children: text('child'),
  });

  const toolbar = screen.getByRole('toolbar', { name: 'Editing' });

  await expect.element(toolbar).toHaveClass('sui', 'toolbar', 'horizontal', 'primary', 'custom');
  await expect.element(toolbar).toHaveAttribute('aria-orientation', 'horizontal');
  await expect.element(toolbar).toHaveAttribute('data-x', '1');
  expect(toolbar.element().textContent).toContain('child');
});

it('supports the vertical orientation', async () => {
  const screen = await render(Toolbar, { orientation: 'vertical' });
  const toolbar = screen.getByRole('toolbar');

  await expect.element(toolbar).toHaveClass('vertical');
  await expect.element(toolbar).toHaveAttribute('aria-orientation', 'vertical');
});

it('hides and disables the toolbar', async () => {
  const screen = await render(Toolbar, { hidden: true, disabled: true });
  const toolbar = /** @type {HTMLElement} */ (screen.container.querySelector('[role="toolbar"]'));

  expect(toolbar.hidden).toBe(true);
  expect(toolbar.getAttribute('aria-hidden')).toBe('true');
  expect(toolbar.getAttribute('aria-disabled')).toBe('true');
  expect(toolbar.querySelector('.inner')?.hasAttribute('inert')).toBe(true);
});
