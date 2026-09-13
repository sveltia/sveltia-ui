import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { text } from '../../test-utils/snippets.js';
import ButtonGroup from './button-group.svelte';

it('renders a labelled group with the children', async () => {
  const screen = await render(ButtonGroup, {
    ariaLabel: 'Actions',
    class: 'custom',
    'data-x': '1',
    children: text('child'),
  });

  const group = screen.getByRole('group', { name: 'Actions' });

  await expect.element(group).toBeVisible();
  await expect.element(group).toHaveClass('sui', 'button-group', 'custom');
  await expect.element(group).toHaveAttribute('data-x', '1');
  await expect.element(group).toHaveTextContent('child');
});
