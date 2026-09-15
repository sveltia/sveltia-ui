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
  // The status is spelled out for screen readers, ahead of the message
  expect(alert.element().querySelector('.status-label')?.textContent).toBe('Error');
  expect(alert.element().querySelector('.icon')?.textContent?.trim()).toBe('error');
});

it('renders a polite status for information and success, unless told otherwise', async () => {
  const screen = await render(Alert, { status: 'success' });
  const status = screen.getByRole('status');

  await expect.element(status).toHaveAttribute('aria-live', 'polite');
  expect(status.element().querySelector('.status-label')?.textContent).toBe('Success');
  expect(status.element().querySelector('.icon')?.textContent?.trim()).toBe('check_circle');
});

it('lets the politeness be overridden', async () => {
  const screen = await render(Alert, { status: 'info', ariaLive: 'assertive' });

  await expect.element(screen.getByRole('status')).toHaveAttribute('aria-live', 'assertive');
});

it('renders a custom icon instead', async () => {
  const screen = await render(Alert, { status: 'info', icon: html('<i class="custom">i</i>') });

  expect(screen.container.querySelector('.custom')).not.toBeNull();
  expect(screen.container.querySelector('.sui.icon')).toBeNull();
});
