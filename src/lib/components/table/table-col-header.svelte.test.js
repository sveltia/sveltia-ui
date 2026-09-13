import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { text } from '../../test-utils/snippets.js';
import TableColHeader from './table-col-header.svelte';

it('renders the element with the role, classes, attributes and children', async () => {
  const screen = await render(TableColHeader, {
    class: 'custom',
    'data-x': '1',
    children: text('child'),
  });

  const element = /** @type {HTMLElement} */ (
    screen.container.querySelector('.sui.table-col-header')
  );

  expect(element.getAttribute('role')).toBe('columnheader');
  expect(element.classList.contains('custom')).toBe(true);
  expect(element.getAttribute('data-x')).toBe('1');
  expect(element.textContent).toContain('child');
});
