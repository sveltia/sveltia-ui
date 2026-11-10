/**
 * Preloading the syntax highlighter.
 */

import {
  isPlainLanguage,
  loadCodeLanguage,
  loadCodeTheme,
  loadEngine,
  normalizeCodeLanguage,
} from './facade.js';
import { getCodeTheme } from './theme.js';

/**
 * Preload the syntax highlighter for the given programming language.
 *
 * Highlighting also works without this — the transform loads whatever it needs and re-highlights
 * once it arrives — but preloading avoids a visible flash of unhighlighted code.
 * @param {string} lang Language name, like scss.
 */
export const loadCodeHighlighter = async (lang) => {
  if (isPlainLanguage(lang)) {
    return;
  }

  // The grammar and theme loaders are no-ops until the engine is in place
  await loadEngine();

  await Promise.all([loadCodeLanguage(normalizeCodeLanguage(lang)), loadCodeTheme(getCodeTheme())]);
};
