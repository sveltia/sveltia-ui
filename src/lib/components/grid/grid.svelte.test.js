import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
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

it('selects nothing by default, and a row when clicked', async () => {
  const onChange = vi.fn();
  const activated = whenActivated();
  const screen = await render(GridFixture, { onChange });

  await activated;

  const [alpha, beta] = screen.getByRole('row').all();

  // Nothing is selected until the user selects something; the first row is only the tab stop
  await expect.element(alpha).toHaveAttribute('aria-selected', 'false');
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
  await expect.element(alpha).toHaveAttribute('aria-selected', 'false');
  await expect.element(beta).toHaveAttribute('aria-selected', 'false');
});

it('allows selecting several rows when multiple', async () => {
  const activated = whenActivated();
  const screen = await render(GridFixture, { multiple: true });

  await activated;

  const [alpha, beta] = screen.getByRole('row').all();

  await alpha.click();
  await beta.click();
  await expect.element(alpha).toHaveAttribute('aria-selected', 'true');
  await expect.element(beta).toHaveAttribute('aria-selected', 'true');
  await beta.click();
  await expect.element(beta).toHaveAttribute('aria-selected', 'false');
});

it('moves through the rows with the arrow keys, Home and End', async () => {
  const activated = whenActivated();
  const screen = await render(GridFixture, { multiple: true });

  await activated;

  const [alpha, beta, gamma] = screen.getByRole('row').all();

  /** @type {HTMLElement} */ (alpha.element()).focus();
  await userEvent.keyboard('{ArrowDown}');
  await vi.waitFor(() => {
    expect(document.activeElement).toBe(beta.element());
  });
  await expect.element(beta).toHaveAttribute('tabindex', '0');
  await expect.element(alpha).toHaveAttribute('tabindex', '-1');
  // Moving doesn’t select in a multi-select grid; Space does
  await expect.element(beta).toHaveAttribute('aria-selected', 'false');
  await userEvent.keyboard(' ');
  await expect.element(beta).toHaveAttribute('aria-selected', 'true');
  await userEvent.keyboard('{End}');
  await vi.waitFor(() => {
    expect(document.activeElement).toBe(gamma.element());
  });
  await userEvent.keyboard('{ArrowUp}{ArrowUp}');
  await vi.waitFor(() => {
    expect(document.activeElement).toBe(alpha.element());
  });
  await userEvent.keyboard('{End}{Home}');
  await vi.waitFor(() => {
    expect(document.activeElement).toBe(alpha.element());
  });
});

it('keeps a single tab stop when rows are added after activation', async () => {
  /** @type {ComponentProps<typeof GridFixture>} */
  const props = $state({ values: ['a'] });
  const activated = whenActivated();
  const screen = await render(GridFixture, props);

  await activated;

  props.values = ['a', 'b', 'c'];
  await vi.waitFor(() => {
    expect(screen.getByRole('row').all()).toHaveLength(3);
  });

  const [alpha, beta, gamma] = screen.getByRole('row').all();

  await expect.element(alpha).toHaveAttribute('tabindex', '0');
  await expect.element(beta).toHaveAttribute('tabindex', '-1');
  await expect.element(gamma).toHaveAttribute('tabindex', '-1');

  /** @type {HTMLElement} */ (alpha.element()).focus();
  await userEvent.keyboard('{ArrowDown}');
  await vi.waitFor(() => {
    expect(document.activeElement).toBe(beta.element());
  });
});

it('keeps the tab stop on the row the user moved to when rows are added', async () => {
  /** @type {ComponentProps<typeof GridFixture>} */
  const props = $state({ values: ['a', 'b', 'c'], multiple: true });
  const activated = whenActivated();
  const screen = await render(GridFixture, props);

  await activated;

  const [alpha, beta] = screen.getByRole('row').all();

  /** @type {HTMLElement} */ (alpha.element()).focus();
  await userEvent.keyboard('{ArrowDown}');
  await vi.waitFor(() => {
    expect(document.activeElement).toBe(beta.element());
  });

  // Rows arriving with the data, or a cell re-rendering, must not hand the stop back to row 1
  props.values = ['a', 'b', 'c', 'd', 'e'];
  await vi.waitFor(() => {
    expect(screen.getByRole('row').all()).toHaveLength(5);
  });
  await expect.element(beta).toHaveAttribute('tabindex', '0');
  await expect.element(alpha).toHaveAttribute('tabindex', '-1');
  await expect.element(screen.getByRole('row').nth(4)).toHaveAttribute('tabindex', '-1');

  // The same with nothing focused: the row holding the stop keeps it
  /** @type {HTMLElement} */ (beta.element()).blur();
  props.values = ['a', 'b', 'c', 'd'];
  await vi.waitFor(() => {
    expect(screen.getByRole('row').all()).toHaveLength(4);
  });
  await expect.element(beta).toHaveAttribute('tabindex', '0');
  await expect.element(alpha).toHaveAttribute('tabindex', '-1');
});

it('moves from the row a control belongs to when the arrows are pressed on it', async () => {
  const activated = whenActivated();
  const screen = await render(GridFixture, { withButtons: true });

  await activated;

  const [, beta, gamma] = screen.getByRole('row').all();

  screen.getByRole('button', { name: 'Beta' }).element().focus();
  await userEvent.keyboard('{ArrowDown}');
  await vi.waitFor(() => {
    expect(document.activeElement).toBe(gamma.element());
  });
  await userEvent.keyboard('{ArrowUp}');
  await vi.waitFor(() => {
    expect(document.activeElement).toBe(beta.element());
  });
});
