import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SelectButton from './select-button.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

it('renders a radio-like button', async () => {
  const screen = await render(SelectButton, { label: 'Grid', class: 'custom' });
  const button = screen.getByRole('radio', { name: 'Grid' });

  await expect.element(button).toBeVisible();
  await expect.element(button).toHaveClass('sui', 'select-button', 'custom');
  await expect.element(button).toHaveAttribute('aria-checked', 'false');
});

it('reflects the selected state and updates it from the group’s Change event', async () => {
  const onChange = vi.fn();
  /** @type {ComponentProps<typeof SelectButton>} */
  const props = $state({ label: 'Grid', selected: true, onChange });
  const screen = await render(SelectButton, props);
  const button = screen.getByRole('radio');

  await expect.element(button).toHaveAttribute('aria-checked', 'true');
  // The parent radio group reports a selection change through a custom event on the button
  button.element().dispatchEvent(new CustomEvent('Change', { detail: { checked: false } }));
  await expect.element(button).toHaveAttribute('aria-checked', 'false');
  expect(props.selected).toBe(false);
  expect(onChange).toHaveBeenCalledOnce();
});
