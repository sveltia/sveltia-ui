import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { whenActivated } from '../../test-utils/group.js';
import { text } from '../../test-utils/snippets.js';
import GridFixture from './grid-fixture.test.svelte';
import Grid from './grid.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

it('renders a labelled grid and exposes its element', async () => {
  /** @type {ComponentProps<typeof Grid>} */
  const props = $state({
    element: undefined,
    ariaLabel: 'Files',
    class: 'custom',
    'data-x': '1',
    multiple: true,
    children: text('child'),
  });

  const screen = await render(Grid, props);
  const grid = screen.getByRole('grid', { name: 'Files' });

  await expect.element(grid).toHaveClass('sui', 'grid', 'custom');
  await expect.element(grid).toHaveAttribute('data-x', '1');
  await expect.element(grid).toHaveAttribute('aria-multiselectable', 'true');
  expect(props.element).toBe(grid.element());
});

it('selects the first row by default and another when clicked', async () => {
  const onChange = vi.fn();
  const activated = whenActivated();
  const screen = await render(GridFixture, { onChange });

  await activated;

  const [alpha, beta] = screen.getByRole('row').all();

  await expect.element(alpha).toHaveAttribute('aria-selected', 'true');
  await expect.element(alpha).toHaveAttribute('tabindex', '0');
  await expect.element(beta).toHaveAttribute('tabindex', '-1');
  await beta.click();
  await expect.element(beta).toHaveAttribute('aria-selected', 'true');
  await expect.element(alpha).toHaveAttribute('aria-selected', 'false');
  expect(onChange).toHaveBeenCalledOnce();
  expect(onChange.mock.calls[0][0].detail.value).toBe('b');
});

it('leaves the selection alone when click to select is disabled', async () => {
  const activated = whenActivated();
  const screen = await render(GridFixture, { clickToSelect: false });

  await activated;

  const [alpha, beta] = screen.getByRole('row').all();

  await beta.click();
  await expect.element(alpha).toHaveAttribute('aria-selected', 'true');
  await expect.element(beta).toHaveAttribute('aria-selected', 'false');
});

it('allows selecting several rows when multiple', async () => {
  const activated = whenActivated();
  const screen = await render(GridFixture, { multiple: true });

  await activated;

  const [alpha, beta] = screen.getByRole('row').all();

  await beta.click();
  await expect.element(alpha).toHaveAttribute('aria-selected', 'true');
  await expect.element(beta).toHaveAttribute('aria-selected', 'true');
  await beta.click();
  await expect.element(beta).toHaveAttribute('aria-selected', 'false');
});
