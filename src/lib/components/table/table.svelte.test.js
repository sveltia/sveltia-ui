import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { text } from '../../test-utils/snippets.js';
import Table from './table.svelte';

it('renders a labelled table with the children', async () => {
  const screen = await render(Table, {
    ariaLabel: 'Files',
    class: 'custom',
    'data-x': '1',
    children: text('child'),
  });

  const table = screen.getByRole('table', { name: 'Files' });

  await expect.element(table).toHaveClass('sui', 'table', 'custom');
  await expect.element(table).toHaveAttribute('data-x', '1');
  expect(table.element().textContent).toContain('child');
});
