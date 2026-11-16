/**
 * Placeholders added to Markdown before it’s imported, so Lexical reads it as CommonMark does,
 * and removed from the imported text.
 */

import {
  CODE_SPACE_PLACEHOLDER,
  CODE_TAB_PLACEHOLDER,
  ESCAPED_BACKSLASH_PLACEHOLDER,
  HTML_BLOCK_PLACEHOLDER,
  PUNCTUATION_PLACEHOLDER,
} from '../placeholder-chars.js';
import { INLINE_HTML_REGEX } from '../transformers/raw-syntax.js';
import { findHtmlBlockLines } from './block-structure.js';
import { mapLinesOutsideCodeBlocks, mapOutsideCodeBlocks } from './code-blocks.js';
import { findCodeSpans } from './code-spans.js';

/**
 * Global version of `INLINE_HTML_REGEX`.
 */
const GLOBAL_INLINE_HTML_REGEX = new RegExp(INLINE_HTML_REGEX, 'g');

/**
 * Add placeholders around the backslashes at the end of a line, so Lexical reads them as CommonMark
 * does. Lexical looks for a hard line break, a backslash at the end of a line, after it has removed
 * the escapes from the text, so an escaped backslash, like `foo\\`, `` `foo\` `` in a code span or
 * `_foo\\_`, becomes a hard line break, losing the backslash, and `foo\\\` loses its hard line
 * break. A placeholder after the escaped backslashes, or before the closing backticks of a code
 * span, keeps the backslash from ending the text.
 * @param {string} line Line.
 * @returns {string} Processed line.
 * @see https://spec.commonmark.org/0.31.2/#hard-line-breaks
 */
const markLineEndBackslashes = (line) => {
  if (!/[\\`][*_~]*$/.test(line)) {
    return line;
  }

  const codeSpan = findCodeSpans(line).findLast(({ end }) => /^[*_~]*$/.test(line.slice(end)));

  // Backslashes are literal in a code span
  if (codeSpan) {
    const index = codeSpan.end - codeSpan.fenceLength;

    return line[index - 1] === '\\'
      ? `${line.slice(0, index)}${ESCAPED_BACKSLASH_PLACEHOLDER}${line.slice(index)}`
      : line;
  }

  // The escaped backslashes are followed by formatting markers, if any, and the backslash of a hard
  // line break, if any. They’re counted from the end rather than matched with a regular expression,
  // which would take quadratic time on a long run of backslashes or markers
  const index = [true, false]
    .map((hasHardLineBreak) => {
      let end = line.length - (hasHardLineBreak && line.endsWith('\\') ? 1 : 0);
      let backslashes = 0;

      while (end > 0 && '*_~'.includes(line[end - 1])) {
        end -= 1;
      }

      while (line[end - backslashes - 1] === '\\') {
        backslashes += 1;
      }

      return backslashes && backslashes % 2 === 0 ? end : -1;
    })
    .find((end) => end !== -1);

  return index === undefined
    ? line
    : `${line.slice(0, index)}${ESCAPED_BACKSLASH_PLACEHOLDER}${line.slice(index)}`;
};

/**
 * Regular expression to match the place between a formatting marker run that isn’t escaped and a
 * backslash: after the run, like in `_foo_\`, or before it, after an escaped backslash, like in
 * `\\_foo_`.
 */
const MARKER_BACKSLASH_REGEX =
  // Each lookahead comes first, so its lookbehind is only tried next to a marker or a backslash
  /(?=\\)(?<=(?:^|[^\\])(?:\\\\)*[*_~])|(?=[*_~])(?<=(?:^|[^\\])(?:\\\\)+)/g;

/**
 * Put a period, which Lexical takes as punctuation, between a backslash and a formatting marker.
 * Unlike CommonMark, Lexical doesn’t take a backslash as punctuation, so it reads the marker as
 * being within a word: it doesn’t read `_foo_\` or `**foo.**\` as formatted, as the marker can’t
 * close the formatting there, nor `\\_foo_`, as it can’t open it. The period gives the marker the
 * same neighbor as in CommonMark. A placeholder on the backslash side lets it be removed, and keeps
 * it from being escaped by the backslash.
 * @param {string} line Line.
 * @returns {string} Processed line.
 * @see https://spec.commonmark.org/0.31.2/#left-flanking-delimiter-run
 */
const markMarkersNextToBackslashes = (line) =>
  /[*_~]\\|\\[*_~]/.test(line)
    ? line.replace(MARKER_BACKSLASH_REGEX, (_match, index) =>
        // The period goes next to the marker
        '*_~'.includes(line[index]) ? `${PUNCTUATION_PLACEHOLDER}.` : `.${PUNCTUATION_PLACEHOLDER}`,
      )
    : line;

/**
 * Regular expression to match the place between a formatting marker and a punctuation character or
 * a symbol other than ASCII, like an en dash or a curly quote.
 */
const MARKER_UNICODE_PUNCTUATION_REGEX =
  /(?<=[*_~])(?=(?![\0-\x7F])[\p{P}\p{S}])|(?<=(?![\0-\x7F])[\p{P}\p{S}])(?=[*_~])/gu;

/**
 * Put a period, which Lexical takes as punctuation, between a formatting marker and a punctuation
 * character or a symbol other than ASCII. Unlike CommonMark, Lexical only takes ASCII characters as
 * punctuation, so it reads the marker as being next to a letter: it doesn’t read `**[a](u)**` in
 * `–**[a](u)**` or `“**[a](u)**”` as bold, as the marker can’t open or close the formatting there.
 * The period gives the marker the same neighbor as in CommonMark. A placeholder on the other side
 * lets it be removed.
 * @param {string} line Line.
 * @returns {string} Processed line.
 * @see https://spec.commonmark.org/0.31.2/#unicode-punctuation-character
 * @see https://github.com/sveltia/sveltia-cms/issues/1107
 */
const markMarkersNextToUnicodePunctuation = (line) =>
  /[^\0-\x7F]/.test(line)
    ? line.replace(MARKER_UNICODE_PUNCTUATION_REGEX, (_match, index) =>
        // The period goes next to the marker
        '*_~'.includes(line[index - 1])
          ? `.${PUNCTUATION_PLACEHOLDER}`
          : `${PUNCTUATION_PLACEHOLDER}.`,
      )
    : line;

/**
 * Replace the tabs in the code spans of a line, and the spaces in a code span made only of spaces,
 * with placeholders. Lexical turns a tab into a tab node, which has no format, so a tab in a code
 * span would leave the code span, and a code span with only tabs would be exported as text. Also,
 * Lexical takes a paragraph with up to 3 whitespace characters as empty, and removes it, even if
 * they’re code, like `` ` ` ``. The spaces of other code spans are left alone, as one of them is
 * stripped from both ends of the code span if the code isn’t all spaces.
 * @param {string} line Line.
 * @returns {string} Processed line.
 * @see https://spec.commonmark.org/0.31.2/#code-spans
 */
const markCodeSpanWhitespace = (line) => {
  if (!/`[ \t]|\t/.test(line)) {
    return line;
  }

  let result = '';
  let index = 0;

  findCodeSpans(line).forEach(({ start, end, fenceLength }) => {
    const content = line.slice(start + fenceLength, end - fenceLength);

    result += `${line.slice(index, start + fenceLength)}${
      /^ +$/.test(content)
        ? CODE_SPACE_PLACEHOLDER.repeat(content.length)
        : content.replaceAll('\t', CODE_TAB_PLACEHOLDER)
    }`;
    index = end - fenceLength;
  });

  return result + line.slice(index);
};

/**
 * Mark the lines of the HTML blocks in a part of a Markdown string with a placeholder at the start,
 * so they’re imported as raw HTML, without the Markdown syntax being read; see `RAW_HTML`. Their
 * tabs, and those in the inline HTML of the other lines, are replaced with a placeholder, as
 * Lexical would otherwise split the raw HTML into separate nodes around a tab node.
 * @param {string} part Part of a Markdown string outside fenced code blocks.
 * @returns {string} Processed part.
 * @see https://spec.commonmark.org/0.31.2/#html-blocks
 * @see https://github.com/sveltia/sveltia-cms/issues/1106
 */
const markHtml = (part) => {
  const lines = part.split('\n');
  const htmlBlockLines = findHtmlBlockLines(lines);

  return lines
    .map((line, index) => {
      if (htmlBlockLines[index]) {
        return `${HTML_BLOCK_PLACEHOLDER}${line.replaceAll('\t', CODE_TAB_PLACEHOLDER)}`;
      }

      return line.includes('\t')
        ? line.replace(GLOBAL_INLINE_HTML_REGEX, (tag) =>
            tag.replaceAll('\t', CODE_TAB_PLACEHOLDER),
          )
        : line;
    })
    .join('\n');
};

/**
 * Add placeholders to a Markdown string, so Lexical reads it as CommonMark does; see
 * `markLineEndBackslashes()`, `markMarkersNextToBackslashes()`,
 * `markMarkersNextToUnicodePunctuation()` and `markCodeSpanWhitespace()`.
 * Lines in fenced code blocks are left untouched. The placeholders are removed from the imported
 * text with `removeImportPlaceholders()`.
 * @param {string} value Markdown string to process.
 * @returns {string} Processed Markdown string.
 */
export const addImportPlaceholders = (value) =>
  mapLinesOutsideCodeBlocks(
    value.includes('<') ? mapOutsideCodeBlocks(value, markHtml) : value,
    (line) =>
      markCodeSpanWhitespace(
        markMarkersNextToUnicodePunctuation(
          markMarkersNextToBackslashes(markLineEndBackslashes(line)),
        ),
      ),
  );

/**
 * Remove the placeholders added by `addImportPlaceholders()` from imported text.
 * @param {string} text Text.
 * @returns {string} Text without the placeholders.
 */
export const removeImportPlaceholders = (text) =>
  text
    .replace(new RegExp(`\\.${PUNCTUATION_PLACEHOLDER}|${PUNCTUATION_PLACEHOLDER}\\.`, 'g'), '')
    .replaceAll(ESCAPED_BACKSLASH_PLACEHOLDER, '')
    .replaceAll(HTML_BLOCK_PLACEHOLDER, '')
    .replaceAll(CODE_TAB_PLACEHOLDER, '\t')
    .replaceAll(CODE_SPACE_PLACEHOLDER, ' ');
