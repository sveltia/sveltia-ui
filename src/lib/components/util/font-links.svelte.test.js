import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FontLinks from './font-links.svelte';

it('sets up an early connection to the font CDN', async () => {
  const screen = await render(FontLinks);
  const link = screen.container.querySelector('link[rel="preconnect"]');

  expect(link?.getAttribute('href')).toBe('https://cdn.jsdelivr.net/');
});
