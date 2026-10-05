import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import CodeEditor from './code-editor.svelte';
import { setCodeHighlighterLoaders } from './shiki/loader.js';

/**
 * @import { ComponentProps } from 'svelte';
 */

/**
 * Fail to load the engine, once the test lets it finish.
 * @type {(() => void) | undefined}
 */
let finishEngineLoad;

describe('CodeEditor', () => {
  beforeAll(() => {
    // Hold the syntax highlighter engine until the test lets it fail, as a slow network would
    setCodeHighlighterLoaders({
      /**
       * Load the engine slowly, then fail.
       * @returns {Promise<any>} Never resolved.
       */
      loadEngine: () =>
        new Promise((_resolve, reject) => {
          /**
           * Fail the load.
           * @returns {void}
           */
          finishEngineLoad = () => reject(new Error('Not available in tests'));
        }),
    });
  });

  it('reports a change as pending until it updates the code', async () => {
    /** @type {ComponentProps<typeof CodeEditor>} */
    const props = $state({ code: 'one', lang: 'plain', pending: false });
    const screen = await render(CodeEditor, props);
    const root = /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root'));

    await vi.waitFor(() => {
      expect(root.textContent).toContain('one');
    });
    expect(props.pending).toBe(false);

    const range = document.createRange();
    const selection = /** @type {Selection} */ (window.getSelection());

    // Place the caret at the end
    root.focus();
    range.selectNodeContents(root);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    await userEvent.keyboard(' two');
    // Typed, but not converted yet
    expect(props.pending).toBe(true);
    expect(props.code).toBe('one');

    await vi.waitFor(() => {
      expect(props.code).toBe('one two');
    });
    expect(props.pending).toBe(false);
  });

  it('leaves the focus where the user moved it while the highlighter loads', async () => {
    /** @type {ComponentProps<typeof CodeEditor>} */
    const props = $state({ code: 'a', lang: 'plain', showLanguageSwitcher: true });
    const screen = await render(CodeEditor, props);
    const other = document.createElement('input');

    document.body.append(other);

    await vi.waitFor(() => {
      expect(screen.container.querySelector('.lexical-root')?.textContent).toContain('a');
    });
    await screen.getByRole('combobox', { name: 'Language' }).click();
    await screen.getByRole('searchbox', { name: 'Filter Options' }).fill('javascript');
    await screen.getByRole('option', { name: 'JavaScript' }).click();

    // The user moves on to another field before the highlighter is ready
    await vi.waitFor(() => {
      expect(finishEngineLoad).toBeDefined();
    });
    other.focus();
    finishEngineLoad?.();

    await vi.waitFor(() => {
      expect(props.lang).toBe('javascript');
    });
    // Give the editor a moment to move the focus, if it does
    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });
    expect(document.activeElement).toBe(other);

    other.remove();
  });
});
