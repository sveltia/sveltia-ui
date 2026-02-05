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

  return value.replace(
    /^(\s+)(-|\+|\*|\d+\.)/gm,
    (_match, p1, p2) => `${' '.repeat(p1.length * 2)}${p2}`,
  );
};
