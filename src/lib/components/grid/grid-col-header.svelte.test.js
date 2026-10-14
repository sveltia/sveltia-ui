import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import { text } from '../../test-utils/snippets.js';
import GridColHeader from './grid-col-header.svelte';

it('renders the element with the role, classes, attributes and children', async () => {
  const screen = await render(GridColHeader, {
    class: 'custom',
    'data-x': '1',
    children: text('child'),
  });

  const element = /** @type {HTMLElement} */ (
    screen.container.querySelector('.sui.grid-col-header')
  );

  expect(element.getAttribute('role')).toBe('columnheader');
  expect(element.classList.contains('custom')).toBe(true);
  expect(element.getAttribute('data-x')).toBe('1');
  expect(element.textContent).toContain('child');
  expect(element.hasAttribute('aria-sort')).toBe(false);
  expect(element.classList.contains('sortable')).toBe(false);
  expect(element.querySelector('button')).toBeNull();
});

it.each([
  ['ascending', 'arrow_upward', 'descending'],
  ['descending', 'arrow_downward', 'ascending'],
  ['none', 'arrow_upward', 'ascending'],
])('renders a sort button when sorted in %s order', async (sortOrder, iconName, nextSortOrder) => {
  const onSort = vi.fn();

  const screen = await render(GridColHeader, {
    class: 'custom',
    'data-x': '1',
    sortOrder: /** @type {'ascending' | 'descending' | 'none'} */ (sortOrder),
    onSort,
    children: text('Name'),
  });

  const header = screen.getByRole('columnheader');
  const button = screen.getByRole('button', { name: 'Name' });

  // Only the sorted column has `aria-sort`
  if (sortOrder === 'none') {
    await expect.element(header).not.toHaveAttribute('aria-sort');
  } else {
    await expect.element(header).toHaveAttribute('aria-sort', sortOrder);
  }

  await expect.element(header).toHaveClass('sui', 'grid-col-header', 'sortable', 'custom');
  await expect.element(header).toHaveAttribute('data-x', '1');

  const icon = /** @type {HTMLElement} */ (button.element().querySelector('.sort-icon'));

  expect(icon.textContent?.trim()).toBe(iconName);
  expect(icon.classList.contains(sortOrder)).toBe(true);
  expect(icon.getAttribute('aria-hidden')).toBe('true');

  await button.click();
  expect(onSort).toHaveBeenCalledOnce();
  expect(onSort.mock.calls[0][0].detail).toEqual({ sortOrder: nextSortOrder });

  /** @type {HTMLElement} */ (button.element()).focus();
  await userEvent.keyboard('{Enter}');
  expect(onSort).toHaveBeenCalledTimes(2);
  expect(onSort.mock.calls[1][0].detail).toEqual({ sortOrder: nextSortOrder });
});

it('renders a sort button without a class or a handler', async () => {
  const screen = await render(GridColHeader, { sortOrder: 'none', children: text('Name') });
  const header = screen.getByRole('columnheader');

  await expect.element(header).toHaveClass('sui', 'grid-col-header', 'sortable');
  expect(header.element().className).not.toContain('undefined');
  await screen.getByRole('button', { name: 'Name' }).click();
});

it('stops the click on the sort button from bubbling, but not the arrow keys', async () => {
  const onClick = vi.fn();
  const onKeyDown = vi.fn();
  const screen = await render(GridColHeader, { sortOrder: 'none', children: text('Name') });
  const { container } = screen;

  container.addEventListener('click', onClick);
  container.addEventListener('keydown', onKeyDown);

  const button = screen.getByRole('button', { name: 'Name' });

  await button.click();
  expect(onClick).not.toHaveBeenCalled();
  /** @type {HTMLElement} */ (button.element()).focus();
  await userEvent.keyboard('{Enter}');
  await userEvent.keyboard(' ');
  expect(onKeyDown).not.toHaveBeenCalled();
  await userEvent.keyboard('{ArrowDown}');
  expect(onKeyDown).toHaveBeenCalledOnce();
});

it('sorts the column when the header cell’s padding is clicked', async () => {
  const onSort = vi.fn();

  const screen = await render(GridColHeader, {
    style: 'display: block; padding: 20px',
    sortOrder: 'none',
    onSort,
    children: text('Name'),
  });

  const header = /** @type {HTMLElement} */ (screen.getByRole('columnheader').element());
  const { left, top } = header.getBoundingClientRect();

  // A point within the padding, outside the button’s own box
  /** @type {HTMLElement} */ (document.elementFromPoint(left + 5, top + 5)).click();

  expect(onSort).toHaveBeenCalledOnce();
  expect(onSort.mock.calls[0][0].detail).toEqual({ sortOrder: 'ascending' });
});
