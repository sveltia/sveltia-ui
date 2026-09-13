/**
 * Conversion between the code and language a `<CodeEditor>` exposes and the Markdown fenced code
 * block the underlying editor works with.
 */

const BACKTICKS = '```';

/**
 * Wrap code in a Markdown fenced code block.
 * @param {string} lang Language identifier, placed after the opening fence.
 * @param {string} code Code. If empty, the block has no content line at all.
 * @returns {string} Fenced code block.
 */
export const toCodeBlock = (lang, code) =>
  code ? `${BACKTICKS}${lang}\n${code}\n${BACKTICKS}` : `${BACKTICKS}${lang}\n${BACKTICKS}`;

/**
 * Take a Markdown fenced code block apart.
 * @param {string} markdown Fenced code block, as produced by {@link toCodeBlock}.
 * @returns {{ lang: string, code: string }} Language identifier, `plain` if the fence has none,
 * and the code, empty if the block has no content or `markdown` is not a code block at all.
 */
export const parseCodeBlock = (markdown) => {
  const { lang = 'plain', code = '' } =
    markdown.match(/^```(?<lang>\w+?)?\n(?:(?<code>.*)\n)?```/s)?.groups ?? {};

  return { lang, code };
};
