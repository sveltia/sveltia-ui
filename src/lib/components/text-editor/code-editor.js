/**
 * Conversion between the code and language a `<CodeEditor>` exposes and the Markdown fenced code
 * block the underlying editor works with.
 */

/**
 * Wrap code in a Markdown fenced code block. Like Lexical, the fence is made longer than any
 * backtick run in the code, so a fence line within the code, like a fenced code block in Markdown,
 * doesn’t close the block.
 * @param {string} lang Language identifier, placed after the opening fence.
 * @param {string} code Code. If empty, the block has no content line at all.
 * @returns {string} Fenced code block.
 */
export const toCodeBlock = (lang, code) => {
  // Not `Math.max(...runs)`, which would exceed the maximum number of arguments with many runs
  const longestRun = (code.match(/`+/g) ?? []).reduce((max, run) => Math.max(max, run.length), 2);
  const fence = '`'.repeat(longestRun + 1);

  return code ? `${fence}${lang}\n${code}\n${fence}` : `${fence}${lang}\n${fence}`;
};

/**
 * Take a Markdown fenced code block apart. The fence can be longer than three backticks, as Lexical
 * makes it when the code contains a fence line, and the closing fence has to be as long.
 * @param {string} markdown Fenced code block, as produced by {@link toCodeBlock}.
 * @returns {{ lang: string, code: string }} Language identifier, `plain` if the fence has none,
 * and the code, empty if the block has no content or `markdown` is not a code block at all.
 */
export const parseCodeBlock = (markdown) => {
  const { lang = 'plain', code = '' } =
    markdown.match(/^(?<fence>`{3,})(?<lang>[^\s`]+)?\n(?:(?<code>.*)\n)?\k<fence>(?!`)/s)
      ?.groups ?? {};

  return { lang, code };
};
