import { sleep } from '@sveltia/utils/misc';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CodeEditor from './code-editor.svelte';
import { setCodeHighlighterLoaders } from './shiki/loader.js';

/**
 * @import { ComponentProps } from 'svelte';
 */

/**
 * These control when the syntax highlighter engine loads, which the facade keeps in module state,
 * hence a separate file from the other editor tests.
 */

describe('CodeEditor import', () => {
  beforeAll(() => {
    setCodeHighlighterLoaders({
      /**
       * Fail to load the engine after a while, so the initial import is still waiting for it when
       * the editor reports its own initial content.
       * @returns {Promise<any>} Promise rejected after a delay.
       */
      loadEngine: async () => {
        await sleep(500);
        throw new Error('Not available in tests');
      },
    });
  });

  it('keeps the initial code while the highlighter is loading', async () => {
    /** @type {ComponentProps<typeof CodeEditor>} */
    const props = $state({ code: 'console.log(1);', lang: 'javascript' });
    const screen = await render(CodeEditor, props);
    const root = /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root'));

    await vi.waitFor(() => {
      expect(root.textContent).toBe('console.log(1);');
    });

    await sleep(300);
    expect(root.textContent).toBe('console.log(1);');
    expect(props.code).toBe('console.log(1);');
    expect(props.lang).toBe('javascript');
  });
});
