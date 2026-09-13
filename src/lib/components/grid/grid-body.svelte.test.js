import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { text } from '../../test-utils/snippets.js';
import GridBody from './grid-body.svelte';

it('renders a row group with the children', async () => {
  const screen = await render(GridBody, { class: 'custom', children: text('child') });
  const body = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.grid-body'));

  expect(body.getAttribute('role')).toBe('rowgroup');
  expect(body.getAttribute('aria-roledescription')).toBe('grid body');
  expect(body.classList.contains('custom')).toBe(true);
  expect(body.hasAttribute('aria-labelledby')).toBe(false);
  expect(body.querySelector('.row-group-caption')).toBeNull();
  expect(body.textContent).toContain('child');
});

it('renders a caption row when labelled', async () => {
  const screen = await render(GridBody, { label: 'Recent', children: text('child') });
  const body = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.grid-body'));
  const caption = /** @type {HTMLElement} */ (body.querySelector('.row-group-caption th'));

  expect(caption.getAttribute('role')).toBe('columnheader');
  expect(caption.textContent?.trim()).toBe('Recent');
  expect(body.getAttribute('aria-labelledby')).toBe(caption.id);
});
