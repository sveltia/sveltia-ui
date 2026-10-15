import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { text } from '../../../test-utils/snippets.js';
import { createEditorStore } from '../store.svelte.js';
import ToolbarWrapper from './toolbar-wrapper.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 * @import { TextEditorStore } from '#lib/typedefs.js';
 */

/**
 * Render the wrapper with an editor store in the context, like the editors do.
 * @param {ComponentProps<typeof ToolbarWrapper>} props Props.
 * @param {TextEditorStore} [store] Editor store.
 * @returns {ReturnType<typeof render>} Render result.
 */
const renderWrapper = (props, store = createEditorStore()) =>
  render(ToolbarWrapper, { props, context: new Map([['editorStore', store]]) });

it('wraps a toolbar with the given label and children', async () => {
  const screen = await renderWrapper({ ariaLabel: 'Editing', children: text('child') });
  const toolbar = screen.getByRole('toolbar', { name: 'Editing' });

  expect(screen.container.querySelector('.wrapper')).not.toBeNull();
  expect(toolbar.element().textContent).toContain('child');
  await expect.element(toolbar).toHaveAttribute('aria-disabled', 'false');
});

it('disables the toolbar', async () => {
  const screen = await renderWrapper({ disabled: true });

  expect(screen.container.querySelector('[role="toolbar"]')?.getAttribute('aria-disabled')).toBe(
    'true',
  );
});

it('keeps the toolbar height in the editor store until unmounted', async () => {
  const store = createEditorStore();
  const screen = await renderWrapper({ children: text('child') }, store);
  const toolbar = screen.getByRole('toolbar').element();

  await vi.waitFor(() => {
    expect(store.toolbarHeight).toBe(toolbar.getBoundingClientRect().height);
  });
  expect(store.toolbarHeight).toBeGreaterThan(0);

  screen.unmount();
  expect(store.toolbarHeight).toBe(0);
});
