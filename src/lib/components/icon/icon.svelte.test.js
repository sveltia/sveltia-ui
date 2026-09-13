import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Icon from './icon.svelte';

it('renders a decorative icon by default', async () => {
  const screen = await render(Icon, { name: 'search', class: 'custom' });
  const icon = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.icon'));

  expect(icon.classList.contains('material-symbols-outlined')).toBe(true);
  expect(icon.classList.contains('custom')).toBe(true);
  expect(icon.textContent?.trim()).toBe('search');
  expect(icon.getAttribute('aria-hidden')).toBe('true');
});

it('exposes the icon to assistive technology when labelled', async () => {
  const screen = await render(Icon, { name: 'close', 'aria-label': 'Close' });
  const icon = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.icon'));

  expect(icon.getAttribute('aria-hidden')).toBe('false');
  expect(icon.getAttribute('aria-label')).toBe('Close');
});
