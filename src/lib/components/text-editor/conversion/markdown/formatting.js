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
import { findCodeSpans, mapCodeSpans } from './code-spans.js';
import {
  countBackslashesBefore,
  UNESCAPED_LOOKBEHIND,
  WHITESPACE_OR_PUNCTUATION,
} from './syntax.js';

/**
 * @import { CodeSpan } from './code-spans.js';
 */

/**
 * Regular expression source to match the blockquote markers at the start of a line, like `> >` in
 * `> > foo`, without the whitespace after the last one.
 */
const BLOCKQUOTE_MARKERS = '(?: {0,3}>)*';
/**
 * Blockquote markers at the start of a line; see {@link BLOCKQUOTE_MARKERS}.
 */
const BLOCKQUOTE_PREFIX_REGEX = new RegExp(`^${BLOCKQUOTE_MARKERS}`);
/**
 * Blockquote markers and indentation at the start of a line.
 */
const BLOCKQUOTE_PREFIX_AND_INDENT_REGEX = new RegExp(`^${BLOCKQUOTE_MARKERS}[ \\t]*`);
/**
 * Get the blockquote markers at the start of a line, like `> >` in `> > foo`, without the
 * whitespace after the last one.
 * @param {string} line Line.
 * @returns {string} Markers, like `> >`, or an empty string if the line isn’t in a blockquote.
 */
const getBlockquotePrefix = (line) => BLOCKQUOTE_PREFIX_REGEX.exec(line)?.[0] ?? '';

/**
 * Create a regular expression to match formatting that spans one or more line breaks, like
 * `**foo\nbar**`. It captures the text between the markers, line breaks included. The text of each
 * line is read as CommonMark does: a backslash escapes the next character, so an escaped marker is
 * part of the text, and the text can end with an escaped backslash, like `_foo\\`, which is
 * followed by a soft line break, not a hard one. A line can end with whitespace or the backslash of
 * a hard line break, and start with whitespace and blockquote markers, like `> ` in
 * `> **foo\n> bar**`, outside its text. The blockquote markers are matched as many as there are, so
 * the text of a line can’t start with one, and the line can only be matched one way. The markers
 * can’t be escaped, or next to whitespace within the formatting. The formatting must be at the
 * start or the end of the value, or next to whitespace or punctuation other than its own marker, so
 * a marker within a word, like `_` in `snake_case`, is left alone. As per the CommonMark flanking
 * rules, `*` can open and close formatting within a word as well, like `**foo\nbar**baz`, unless
 * the text starts or ends with punctuation there. The surrounding characters are checked with
 * lookarounds rather than matched with `\s+`, which would take quadratic time on a long run of
 * whitespace not followed by a marker. The text of a line can’t contain the marker, and it can’t
 * start or end with whitespace, so the text and the line breaks can only be matched one way, which
 * keeps the time linear.
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
  const boundary = WHITESPACE_OR_PUNCTUATION;
  const isWithinWordAllowed = char === '*';

  const opening = isWithinWordAllowed
    ? `(?:(?<=^|${boundary})${marker}|${marker}(?!${boundary}))`
    : `(?<=^|${boundary})${marker}`;

  const closing = isWithinWordAllowed
    ? `(?:(?<!${boundary})${marker}|${marker}(?=${boundary}|$))`
    : `${marker}(?=${boundary}|$)`;

  const lineBreak = String.raw`(?:\\|[ \t]*)\n${BLOCKQUOTE_MARKERS}(?! {0,3}>)[ \t]*`;

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
 * Get the number of blockquote markers in a prefix, which is the nesting level of the blockquote.
 * @param {string} prefix Prefix returned by {@link getBlockquotePrefix}.
 * @returns {number} Level, or `0` if the line isn’t in a blockquote.
 */
const getBlockquoteLevel = (prefix) => prefix.split('>').length - 1;

/**
 * @typedef {object} FormattedLine
 * @property {string} quote Blockquote markers at the start of the line, outside the formatting.
 * Always empty for the first line.
 * @property {string} indent Blockquote markers and whitespace at the start of the line, outside the
 * formatting.
 * @property {string} text Text of the line within the formatting.
 * @property {string} lineEnd Whitespace or the backslash of a hard line break at the end of the
 * line, outside the formatting.
 */

/**
 * Split the text of formatting that spans line breaks into lines. The text of a line doesn’t start
 * or end with whitespace, a line after the first can start with blockquote markers, and the
 * backslash of a hard line break is the last of an odd number of backslashes at the end of a line,
 * as the others escape each other.
 * @param {string} text Text matched by one of {@link MULTILINE_FORMATTING_REGEXES}.
 * @returns {FormattedLine[]} Lines.
 */
const splitFormattedLines = (text) =>
  text.split('\n').map((line, index) => {
    const quote = index ? getBlockquotePrefix(line) : '';
    const start = line.length - line.slice(quote.length).trimStart().length;
    // Not a regular expression like `[ \t]*$`, which would take quadratic time on a long run of
    // whitespace within the line
    let end = line.length;

    while (end > start && /[ \t]/.test(line[end - 1])) {
      end -= 1;
    }

    if (countBackslashesBefore(line, end) % 2) {
      end -= 1;
    }

    return {
      quote,
      indent: line.slice(0, start),
      text: line.slice(start, end),
      lineEnd: line.slice(end),
    };
  });

/**
 * Check if a line after the first one of a paragraph is in the same blockquote: it has the same
 * blockquote markers, or none, as a lazy continuation line. Lines in a nested or another blockquote
 * aren’t in the same paragraph.
 * @param {number} level Blockquote level of the first line of the paragraph.
 * @param {string} prefix Blockquote prefix of the line.
 * @returns {boolean} Result.
 * @see https://spec.commonmark.org/0.31.2/#lazy-continuation-line
 */
const isInSameBlockquote = (level, prefix) => !prefix || getBlockquoteLevel(prefix) === level;

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
 * Regular expression to match a link whose text spans one or more line breaks, like
 * `[foo\nbar](url)`, but not an image. The text can’t have brackets, so a `[` followed by many
 * lines isn’t matched in quadratic time.
 */
const MULTILINE_LINK_REGEX = new RegExp(
  String.raw`(?<!(?:^|[^\\])(?:\\\\)*[\\!])\[([^[\]\n]*\n[^[\]]*)\]` +
    String.raw`\(([^()\s]*(?:[ \t]+"[^"\n]*")?)\)`,
  'g',
);

/**
 * Split a link whose text spans one or more line breaks into one per line, like
 * `[foo\nbar](url)` into `[foo](url)\n[bar](url)`, as Lexical can’t read a link across a line
 * break, and so the formatting around it can be split into separate lines as well. The whitespace
 * at the start and the end of a line goes outside the link text. A link is left as is if a line
 * has no text, or ends with the backslash of a hard line break. An image is left as is, as it
 * would be duplicated, and so is anything in a code span, or a link with a code span that spans a
 * line break, which can’t be split.
 * @param {string} text Paragraph, or text matched by one of {@link MULTILINE_FORMATTING_REGEXES}.
 * @returns {string} Processed text.
 */
const splitMultilineLinks = (text) => {
  if (!text.includes('[')) {
    return text;
  }

  const codeSpans = findCodeSpans(text);

  return text.replace(MULTILINE_LINK_REGEX, (match, linkText, target, offset) => {
    const matchEnd = offset + match.length;

    if (
      codeSpans.some(
        ({ start, end }) =>
          start < matchEnd &&
          end > offset &&
          (start < offset || end > matchEnd || text.slice(start, end).includes('\n')),
      )
    ) {
      return match;
    }

    const lines = splitFormattedLines(linkText);
    const lastLine = lines[lines.length - 1];

    // The whitespace at the start and the end of the link text is part of it
    lines[0] = { ...lines[0], indent: '', text: `${lines[0].indent}${lines[0].text}` };
    lines[lines.length - 1] = {
      ...lastLine,
      text: `${lastLine.text}${lastLine.lineEnd}`,
      lineEnd: '',
    };

    if (
      lines.some(({ text: lineText }) => !/\S/.test(lineText)) ||
      lines.some(({ lineEnd }) => lineEnd.includes('\\'))
    ) {
      return match;
    }

    return lines
      .map(({ indent, text: lineText, lineEnd }) => `${indent}[${lineText}](${target})${lineEnd}`)
      .join('\n');
  });
};

/**
 * Regular expression to match the character before or after a code span that can be split into
 * lines, which isn’t a word character, or the start or the end of the paragraph.
 */
const SPAN_BOUNDARY_REGEX = new RegExp(`^$|${WHITESPACE_OR_PUNCTUATION}`, 'u');

/**
 * Split a code span whose code spans one or more line breaks into one per line; see
 * {@link splitMultilineSpans}.
 * @param {string} paragraph Paragraph.
 * @param {CodeSpan} span Code span in the paragraph.
 * @returns {string} Code spans, one per line, or the code span as is if it can’t be split.
 */
const splitCodeSpan = (paragraph, { start, end, fenceLength }) => {
  const codeSpan = paragraph.slice(start, end);
  let code = codeSpan.slice(fenceLength, -fenceLength);

  if (
    !code.includes('\n') ||
    !SPAN_BOUNDARY_REGEX.test(paragraph.slice(start - 1, start)) ||
    !SPAN_BOUNDARY_REGEX.test(paragraph.slice(end, end + 1))
  ) {
    return codeSpan;
  }

  // Like CommonMark, strip a space from both ends of the code if it starts and ends with one, like
  // in `` ` foo\nbar ` ``, as it would otherwise be kept at the end of a single line
  if (code.startsWith(' ') && code.endsWith(' ')) {
    code = code.slice(1, -1);
  }

  // The blockquote markers and the indentation of a line after the first aren’t part of the code,
  // so they go before the opening backticks
  const codeLines = code.split('\n').map((line, index) => {
    const indent = index ? (BLOCKQUOTE_PREFIX_AND_INDENT_REGEX.exec(line)?.[0] ?? '') : '';

    return { indent, text: line.slice(indent.length) };
  });

  // A line without code, like the first one of `` `\nfoo` ``, can’t be a code span
  if (codeLines.some(({ text }) => !/\S/.test(text))) {
    return codeSpan;
  }

  const fence = '`'.repeat(fenceLength);

  return codeLines
    .map(({ indent, text }) => {
      // A backtick next to the fence would become part of it, and a space at both ends would be
      // stripped, so the code is padded with a space on both sides, which is stripped from it
      // instead, like in ``` `` `foo` `` ```
      const padding = /^`|`$|^ [^]* $/.test(text) ? ' ' : '';

      return `${indent}${fence}${padding}${text}${padding}${fence}`;
    })
    .join('\n');
};

/**
 * Split a code span whose code spans one or more line breaks into one per line, like
 * `` `foo\nbar` `` into `` `foo`\n`bar` ``, or ``` ``foo\nbar`` ``` into ``` ``foo``\n``bar`` ```,
 * so the formatting around it can be split into separate lines as well, then do the same with a
 * link with {@link splitMultilineLinks}. Backslashes and spaces are literal in a code span. The
 * backticks are paired as Lexical pairs them, within a paragraph, so the closing backtick of a code
 * span isn’t taken as the opening one of another, like in table rows such as
 * `` | `**a**` | b |\n| `*c*` | d | ``, which would get stray backticks otherwise. A code span or a
 * link can’t span a blank line or the start of another block, like a list item, a heading or a
 * table row.
 * @param {string} part Part of a Markdown string outside fenced code blocks.
 * @returns {string} Processed part.
 * @see https://github.com/sveltia/sveltia-cms/issues/1168
 */
const splitMultilineSpans = (part) => {
  if (!/[`[]/.test(part)) {
    return part;
  }

  const lines = part.split('\n');
  // An HTML block is raw HTML, which is kept as is, so each of its lines is left on its own
  const htmlBlockLines = part.includes('<') ? findHtmlBlockLines(lines) : [];
  // The lines of a paragraph in a blockquote are read without the blockquote markers
  const quotes = lines.map(getBlockquotePrefix);
  const contents = lines.map((line, index) => line.slice(quotes[index].length));
  /** @type {string[][]} */
  const paragraphs = [];
  let level = 0;

  lines.forEach((line, index) => {
    const previous = contents[index - 1];

    if (
      index === 0 ||
      htmlBlockLines[index] ||
      htmlBlockLines[index - 1] ||
      endsParagraph(previous) ||
      interruptsParagraph(contents[index]) ||
      !isInSameBlockquote(level, quotes[index]) ||
      // Lexical reads a table row as a line of its own, so a code span can’t continue after it
      TABLE_ROW_LINE_REGEX.test(previous)
    ) {
      paragraphs.push([line]);
      level = getBlockquoteLevel(quotes[index]);
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

      return splitMultilineLinks(
        mapCodeSpans(paragraph, {
          /**
           * Split a code span of the paragraph.
           * @param {string} _codeSpan Code span, with its backticks.
           * @param {CodeSpan} span Position of the code span.
           * @returns {string} Processed code span.
           */
          inside: (_codeSpan, span) => splitCodeSpan(paragraph, span),
        }),
      );
    })
    .join('\n');
};

/**
 * Regular expression to match an inline link or a full reference link whose text spans one or more
 * line breaks. The first run can’t have a line break, so a `[` followed by many lines isn’t matched
 * in quadratic time. A bracket after an escaped backslash, like `\\[`, isn’t escaped.
 */
const HAS_MULTILINE_LINK_TEXT_REGEX = new RegExp(
  String.raw`${UNESCAPED_LOOKBEHIND}\[[^[\]\n]*\n[^[\]]*\](?=[([])`,
);

/**
 * Check if the text of formatting that spans line breaks has a line break within a code span or a
 * link text, which {@link splitMultilineSpans} and {@link splitMultilineLinks} couldn’t split.
 * @param {string} text Text matched by one of {@link MULTILINE_FORMATTING_REGEXES}.
 * @returns {boolean} Result.
 */
const hasLineBreakInSpan = (text) =>
  findCodeSpans(text).some(({ start, end }) => text.slice(start, end).includes('\n')) ||
  HAS_MULTILINE_LINK_TEXT_REGEX.test(text);

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
    let result = splitMultilineSpans(part);
    let previous;

    // Split the inner formatting first, so `**_foo\nbar_**` becomes `**_foo_**\n**_bar_**`, not
    // `**_foo**_\n_**bar_**`. The outer one is split on the next pass. A text can’t have its own
    // marker, so formatting is nested a few levels deep at most
    while (result !== previous) {
      previous = result;
      result = MULTILINE_FORMATTING_REGEXES.reduce(
        (current, [marker, regex]) =>
          current.replace(regex, (match, formattedText, offset) => {
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

            // The formatting can only continue on a line in the same blockquote as the first one
            const level = getBlockquoteLevel(
              getBlockquotePrefix(current.slice(current.lastIndexOf('\n', offset - 1) + 1, offset)),
            );

            // A line with only markers, like `**` in `_**\n**_` of `**_(a)_**\n**_(b)_**`, means
            // the match runs from the closing marker of one line to the opening marker of the next,
            // which isn’t formatting. Splitting it would add markers that match again, without end
            if (
              lines.some(({ text: lineText }) => /^[*_~]+$/.test(lineText)) ||
              lines
                .slice(1)
                .some(
                  ({ quote, indent, text: lineText }) =>
                    !isInSameBlockquote(level, quote) ||
                    interruptsParagraph(`${indent.slice(quote.length)}${lineText}`),
                )
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
