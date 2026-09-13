import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { text } from '../../test-utils/snippets.js';
import TruncatedText from './truncated-text.svelte';

it('clamps to a single line by default', async () => {
  const screen = await render(TruncatedText, { children: text('Long text') });
  const span = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.truncated-text'));

  expect(span.getAttribute('role')).toBe('none');
  expect(span.textContent?.trim()).toBe('Long text');
  expect(span.getAttribute('style')).toContain('-webkit-line-clamp: 1');
  expect(span.getAttribute('style')).toContain('line-clamp: 1');
});

it('renders an empty span without children', async () => {
  const screen = await render(TruncatedText);

  expect(screen.container.querySelector('.sui.truncated-text')?.textContent?.trim()).toBe('');
});

it('clamps to the given number of lines', async () => {
  const screen = await render(TruncatedText, { lines: 3, children: text('Long text') });
  const span = /** @type {HTMLElement} */ (screen.container.querySelector('.sui.truncated-text'));

  expect(span.getAttribute('style')).toContain('line-clamp: 3');
});
