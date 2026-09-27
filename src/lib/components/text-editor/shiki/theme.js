import { $isCodeNode as isCodeNode } from '@lexical/code-core';
import { $getRoot as getRoot, HISTORY_MERGE_TAG } from 'lexical';

/**
 * @import { LexicalEditor } from 'lexical';
 */

/**
 * Shiki themes matching the app’s light and dark appearance. Only the per-token colours are used;
 * the code block’s own background comes from `--sui-code-background-color`.
 */
export const CODE_THEME_LIGHT = 'github-light';
export const CODE_THEME_DARK = 'github-dark';

/**
 * Get the syntax highlighting theme matching the current appearance.
 * @returns {string} Shiki theme ID.
 */
export const getCodeTheme = () => {
  /* v8 ignore next 3 */
  if (typeof document === 'undefined') {
    return CODE_THEME_LIGHT;
  }

  const { theme } = document.documentElement.dataset;

  if (theme) {
    return theme === 'dark' ? CODE_THEME_DARK : CODE_THEME_LIGHT;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? CODE_THEME_DARK
    : CODE_THEME_LIGHT;
};

/**
 * Call the given function whenever the app’s appearance, and therefore the matching syntax
 * highlighting theme, may have changed.
 * @param {() => void} callback Function to call.
 * @returns {() => void} Cleanup function.
 */
export const onCodeThemeChange = (callback) => {
  /* v8 ignore next 3 */
  if (typeof document === 'undefined') {
    return () => undefined;
  }

  const observer = new MutationObserver(callback);

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  const media = window.matchMedia('(prefers-color-scheme: dark)');

  media.addEventListener('change', callback);

  return () => {
    observer.disconnect();
    media.removeEventListener('change', callback);
  };
};

/**
 * Keep code blocks in sync with the app’s appearance.
 *
 * Unlike Prism, Shiki bakes token colours into inline styles, so a theme change cannot be handled
 * in CSS alone: every code node has to be re-tokenized.
 * @param {LexicalEditor} editor Editor instance.
 * @returns {() => void} Cleanup function.
 */
export const observeCodeTheme = (editor) =>
  onCodeThemeChange(() => {
    const theme = getCodeTheme();

    editor.update(
      () => {
        getRoot()
          .getChildren()
          .forEach((node) => {
            if (isCodeNode(node) && node.getTheme() !== theme) {
              node.setTheme(theme);
              node.markDirty();
            }
          });
      },
      { tag: HISTORY_MERGE_TAG },
    );
  });
