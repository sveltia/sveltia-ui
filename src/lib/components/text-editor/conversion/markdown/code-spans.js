/**
 * Find the code spans in Markdown, as Lexical reads them.
 */

import { countBackslashesBefore } from './syntax.js';

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
  const runs = [...line.matchAll(/`+/g)].map(({ 0: { length }, index }) => ({
    index,
    length,
    escaped: countBackslashesBefore(line, index) % 2 === 1,
  }));

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

/**
 * Apply functions to the code spans of a text and to the text outside them, like {@link
 * findCodeSpans} finds them.
 * @param {string} text Text.
 * @param {object} callbacks Functions to apply.
 * @param {(text: string) => string} [callbacks.outside] Function that returns a processed piece of
 * text between code spans. The text is kept as is by default.
 * @param {(codeSpan: string, span: CodeSpan) => string} [callbacks.inside] Function that returns a
 * processed code span, given with its backticks. The code span is kept as is by default.
 * @returns {string} Processed text.
 */
export const mapCodeSpans = (text, { outside = (piece) => piece, inside = (span) => span }) => {
  let result = '';
  let index = 0;

  findCodeSpans(text).forEach((span) => {
    result +=
      outside(text.slice(index, span.start)) + inside(text.slice(span.start, span.end), span);
    index = span.end;
  });

  return result + outside(text.slice(index));
};
