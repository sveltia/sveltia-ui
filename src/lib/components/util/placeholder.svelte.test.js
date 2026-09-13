import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { html } from '../../test-utils/snippets.js';
import Placeholder from './placeholder.svelte';

it('renders its children without any wrapper element', async () => {
  const screen = await render(Placeholder, { children: html('<em>content</em>') });

  expect(screen.container.children).toHaveLength(1);
  expect(screen.container.firstElementChild?.outerHTML).toBe('<em>content</em>');
});

it('renders nothing without children', async () => {
  const screen = await render(Placeholder);

  expect(screen.container.children).toHaveLength(0);
  expect(screen.container.textContent).toBe('');
});
