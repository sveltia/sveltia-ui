import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { text } from '../../test-utils/snippets.js';
import GridRow from './grid-row.svelte';

it('renders a focusable row', async () => {
  const screen = await render(GridRow, { class: 'custom', 'data-x': '1', children: text('cell') });
  const row = screen.getByRole('row');

  await expect.element(row).toHaveClass('sui', 'grid-row', 'custom');
  await expect.element(row).toHaveAttribute('tabindex', '0');
  await expect.element(row).toHaveAttribute('aria-selected', 'false');
  await expect.element(row).toHaveAttribute('data-x', '1');
  expect(row.element().textContent).toContain('cell');
});

it('reflects the selected state', async () => {
  const screen = await render(GridRow, { selected: true });

  await expect.element(screen.getByRole('row')).toHaveAttribute('aria-selected', 'true');
});
