import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import { getEditorStore } from '../../../test-utils/editor.js';
import EditorFixture from '../editor-fixture.test.svelte';
import InsertLinkButton from './insert-link-button.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

// Pretend not to be on a Mac, so the shortcut is Ctrl+K rather than Cmd+K
vi.mock('@sveltia/utils/events', async (importOriginal) => ({
  .../** @type {object} */ (await importOriginal()),
  /**
   * Whether the platform is macOS.
   * @returns {boolean} Never.
   */
  isMac: () => false,
}));

it('opens the dialog with Ctrl+K on other platforms', async () => {
  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({ store: undefined, component: InsertLinkButton });
  const screen = await render(EditorFixture, props);
  const store = getEditorStore(props);
  const root = /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root'));

  await vi.waitFor(() => {
    expect(store.initialized).toBe(true);
  });
  store.inputValue = 'Hello';
  await vi.waitFor(() => {
    expect(root.textContent).toBe('Hello');
  });
  root.focus();
  await userEvent.keyboard('{Control>}k{/Control}');
  await vi.waitFor(() => {
    expect(/** @type {HTMLDialogElement | null} */ (document.querySelector('dialog'))?.open).toBe(
      true,
    );
  });
});
