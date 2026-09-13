import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { text } from '../../test-utils/snippets.js';
import GridHead from './grid-head.svelte';

it('renders the element with the role, classes, attributes and children', async () => {
  const screen = await render(GridHead, {
    class: 'custom',
    'data-x': '1',
    children: text('child'),
  });

  const element = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.grid-head'));

  expect(element.getAttribute('role')).toBe('rowgroup');
  expect(element.classList.contains('custom')).toBe(true);
  expect(element.getAttribute('data-x')).toBe('1');
  expect(element.textContent).toContain('child');
  expect(element.getAttribute('aria-roledescription')).toBe('grid head');
});
