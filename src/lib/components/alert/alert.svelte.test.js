import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { html, text } from '../../test-utils/snippets.js';
import Alert from './alert.svelte';

it('renders an assertive alert with the status icon', async () => {
  const screen = await render(Alert, { status: 'error', children: text('Failed') });
  const alert = screen.getByRole('alert');

  await expect.element(alert).toHaveClass('sui', 'alert', 'error');
  await expect.element(alert).toHaveAttribute('aria-live', 'assertive');
  expect(alert.element().textContent).toContain('Failed');
  expect(alert.element().querySelector('.icon')?.textContent?.trim()).toBe('error');
});

it('uses the check icon for the success status', async () => {
  const screen = await render(Alert, { status: 'success', ariaLive: 'polite' });
  const alert = screen.getByRole('alert');

  await expect.element(alert).toHaveAttribute('aria-live', 'polite');
  expect(alert.element().querySelector('.icon')?.textContent?.trim()).toBe('check_circle');
});

it('renders a custom icon instead', async () => {
  const screen = await render(Alert, { status: 'info', icon: html('<i class="custom">i</i>') });

  expect(screen.container.querySelector('.custom')).not.toBeNull();
  expect(screen.container.querySelector('.sui.icon')).toBeNull();
});
