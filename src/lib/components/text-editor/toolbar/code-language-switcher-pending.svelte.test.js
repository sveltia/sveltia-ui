import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import { getEditorStore } from '../../../test-utils/editor.js';
import EditorFixture from '../editor-fixture.test.svelte';
import { setCodeHighlighterLoaders } from '../shiki/loader.js';
import CodeLanguageSwitcher from './code-language-switcher.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

it('reports the content as pending while the highlighter for a new language loads', async () => {
  /** @type {PromiseWithResolvers<any>} */
  const { promise, reject } = Promise.withResolvers();

  // Hold the engine, which a language change waits for, so that the wait can be observed. The
  // loaders and the engine state are shared by everything in this file, so this is the only test
  // here: a held engine any other test ran into would never load
  setCodeHighlighterLoaders({
    /**
     * Wait for the engine until the test gives up on it.
     * @returns {Promise<any>} Promise that never resolves.
     */
    loadEngine: () => promise,
  });

  /** @type {ComponentProps<typeof EditorFixture>} */
  const props = $state({
    store: undefined,
    config: { isCodeEditor: true },
    component: CodeLanguageSwitcher,
  });

  const screen = await render(EditorFixture, props);
  const store = getEditorStore(props);

  try {
    await vi.waitFor(() => {
      expect(store.initialized).toBe(true);
    });
    // A plain code block needs no highlighter, so the engine is only loaded once a language is
    // picked below
    store.inputValue = '```plain\nx\n```';
    await vi.waitFor(() => {
      expect(screen.container.querySelector('.lexical-root code')).not.toBeNull();
    });
    await vi.waitFor(() => {
      expect(store.pending).toBe(false);
    });

    await screen.getByRole('combobox', { name: 'Language' }).click();
    await screen.getByRole('searchbox', { name: 'Filter Options' }).fill('HTML');
    await screen.getByRole('option', { name: 'HTML' }).click();

    // The change hasn’t reached the editor, so a consumer reading the content would still get the
    // previous language. The flag the editor sets for itself doesn’t cover this wait: the focus
    // move the switcher makes first fires an update, which clears it again
    expect(store.pending).toBe(true);
    expect(store.inputValue).toBe('```plain\nx\n```');
  } finally {
    // Give up on the engine, which leaves the block unhighlighted but still changes its language.
    // This runs even if an assertion above failed, so the engine is never left loading
    reject(new Error('Not available in tests'));
  }

  await vi.waitFor(() => {
    expect(store.inputValue).toBe('```html\nx\n```');
  });
  await vi.waitFor(() => {
    expect(store.pending).toBe(false);
  });
});
