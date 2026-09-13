import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { text } from '../../test-utils/snippets.js';
import EmptyState from './empty-state.svelte';

it('renders the children in a wrapper', async () => {
  const screen = await render(EmptyState, { children: text('Nothing here') });
  const wrapper = screen.container.querySelector('.sui.empty-state');

  expect(wrapper).not.toBeNull();
  expect(wrapper?.getAttribute('role')).toBe('none');
  await expect.element(screen.getByText('Nothing here')).toBeVisible();
});

it('renders an empty wrapper without children', async () => {
  const screen = await render(EmptyState);

  expect(screen.container.querySelector('.sui.empty-state')?.textContent?.trim()).toBe('');
});
