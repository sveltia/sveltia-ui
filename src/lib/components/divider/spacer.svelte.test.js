import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Spacer from './spacer.svelte';

it('renders a fixed spacer by default', async () => {
  const screen = await render(Spacer, { class: 'custom', 'data-x': '1' });
  const spacer = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.spacer'));

  expect(spacer.getAttribute('role')).toBe('none');
  expect(spacer.classList.contains('custom')).toBe(true);
  expect(spacer.classList.contains('flex')).toBe(false);
  expect(spacer.getAttribute('data-x')).toBe('1');
});

it('can be flexible', async () => {
  const screen = await render(Spacer, { flex: true });

  expect(screen.container.querySelector('.spacer')?.classList.contains('flex')).toBe(true);
});
