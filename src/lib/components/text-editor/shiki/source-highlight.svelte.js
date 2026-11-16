/**
 * Syntax highlighting of the Markdown or HTML source shown in the plain text mode of the text
 * editor.
 */

import { unique } from '@sveltia/utils/array';
import { untrack } from 'svelte';
import { parseOpeningFence } from '../conversion/markdown/code-blocks.js';
import { highlightCodeToTokens } from './engine.js';
import { loadCodeHighlighter } from './preload.js';
import { getCodeTheme, onCodeThemeChange } from './theme.js';

/**
 * @import { HighlightedToken } from '#lib/typedefs.js';
 */

/**
 * Maximum length of the Markdown or HTML source to highlight in the plain text mode. The whole
 * source is tokenized on every keystroke, so highlighting a longer one would make typing sluggish.
 */
export const MAX_HIGHLIGHT_LENGTH = 20_000;

/**
 * Get the languages used in the fenced code blocks of the given Markdown source, read from the
 * opening fences the same way the rich text mode reads them; see `parseOpeningFence()`. Fences
 * within a code block are taken in as well, which only means loading a grammar that isn’t needed.
 * @param {string} source Markdown source.
 * @returns {string[]} Unique languages, in the order they first appear.
 */
export const getCodeFenceLanguages = (source) =>
  unique(
    source
      .split('\n')
      .map((line) => parseOpeningFence(line)?.language)
      .filter((language) => language !== undefined),
  );

/**
 * Create a function that highlights the Markdown or HTML source in the plain text mode, loading the
 * highlighter, as well as the languages of the fenced code blocks in Markdown, while the mode is
 * shown, and following the app’s appearance. This must be called during the component
 * initialization, as it sets up effects.
 * @param {object} args Arguments.
 * @param {'markdown' | 'html'} args.language Language of the source.
 * @param {() => boolean} args.isActive Whether the plain text mode is shown. Nothing is loaded or
 * highlighted otherwise.
 * @param {() => string} args.getSource Get the current source, to find the languages of its fenced
 * code blocks.
 * @returns {(source: string) => HighlightedToken[][] | undefined} Function to highlight the given
 * source, which returns `undefined` while the highlighter is still loading, the plain text mode
 * isn’t shown, or the source is too long. It’s reactive: it gives new tokens once something has
 * been loaded, or the theme has changed.
 */
export const createSourceHighlighter = ({ language, isActive, getSource }) => {
  /** Syntax highlighting theme matching the app’s appearance. */
  let codeTheme = $state(getCodeTheme());
  /** Incremented whenever the highlighter has loaded something, to highlight the text again. */
  let loadCount = $state(0);

  /**
   * Comma-separated languages used in the fenced code blocks of the Markdown source, which are
   * highlighted as well. It’s a string rather than an array, so the highlighter isn’t reloaded on
   * every keystroke.
   */
  const codeLanguages = $derived.by(() => {
    if (!isActive() || language !== 'markdown' || getSource().length > MAX_HIGHLIGHT_LENGTH) {
      return '';
    }

    return getCodeFenceLanguages(getSource()).join(',');
  });

  $effect(() =>
    onCodeThemeChange(async () => {
      const theme = getCodeTheme();

      // Keep the current highlighting until the new theme is ready, so the text doesn’t flash
      if (isActive()) {
        await loadCodeHighlighter(language);
      }

      // Ignore an outdated change, in case the appearance has changed again while loading
      if (theme === getCodeTheme()) {
        codeTheme = theme;
      }
    }),
  );

  $effect(() => {
    // Load the highlighter only when the plain text mode is actually shown
    if (!isActive()) {
      return;
    }

    const languages = codeLanguages ? codeLanguages.split(',') : [];

    void codeTheme;

    untrack(() => {
      // The Markdown or HTML grammar is loaded first, because the engine has to be in place before
      // anything else can be loaded
      loadCodeHighlighter(language).then(async () => {
        loadCount += 1;
        await Promise.all(languages.map((lang) => loadCodeHighlighter(lang)));
        loadCount += 1;
      });
    });
  });

  return (source) => {
    void loadCount;

    // Don’t waste time on tokenizing the source while the rich text mode is shown
    if (!isActive() || source.length > MAX_HIGHLIGHT_LENGTH) {
      return undefined;
    }

    return highlightCodeToTokens(source, language, { theme: codeTheme });
  };
};
