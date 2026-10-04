import { sleep } from '@sveltia/utils/misc';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { setCodeHighlighterLoaders } from './shiki/loader.js';
import TextEditor from './text-editor.svelte';

/**
 * @import { ComponentProps } from 'svelte';
 */

/**
 * These control when the syntax highlighter engine loads, which the facade keeps in module state,
 * hence a separate file from the other editor tests.
 */

/**
 * Reject the pending engine load.
 * @type {(reason?: any) => void}
 */
let failEngine = () => {};

describe('TextEditor Markdown import', () => {
  beforeAll(() => {
    setCodeHighlighterLoaders({
      /**
       * Fail to load the engine once told to, so an import with a code block waits until then.
       * @returns {Promise<any>} Never-resolving promise, rejected by {@link failEngine}.
       */
      loadEngine: () =>
        new Promise((_resolve, reject) => {
          failEngine = reject;
        }),
    });
  });

  it('keeps the latest value when an earlier import finishes last', async () => {
    /** @type {ComponentProps<typeof TextEditor>} */
    const props = $state({ value: '```js\nconst a = 1;\n```' });
    const screen = await render(TextEditor, props);
    const root = /** @type {HTMLElement} */ (screen.container.querySelector('.lexical-root'));

    // The first import is still waiting for the highlighter when the value changes
    props.value = 'Newer';
    await vi.waitFor(() => {
      expect(root.textContent).toBe('Newer');
    });

    failEngine(new Error('Not available in tests'));
    await sleep(300);
    expect(root.textContent).toBe('Newer');
    expect(props.value).toBe('Newer');
  });
});
