import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { html, text } from '../../test-utils/snippets.js';
import Infobar from './infobar.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

it('renders a polite info message with a dismiss button', async () => {
  const screen = await render(Infobar, { children: text('Heads up') });
  const message = screen.getByRole('status');

  await expect.element(message).toHaveAttribute('aria-live', 'polite');
  expect(message.element().textContent).toContain('Heads up');
  expect(message.element().querySelector('.status-label')?.textContent).toBe('Information');
  expect(screen.container.querySelector('.infobar')?.classList.contains('info')).toBe(true);
  expect(message.element().querySelector('.icon')?.textContent?.trim()).toBe('info');
  await expect.element(screen.getByRole('button', { name: 'Dismiss' })).toBeVisible();
});

it('reflects the status and live politeness, and accepts a custom icon', async () => {
  const screen = await render(Infobar, {
    status: 'success',
    ariaLive: 'assertive',
    icon: html('<i class="custom">i</i>'),
  });

  expect(screen.container.querySelector('.infobar')?.classList.contains('success')).toBe(true);
  await expect.element(screen.getByRole('status')).toHaveAttribute('aria-live', 'assertive');
  expect(screen.container.querySelector('.custom')).not.toBeNull();
});

it('interrupts with an alert for errors and warnings', async () => {
  const screen = await render(Infobar, { status: 'error', children: text('Failed') });
  const message = screen.getByRole('alert');

  await expect.element(message).toHaveAttribute('aria-live', 'assertive');
  expect(message.element().querySelector('.status-label')?.textContent).toBe('Error');
});

it('uses the check icon for the success status', async () => {
  const screen = await render(Infobar, { status: 'success' });

  expect(screen.container.querySelector('.message .icon')?.textContent?.trim()).toBe(
    'check_circle',
  );
});

it('hides the dismiss button when not dismissible', async () => {
  const screen = await render(Infobar, { dismissible: false });

  expect(screen.container.querySelector('button')).toBeNull();
});

it('hides itself when dismissed', async () => {
  const onDismiss = vi.fn();
  /** @type {ComponentProps<typeof Infobar>} */
  const props = $state({ show: true, onDismiss });
  const screen = await render(Infobar, props);

  await screen.getByRole('button', { name: 'Dismiss' }).click();
  expect(props.show).toBe(false);
  expect(onDismiss).toHaveBeenCalledOnce();
  await vi.waitFor(() => {
    expect(screen.container.querySelector('.infobar')).toBeNull();
  });
});

it('renders nothing while hidden', async () => {
  const screen = await render(Infobar, { show: false });

  expect(screen.container.querySelector('.infobar')).toBeNull();
});
