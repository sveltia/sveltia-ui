import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { text } from '../../test-utils/snippets.js';
import TabBox from './tab-box.svelte';

it('renders a vertical box by default', async () => {
  const screen = await render(TabBox, { class: 'custom', 'data-x': '1', children: text('child') });
  const box = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.tab-box'));

  expect(box.getAttribute('role')).toBe('none');
  expect(box.classList.contains('vertical')).toBe(true);
  expect(box.classList.contains('custom')).toBe(true);
  expect(box.getAttribute('data-x')).toBe('1');
  expect(box.textContent).toContain('child');
});

it('supports the horizontal orientation', async () => {
  const screen = await render(TabBox, { orientation: 'horizontal' });

  expect(screen.container.querySelector('.tab-box')?.classList.contains('horizontal')).toBe(true);
});
