import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { text } from '../../test-utils/snippets.js';
import FloatingActionButtonWrapper from './floating-action-button-wrapper.svelte';

it('renders the wrapper with the children', async () => {
  const screen = await render(FloatingActionButtonWrapper, { children: text('FAB') });
  const wrapper = screen.container.querySelector('.sui.floating-action-button-wrapper');

  expect(wrapper?.getAttribute('role')).toBe('none');
  expect(wrapper?.textContent).toContain('FAB');
});

it('renders an empty wrapper without children', async () => {
  const screen = await render(FloatingActionButtonWrapper);

  expect(screen.container.querySelector('.sui.floating-action-button-wrapper')?.textContent).toBe(
    '',
  );
});
