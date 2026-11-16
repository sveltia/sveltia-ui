/**
 * Split the formatting, code spans and links that span line breaks into separate lines, as
 * Lexical reads Markdown line by line.
 */

import {
  findHtmlBlockLines,
  endsParagraph,
  interruptsParagraph,
  TABLE_ROW_LINE_REGEX,
} from './block-structure.js';
import { mapOutsideCodeBlocks } from './code-blocks.js';
import { findCodeSpans } from './code-spans.js';

/**
 * Create a regular expression to match formatting that spans one or more line breaks, like
 * `**foo\nbar**`. It captures the text between the markers, line breaks included. The text of each
 * line is read as CommonMark does: a backslash escapes the next character, so an escaped marker is
 * part of the text, and the text can end with an escaped backslash, like `_foo\\`, which is
 * followed by a soft line break, not a hard one. A line can end with whitespace or the backslash of
 * a hard line break, and start with whitespace, outside its text. The markers can’t be escaped, or
 * next to whitespace within the formatting. The formatting must be at the start or the end of the
 * value, or next to whitespace or punctuation other than its own marker, so a marker within a word,
 * like `_` in `snake_case`, is left alone. As per the CommonMark flanking rules, `*` can open and
 * close formatting within a word as well, like `**foo\nbar**baz`, unless the text starts or ends
 * with punctuation there. The surrounding characters are checked with lookarounds rather than
 * matched with `\s+`, which would take quadratic time on a long run of whitespace not followed by a
 * marker. The text of a line can’t contain the marker, and it can’t start or end with whitespace,
 * so the text and the line breaks can only be matched one way, which keeps the time linear.
 * @param {string} char Marker character.
 * @param {number} length Number of marker characters.
 * @returns {RegExp} Regular expression.
 * @see https://spec.commonmark.org/0.31.2/#left-flanking-delimiter-run
 */
const createMultilineFormattingRegex = (char, length) => {
  const marker = `[${char}]`.repeat(length);
  // A character other than the marker and a line break, or an escape. The first and the last of the
  // text can’t be whitespace
  const unit = String.raw`(?:\\[^\s]|[^${char}\\\n])`;
  const edgeUnit = String.raw`(?:\\[^\s]|[^${char}\s\\])`;
  const text = `${edgeUnit}(?:${unit}*?${edgeUnit})?`;
  const boundary = String.raw`[\s\p{P}\p{S}]`;
  const isWithinWordAllowed = char === '*';

  const opening = isWithinWordAllowed
    ? `(?:(?<=^|${boundary})${marker}|${marker}(?!${boundary}))`
    : `(?<=^|${boundary})${marker}`;

  const closing = isWithinWordAllowed
    ? `(?:(?<!${boundary})${marker}|${marker}(?=${boundary}|$))`
    : `${marker}(?=${boundary}|$)`;

  const lineBreak = String.raw`(?:\\|[ \t]*)\n[ \t]*`;

  return new RegExp(
    String.raw`(?<![${char}\\])${opening}(${text}(?:${lineBreak}${text})+)${closing}(?![${char}])`,
    'gu',
  );
};

/**
 * Regular expressions to match formatting that spans line breaks, with the marker of each.
 * @type {[string, RegExp][]}
 */
const MULTILINE_FORMATTING_REGEXES = [
  ['***', createMultilineFormattingRegex('*', 3)],
  ['___', createMultilineFormattingRegex('_', 3)],
  ['**', createMultilineFormattingRegex('*', 2)],
  ['__', createMultilineFormattingRegex('_', 2)],
  ['~~', createMultilineFormattingRegex('~', 2)],
  ['*', createMultilineFormattingRegex('*', 1)],
  ['_', createMultilineFormattingRegex('_', 1)],
];

/**
 * @typedef {object} FormattedLine
 * @property {string} indent Whitespace at the start of the line, outside the formatting.
 * @property {string} text Text of the line within the formatting.
 * @property {string} lineEnd Whitespace or the backslash of a hard line break at the end of the
 * line, outside the formatting.
 */

/**
 * Split the text of formatting that spans line breaks into lines. The text of a line doesn’t start
 * or end with whitespace, and the backslash of a hard line break is the last of an odd number of
 * backslashes at the end of a line, as the others escape each other.
 * @param {string} text Text matched by one of {@link MULTILINE_FORMATTING_REGEXES}.
 * @returns {FormattedLine[]} Lines.
 */
const splitFormattedLines = (text) =>
  text.split('\n').map((line) => {
    const start = line.length - line.trimStart().length;
    // Not a regular expression like `[ \t]*$`, which would take quadratic time on a long run of
    // whitespace within the line
    let end = line.length;
    let backslashes = 0;

    while (end > start && /[ \t]/.test(line[end - 1])) {
      end -= 1;
    }

    while (line[end - backslashes - 1] === '\\') {
      backslashes += 1;
    }

    if (backslashes % 2) {
      end -= 1;
    }

    return { indent: line.slice(0, start), text: line.slice(start, end), lineEnd: line.slice(end) };
  });

/**
 * Check if the text of formatting that spans line breaks has other formatting that spans line
 * breaks, like `_foo\nbar_` in `**_foo\nbar_**` or `**_foo\nbar_\nbaz**`, which has to be split
 * first.
 * @param {string} text Text matched by one of {@link MULTILINE_FORMATTING_REGEXES}.
 * @returns {boolean} Result.
 */
const hasMultilineFormatting = (text) =>
  MULTILINE_FORMATTING_REGEXES.some(([, regex]) => text.search(regex) !== -1);

/**
 * Regular expression to match a link whose text spans a line break, like `[foo\nbar](url)`, but not
 * an image. The text before the line break can’t end with the backslash of a hard line break.
 */
const MULTILINE_LINK_REGEX = new RegExp(
  String.raw`(?<!(?:^|[^\\])(?:\\\\)*[\\!])\[([^[\]\n]*[^[\]\s\\])([ \t]*\n[ \t]*)([^[\]\n]+)\]` +
    String.raw`\(([^()\s]*(?:[ \t]+"[^"\n]*")?)\)`,
  'g',
);

/**
 * Split a code span whose code spans a line break into one per line, like `` `foo\nbar` `` into
 * `` `foo`\n`bar` ``, so the formatting around it can be split into separate lines as well.
 * Backslashes and spaces are literal in a code span. The backticks are paired as Lexical pairs
 * them, within a paragraph, so the closing backtick of a code span isn’t taken as the opening one
 * of another, like in table rows such as `` | `**a**` | b |\n| `*c*` | d | ``, which would get
 * stray backticks otherwise. A code span can’t span a blank line or the start of another block,
 * like a list item, a heading or a table row.
 * @param {string} part Part of a Markdown string outside fenced code blocks.
 * @returns {string} Processed part.
 * @see https://github.com/sveltia/sveltia-cms/issues/1168
 */
const splitMultilineCodeSpans = (part) => {
  if (!part.includes('`')) {
    return part;
  }

  const lines = part.split('\n');
  // An HTML block is raw HTML, which is kept as is, so each of its lines is left on its own
  const htmlBlockLines = part.includes('<') ? findHtmlBlockLines(lines) : [];
  /** @type {string[][]} */
  const paragraphs = [];

  lines.forEach((line, index) => {
    const previous = lines[index - 1];

    if (
      index === 0 ||
      htmlBlockLines[index] ||
      htmlBlockLines[index - 1] ||
      endsParagraph(previous) ||
      interruptsParagraph(line) ||
      // Lexical reads a table row as a line of its own, so a code span can’t continue after it
      TABLE_ROW_LINE_REGEX.test(previous)
    ) {
      paragraphs.push([line]);
    } else {
      paragraphs[paragraphs.length - 1].push(line);
    }
  });

  return paragraphs
    .map((paragraphLines) => {
      if (paragraphLines.length === 1) {
        return paragraphLines[0];
      }

      const paragraph = paragraphLines.join('\n');
      let result = '';
      let last = 0;

      findCodeSpans(paragraph).forEach(({ start, end, fenceLength }) => {
        const code = paragraph.slice(start, end);

        if (
          fenceLength === 1 &&
          /^`[^\n]+\n[ \t]*[^\s`][^\n]*`$/.test(code) &&
          /^$|[\s\p{P}\p{S}]/u.test(paragraph.slice(start - 1, start)) &&
          /^$|[\s\p{P}\p{S}]/u.test(paragraph.slice(end, end + 1))
        ) {
          // The indentation of the next line isn’t part of the code, so it goes before the
          // opening backtick
          result += `${paragraph.slice(last, start)}${code.replace(/\n([ \t]*)/, '`\n$1`')}`;
          last = end;
        }
      });

      return `${result}${paragraph.slice(last)}`;
    })
    .join('\n');
};

/**
 * Split a link whose text spans a line break in the text of formatting into one per line, like
 * `[foo\nbar](url)` into `[foo](url)\n[bar](url)`, so the formatting can be split into separate
 * lines. Only the formatting needs it, so links elsewhere, including those in raw HTML, are left as
 * they are. An image is left as is, as it would be duplicated, and so is anything in a code span.
 * @param {string} text Text matched by one of {@link MULTILINE_FORMATTING_REGEXES}.
 * @returns {string} Processed text.
 */
const splitMultilineLinks = (text) => {
  if (!text.includes('[')) {
    return text;
  }

  const codeSpans = findCodeSpans(text);

  return text.replace(MULTILINE_LINK_REGEX, (match, first, lineBreak, second, target, offset) =>
    codeSpans.some(({ start, end }) => offset >= start && offset < end)
      ? match
      : `[${first}](${target})${lineBreak}[${second}](${target})`,
  );
};

/**
 * Check if the text of formatting that spans line breaks has a line break within a code span or a
 * link text, which {@link splitMultilineCodeSpans} and {@link splitMultilineLinks} couldn’t split.
 * @param {string} text Text matched by one of {@link MULTILINE_FORMATTING_REGEXES}.
 * @returns {boolean} Result.
 */
const hasLineBreakInSpan = (text) =>
  findCodeSpans(text).some(({ start, end }) => text.slice(start, end).includes('\n')) ||
  // An inline link or a full reference link. The first run can’t have a line break, so a `[`
  // followed by many lines isn’t matched in quadratic time. A bracket after an escaped backslash,
  // like `\\[`, isn’t escaped
  /(?<!(?:^|[^\\])(?:\\\\)*\\)\[[^[\]\n]*\n[^[\]]*\](?=[([])/.test(text);

/**
 * Split multiline formatting into separate lines to prevent Markdown parsing issues. Fenced code
 * blocks are left untouched, as the formatting syntax is not parsed there. Formatting is left as is
 * if a line after the first starts a block, like a heading or a list item, which ends the paragraph
 * and therefore the formatting.
 * @param {string} value Markdown string to process.
 * @returns {string} Processed Markdown string.
 * @see https://github.com/sveltia/sveltia-cms/issues/548
 */
export const splitMultilineFormatting = (value) =>
  mapOutsideCodeBlocks(value, (part) => {
    let result = splitMultilineCodeSpans(part);
    let previous;

    // Split the inner formatting first, so `**_foo\nbar_**` becomes `**_foo_**\n**_bar_**`, not
    // `**_foo**_\n_**bar_**`. The outer one is split on the next pass. A text can’t have its own
    // marker, so formatting is nested a few levels deep at most
    while (result !== previous) {
      previous = result;
      result = MULTILINE_FORMATTING_REGEXES.reduce(
        (current, [marker, regex]) =>
          current.replace(regex, (match, formattedText) => {
            if (hasMultilineFormatting(formattedText)) {
              return match;
            }

            const text = splitMultilineLinks(formattedText);

            // A line break left within a code span or a link text can’t be split there, as the
            // markers would become part of the code or the link
            if (hasLineBreakInSpan(text)) {
              return match;
            }

            const lines = splitFormattedLines(text);

            // A line with only markers, like `**` in `_**\n**_` of `**_(a)_**\n**_(b)_**`, means
            // the match runs from the closing marker of one line to the opening marker of the next,
            // which isn’t formatting. Splitting it would add markers that match again, without end
            if (
              lines.some(({ text: lineText }) => /^[*_~]+$/.test(lineText)) ||
              lines
                .slice(1)
                .some(({ indent, text: lineText }) => interruptsParagraph(`${indent}${lineText}`))
            ) {
              return match;
            }

            return lines
              .map(
                ({ indent, text: lineText, lineEnd }) =>
                  `${indent}${marker}${lineText}${marker}${lineEnd}`,
              )
              .join('\n');
          }),
        result,
      );
    }

    return result;
  });
