/**
 * Logic behind `<TextArea>`, kept apart from the component so the syntax highlighting can be tested
 * without rendering anything.
 */

/**
 * @import { HighlightedToken } from '#lib/typedefs.js';
 */

/**
 * Get the syntax-highlighted tokens of the value, flattened with line breaks in between, plus a
 * trailing one, like the content of the clone element that measures the auto-resized height.
 * They’re only used when they add up to the value exactly, since stale tokens would show text
 * different from what’s being edited.
 * @param {string | undefined} value Value of the `<textarea>`.
 * @param {((value: string) => HighlightedToken[][] | undefined) | undefined} highlight Function to
 * tokenize the value, returning one array of tokens per line.
 * @returns {HighlightedToken[] | undefined} Tokens, or `undefined` if there’s no `highlight`
 * function, it returns no tokens, or the tokens don’t add up to the value.
 */
export const getHighlightedTokens = (value, highlight) => {
  const lines = highlight?.(value ?? '');

  if (!lines) {
    return undefined;
  }

  const tokens = lines.flatMap((line) => [...line, { content: '\n' }]);

  return tokens.map(({ content }) => content).join('') === `${value}\n` ? tokens : undefined;
};
