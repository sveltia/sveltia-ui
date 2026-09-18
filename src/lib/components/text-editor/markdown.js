/**
 * Split multiline formatting into separate lines to prevent Markdown parsing issues.
 * @param {string} value Markdown string to process.
 * @returns {string} Processed Markdown string.
 * @see https://github.com/sveltia/sveltia-cms/issues/548
 */
export const splitMultilineFormatting = (value) =>
  value
    .replace(/(\s+)_([^_\n]+?)\n([^_\n]+?)_(\s+)/gm, '$1_$2_\n_$3_$4')
    .replace(/(\s+)\*\*([^*\n]+?)\n([^*\n]+?)\*\*(\s+)/gm, '$1**$2**\n**$3**$4')
    .replace(/(\s+)~~([^~\n]+?)\n([^~\n]+?)~~(\s+)/gm, '$1~~$2~~\n~~$3~~$4')
    .replace(/(\s+)`([^`\n]+?)\n([^`\n]+?)`(\s+)/gm, '$1`$2`\n`$3`$4');

/**
 * Apply a function to each line of a Markdown string, leaving the lines inside fenced code blocks
 * untouched.
 * @param {string} value Markdown string to process.
 * @param {(line: string) => string} callback Function that returns a processed line.
 * @returns {string} Processed Markdown string.
 */
const mapLinesOutsideCodeBlocks = (value, callback) => {
  let inCodeBlock = false;

  return value
    .split('\n')
    .map((line) => {
      // Like Lexical's `CODE_START_REGEX`, allow an indented fence
      if (/^[ \t]*(`{3,}|~{3,})/.test(line)) {
        inCodeBlock = !inCodeBlock;
        return line;
      }

      if (inCodeBlock) {
        return line;
      }

      return callback(line);
    })
    .join('\n');
};

/**
 * Increase list indentation levels to prevent Markdown parsing issues.
 * Slate uses 2 spaces per indentation level, whereas Lexical uses 4 spaces.
 * This function doubles the indentation to match Lexical's expectations.
 * @param {string} value Markdown string to process.
 * @returns {string} Processed Markdown string.
 * @see https://github.com/sveltia/sveltia-cms/issues/549
 */
export const increaseListIndentation = (value) => {
  if (!value.match(/^\s{2}(?:-|\+|\*|\d+\.)\s/m)) {
    return value;
  }

  return mapLinesOutsideCodeBlocks(value, (line) =>
    line.replace(/^(\s+)(-|\+|\*|\d+\.)/, (_match, p1, p2) => `${' '.repeat(p1.length * 2)}${p2}`),
  );
};

/**
 * Add a trailing space to a blank blockquote line (`>`) so Lexical treats it as a blank line within
 * the blockquote. Without the space, the line does not match Lexical's `/^>\s/` quote pattern and
 * is imported as literal `>` text, which is then exported as `> >`, an empty nested blockquote.
 * @param {string} value Markdown string to process.
 * @returns {string} Processed Markdown string.
 * @see https://github.com/sveltia/sveltia-cms/issues/995
 */
export const padBlankBlockquoteLines = (value) => {
  if (!/^>$/m.test(value)) {
    return value;
  }

  return mapLinesOutsideCodeBlocks(value, (line) => (line === '>' ? '> ' : line));
};

/**
 * Remove the trailing space Lexical outputs for a blank blockquote line (`> `) so the line
 * round-trips as `>`, the canonical form.
 * @param {string} value Markdown string to process.
 * @returns {string} Processed Markdown string.
 * @see https://github.com/sveltia/sveltia-cms/issues/995
 */
export const trimBlankBlockquoteLines = (value) => {
  if (!/^> $/m.test(value)) {
    return value;
  }

  return mapLinesOutsideCodeBlocks(value, (line) => (line === '> ' ? '>' : line));
};
