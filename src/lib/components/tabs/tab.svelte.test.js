import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { html, text } from '../../test-utils/snippets.js';
import Tab from './tab.svelte';

it('renders a tab button with the label', async () => {
  const screen = await render(Tab, { label: 'General', class: 'custom', 'aria-controls': 'p1' });
  const tab = screen.getByRole('tab', { name: 'General' });

  await expect.element(tab).toHaveClass('sui', 'tab', 'custom');
  await expect.element(tab).toHaveAttribute('aria-selected', 'false');
  await expect.element(tab).toHaveAttribute('aria-controls', 'p1');
});

it('reflects the selected, hidden and disabled states', async () => {
  const screen = await render(Tab, {
    label: 'General',
    selected: true,
    hidden: true,
    disabled: true,
  });

  const tab = /** @type {HTMLButtonElement} */ (screen.container.querySelector('[role="tab"]'));

  expect(tab.getAttribute('aria-selected')).toBe('true');
  expect(tab.hidden).toBe(true);
  expect(tab.disabled).toBe(true);
});

it('renders the icon and children snippets', async () => {
  const screen = await render(Tab, {
    startIcon: html('<i class="start">S</i>'),
    endIcon: html('<i class="end">E</i>'),
    children: text('Child'),
  });

  const tab = /** @type {HTMLElement} */ (screen.container.querySelector('[role="tab"]'));

  expect(tab.textContent?.replace(/\s+/g, ' ').trim()).toBe('S Child E');
});
