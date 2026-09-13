import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { text } from '../../test-utils/snippets.js';
import VisibilityObserver from './visibility-observer.svelte';

it('renders the children once the placeholder becomes visible', async () => {
  const screen = await render(VisibilityObserver, { children: text('Loaded') });

  await expect.element(screen.getByText('Loaded')).toBeVisible();
  expect(screen.container.querySelector('.placeholder')).toBeNull();
});

it('keeps a placeholder while it is out of view', async () => {
  const wrapper = document.createElement('div');

  // A scroll container far too short to reveal anything placed a long way down
  wrapper.style.cssText = 'height: 50px; overflow: hidden;';
  wrapper.innerHTML = '<div style="height: 5000px"></div>';
  document.body.appendChild(wrapper);

  const screen = await render(
    VisibilityObserver,
    { children: text('Loaded') },
    { baseElement: wrapper },
  );

  // Give the observer a chance to fire, which it shouldn’t
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  });

  expect(screen.container.querySelector('.placeholder')).not.toBeNull();
  expect(screen.container.textContent).not.toContain('Loaded');
});
