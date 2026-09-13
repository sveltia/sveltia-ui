import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { text } from '../../../test-utils/snippets.js';
import ToolbarWrapper from './toolbar-wrapper.svelte';

it('wraps a toolbar with the given label and children', async () => {
  const screen = await render(ToolbarWrapper, { ariaLabel: 'Editing', children: text('child') });
  const toolbar = screen.getByRole('toolbar', { name: 'Editing' });

  expect(screen.container.querySelector('.wrapper')).not.toBeNull();
  expect(toolbar.element().textContent).toContain('child');
  await expect.element(toolbar).toHaveAttribute('aria-disabled', 'false');
});

it('disables the toolbar', async () => {
  const screen = await render(ToolbarWrapper, { disabled: true });

  expect(screen.container.querySelector('[role="toolbar"]')?.getAttribute('aria-disabled')).toBe(
    'true',
  );
});
