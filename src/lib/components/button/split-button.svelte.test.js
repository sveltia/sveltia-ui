import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { html } from '../../test-utils/snippets.js';
import SplitButton from './split-button.svelte';

it('renders the main button and the options button in a labelled group', async () => {
  const onclick = vi.fn();
  const screen = await render(SplitButton, { label: 'Paste', variant: 'primary', onclick });
  const group = screen.getByRole('group', { name: /Paste.*Options/ });

  await expect.element(group).toBeVisible();
  await expect.element(group).toHaveClass('sui', 'split-button');

  const main = screen.getByRole('button', { name: 'Paste' });
  const more = screen.getByRole('button', { name: 'More Options' });

  await expect.element(main).toHaveClass('primary');
  await expect.element(more).toHaveClass('primary', 'iconic');
  await expect.element(more).toHaveAttribute('aria-haspopup', 'menu');
  await main.click();
  expect(onclick).toHaveBeenCalledOnce();
});

it('disables and hides both buttons', async () => {
  const screen = await render(SplitButton, { label: 'Paste', disabled: true, hidden: true });
  const group = /** @type {HTMLElement} */ (screen.container.querySelector('.split-button'));

  expect(group.hidden).toBe(true);
  expect(group.getAttribute('aria-disabled')).toBe('true');
  screen.container.querySelectorAll('button').forEach((button) => {
    expect(button.disabled).toBe(true);
    expect(button.hidden).toBe(true);
  });
});

it('opens the popup from the options button', async () => {
  const screen = await render(SplitButton, {
    label: 'Paste',
    chevronIcon: html('<i class="chevron">v</i>'),
    popup: html('<div role="menu" tabindex="-1"><div role="menuitem" tabindex="0">A</div></div>'),
  });

  expect(screen.container.querySelector('.chevron')).not.toBeNull();
  await screen.getByRole('button', { name: 'More Options' }).click();
  await vi.waitFor(() => {
    expect(document.querySelector('dialog.popup [role="menuitem"]')?.checkVisibility()).toBe(true);
  });
});
