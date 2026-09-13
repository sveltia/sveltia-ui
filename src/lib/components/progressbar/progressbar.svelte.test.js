import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Progressbar from './progressbar.svelte';

it('renders the progress with the default range', async () => {
  const screen = await render(Progressbar, { now: 40, ariaLabel: 'Upload', class: 'custom' });
  const bar = screen.getByRole('progressbar', { name: 'Upload' });

  await expect.element(bar).toHaveClass('sui', 'progressbar', 'custom');
  await expect.element(bar).toHaveAttribute('aria-valuenow', '40');
  await expect.element(bar).toHaveAttribute('aria-valuemin', '0');
  await expect.element(bar).toHaveAttribute('aria-valuemax', '100');
  expect(bar.element().hasAttribute('aria-valuetext')).toBe(false);
  expect(/** @type {HTMLElement} */ (bar.element().firstElementChild).style.width).toBe('40%');
});

it('accepts a custom range and text', async () => {
  const screen = await render(Progressbar, { now: 5, min: 1, max: 10, text: 'Step 5 of 10' });
  const bar = screen.getByRole('progressbar');

  await expect.element(bar).toHaveAttribute('aria-valuemin', '1');
  await expect.element(bar).toHaveAttribute('aria-valuemax', '10');
  await expect.element(bar).toHaveAttribute('aria-valuetext', 'Step 5 of 10');
});
