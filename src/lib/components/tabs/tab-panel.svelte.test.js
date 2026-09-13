import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { text } from '../../test-utils/snippets.js';
import TabPanel from './tab-panel.svelte';

it('renders the element with the role, classes, attributes and children', async () => {
  const screen = await render(TabPanel, {
    class: 'custom',
    'data-x': '1',
    children: text('child'),
  });

  const element = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.tab-panel'));

  expect(element.getAttribute('role')).toBe('tabpanel');
  expect(element.classList.contains('custom')).toBe(true);
  expect(element.getAttribute('data-x')).toBe('1');
  expect(element.textContent).toContain('child');
});
