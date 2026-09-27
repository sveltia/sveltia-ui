/* eslint-disable jsdoc/require-jsdoc */

import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import { setCodeHighlighterCacheEnabled } from './shiki/cache.js';
import { setCodeHighlighterLoaders } from './shiki/loader.js';
import TextEditor from './text-editor.svelte';

/**
 * These run against the real Shiki engine, bundled locally rather than fetched from the CDN. The
 * facade keeps the engine in module state, hence a separate file from the other editor tests, which
 * run without an engine.
 */

/** @type {Record<string, () => Promise<any>>} */
const languages = {
  markdown: () => import('@shikijs/langs/markdown'),
  javascript: () => import('@shikijs/langs/javascript'),
};

/** @type {Record<string, () => Promise<any>>} */
const themes = {
  'github-light': () => import('@shikijs/themes/github-light'),
  'github-dark': () => import('@shikijs/themes/github-dark'),
};

/**
 * Get the highlighted clone of the plain text mode.
 * @param {HTMLElement} container Container.
 * @returns {Promise<HTMLElement>} Clone element, once highlighted.
 */
const waitForHighlighting = async (container) => {
  await vi.waitFor(() => {
    expect(container.querySelector('.text-area.highlighted .clone span')).not.toBeNull();
  });

  return /** @type {HTMLElement} */ (container.querySelector('.text-area.highlighted .clone'));
};

describe('TextEditor syntax highlighting', () => {
  beforeAll(() => {
    setCodeHighlighterCacheEnabled(false);
    setCodeHighlighterLoaders({
      loadEngine: () => import('./shiki/engine-entry.js'),
      loadLanguage: async (id) => languages[id]?.(),
      loadTheme: async (id) => themes[id]?.(),
    });
  });

  it('highlights the Markdown source in the plain text mode', async () => {
    document.documentElement.dataset.theme = 'light';

    const screen = await render(TextEditor, {
      value: '# Title\n\n```js\nconst a = 1;\n```',
      modes: ['plain-text', 'rich-text'],
    });

    const clone = await waitForHighlighting(screen.container);

    expect(clone.textContent).toBe('# Title\n\n```js\nconst a = 1;\n```\n');
    // GitHub Light colours the heading in blue
    expect(
      [...clone.querySelectorAll('span')].find((span) => span.textContent === '# Title')?.style
        .color,
    ).toBe('rgb(0, 92, 197)');

    // The grammar of the fenced code block is loaded as well, painting the `const` keyword red
    await vi.waitFor(() => {
      expect(
        [...clone.querySelectorAll('span')].find((span) => span.textContent === 'const')?.style
          .color,
      ).toBe('rgb(215, 58, 73)');
    });

    const textarea = /** @type {HTMLTextAreaElement} */ (
      screen.container.querySelector('textarea')
    );

    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    await userEvent.keyboard('\n\n**Bold**');
    await vi.waitFor(() => {
      expect([...clone.querySelectorAll('.bold')].at(-1)?.textContent).toBe('**Bold**');
    });
  });

  it('follows the app’s appearance', async () => {
    document.documentElement.dataset.theme = 'light';

    const screen = await render(TextEditor, {
      value: '# Title',
      modes: ['plain-text', 'rich-text'],
    });

    await waitForHighlighting(screen.container);

    /**
     * Get the heading text colour. The clone is queried every time, because it’s replaced while
     * the new theme is loading.
     * @returns {string | undefined} Colour.
     */
    const getColor = () =>
      [...screen.container.querySelectorAll('.clone span')]
        .map((span) => /** @type {HTMLElement} */ (span))
        .find((span) => span.textContent === '# Title')?.style.color;

    expect(getColor()).toBe('rgb(0, 92, 197)');
    document.documentElement.dataset.theme = 'dark';
    // GitHub Dark colours the heading in a lighter blue
    await vi.waitFor(() => {
      expect(getColor()).toBe('rgb(121, 184, 255)');
    });
    document.documentElement.dataset.theme = 'light';
  });

  it('does not highlight while the rich text mode is shown', async () => {
    const screen = await render(TextEditor, { value: '# Title' });

    await vi.waitFor(() => {
      expect(screen.container.querySelector('.lexical-root h1')).not.toBeNull();
    });
    expect(screen.container.querySelector('.text-area.highlighted')).toBeNull();
  });

  it('does not highlight a very long source', async () => {
    const screen = await render(TextEditor, {
      value: `# Title\n\n${'a'.repeat(20_000)}`,
      modes: ['plain-text', 'rich-text'],
    });

    // Let the highlighter load
    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });

    expect(screen.container.querySelector('.text-area.highlighted')).toBeNull();
  });
});
