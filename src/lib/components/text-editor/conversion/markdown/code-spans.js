/**
 * Find the code spans in Markdown, as Lexical reads them.
 */

/**
 * @typedef {object} CodeSpan
 * @property {number} start Index of the opening backticks.
 * @property {number} end Index after the closing backticks.
 * @property {number} fenceLength Number of backticks on either side.
 */

/**
 * Find the code spans in a line like Lexical does: a run of backticks that isn’t escaped opens a
 * code span, which is closed by the next run of as many backticks.
 * @param {string} line Line.
 * @returns {CodeSpan[]} Code spans.
 * @see https://spec.commonmark.org/0.31.2/#code-spans
 */
export const findCodeSpans = (line) => {
  const runs = [...line.matchAll(/`+/g)].map(({ 0: { length }, index }) => {
    let backslashes = 0;

    while (line[index - backslashes - 1] === '\\') {
      backslashes += 1;
    }

    return { index, length, escaped: backslashes % 2 === 1 };
  });

  /** @type {CodeSpan[]} */
  const spans = [];

  for (let open = 0; open < runs.length; open += 1) {
    let close = open + 1;

    while (close < runs.length && runs[close].length !== runs[open].length) {
      close += 1;
    }

    if (!runs[open].escaped && close < runs.length) {
      const { index, length } = runs[close];

      spans.push({ start: runs[open].index, end: index + length, fenceLength: length });
      open = close;
    }
  }

  return spans;
};
