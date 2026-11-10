import { INFO_BACKTICK } from './transformers/code.js';
import {
  HTML_BLOCK_PLACEHOLDER,
  HTML_TAG_SOURCE,
  INLINE_HTML_REGEX,
} from './transformers/raw-syntax.js';

/**
 * @typedef {object} CodeBlock
 * @property {number} start Index of the line with the opening fence.
 * @property {number} end Index of the line with the closing fence, or of the last line if the code
 * block is not closed, in which case it runs to the end of the document.
 * @property {string} fence Opening fence, made of three or more backticks or tildes.
 * @property {boolean} closed Whether the code block has a closing fence.
 */

/**
 * Find the fenced code blocks in the lines of a Markdown string.
 * @param {string[]} lines Lines of a Markdown string.
 * @returns {CodeBlock[]} Code blocks.
 */
const findCodeBlocks = (lines) => {
  /** @type {CodeBlock[]} */
  const blocks = [];
  /** @type {Omit<CodeBlock, 'end' | 'closed'> | undefined} */
  let openBlock;

  lines.forEach((line, index) => {
    // Like Lexical’s `CODE_START_REGEX`, allow an indented fence. A backtick fence can’t be
    // followed by a backtick on the same line; see `CODE`
    const fence = line.match(/^[ \t]*(`{3,}(?=[^`]*$)|~{3,})/)?.[1];

    if (!openBlock) {
      if (fence) {
        openBlock = { start: index, fence };
      }

      return;
    }

    // Like Lexical’s `CODE_END_REGEX`, a code block is only closed by a bare fence of the same
    // character that is at least as long as the opening one, so a shorter fence within the block,
    // like ```` ``` ```` within ```` ```` ````, is part of the code
    if (
      fence?.[0] === openBlock.fence[0] &&
      fence.length >= openBlock.fence.length &&
      !line.trim().slice(fence.length)
    ) {
      blocks.push({ ...openBlock, end: index, closed: true });
      openBlock = undefined;
    }
  });

  if (openBlock) {
    blocks.push({ ...openBlock, end: lines.length - 1, closed: false });
  }

  return blocks;
};

/**
 * Apply a function to the parts of a Markdown string outside fenced code blocks, leaving the code
 * blocks, fences included, untouched. Each part is given with the line breaks around it, if any, so
 * a regular expression can tell the start and the end of a line from those of the part.
 * @param {string} value Markdown string to process.
 * @param {(part: string) => string} callback Function that returns a processed part. It must keep
 * the line breaks at the start and the end of the part.
 * @returns {string} Processed Markdown string.
 */
const mapOutsideCodeBlocks = (value, callback) => {
  const lines = value.split('\n');
  /** @type {string[]} */
  const output = [];
  let index = 0;

  /**
   * Process the lines from the current index to the given one, exclusive.
   * @param {number} end Index of the line to stop at.
   */
  const flush = (end) => {
    if (end > index) {
      const before = index > 0 ? '\n' : '';
      const after = end < lines.length ? '\n' : '';
      const part = callback(`${before}${lines.slice(index, end).join('\n')}${after}`);

      output.push(part.slice(before.length, part.length - after.length));
    }
  };

  findCodeBlocks(lines).forEach(({ start, end }) => {
    flush(start);
    output.push(lines.slice(start, end + 1).join('\n'));
    index = end + 1;
  });

  flush(lines.length);

  return output.join('\n');
};

/**
 * Apply a function to each line of a Markdown string, leaving the lines inside fenced code blocks
 * untouched.
 * @param {string} value Markdown string to process.
 * @param {(line: string) => string} callback Function that returns a processed line.
 * @returns {string} Processed Markdown string.
 */
const mapLinesOutsideCodeBlocks = (value, callback) => {
  const lines = value.split('\n');

  const codeLines = new Set(
    findCodeBlocks(lines).flatMap(({ start, end }) =>
      Array.from({ length: end - start + 1 }, (_, offset) => start + offset),
    ),
  );

  return lines.map((line, index) => (codeLines.has(index) ? line : callback(line))).join('\n');
};

/**
 * Regular expression to match a setext heading underline, like `===` or `---`.
 */
const SETEXT_UNDERLINE_REGEX = /^ {0,3}(=+|-+)[ \t]*$/;
/**
 * Regular expression to match an ATX heading, like `## Heading`.
 */
const ATX_HEADING_REGEX = /^ {0,3}#{1,6}(?:[ \t]|$)/;
/**
 * Regular expression to match a thematic break, like `***` or `- - -`.
 */
const THEMATIC_BREAK_REGEX = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;

/**
 * Names of the HTML elements that start an HTML block that can interrupt a paragraph, as opposed to
 * inline HTML, like `<span>`, which a paragraph can start with.
 * @see https://spec.commonmark.org/0.31.2/#html-blocks
 */
const HTML_BLOCK_TAG_NAMES = [
  'address',
  'article',
  'aside',
  'base',
  'basefont',
  'blockquote',
  'body',
  'caption',
  'center',
  'col',
  'colgroup',
  'dd',
  'details',
  'dialog',
  'dir',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'frame',
  'frameset',
  'h[1-6]',
  'head',
  'header',
  'hr',
  'html',
  'iframe',
  'legend',
  'li',
  'link',
  'main',
  'menu',
  'menuitem',
  'nav',
  'noframes',
  'ol',
  'optgroup',
  'option',
  'p',
  'param',
  'search',
  'section',
  'summary',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'title',
  'tr',
  'track',
  'ul',
];

/**
 * Start and end conditions of the HTML blocks that can interrupt a paragraph: a raw text element, a
 * comment, a processing instruction, a declaration, a CDATA section or a block element. The start
 * is what follows the `<` at the start of the line. The end of the block is the line that matches
 * the end condition, or the line before a blank line if there’s none.
 * @type {[string, RegExp | null][]}
 * @see https://spec.commonmark.org/0.31.2/#html-blocks
 */
const HTML_BLOCK_CONDITION_SOURCES = [
  ['(?:script|pre|style|textarea)(?:[ \\t>]|$)', /<\/(?:pre|script|style|textarea)>/i],
  ['!--', /-->/],
  ['\\?', /\?>/],
  ['![A-Za-z]', />/],
  ['!\\[CDATA\\[', /\]\]>/],
  [`/?(?:${HTML_BLOCK_TAG_NAMES.join('|')})(?:[ \\t>]|/>|$)`, null],
];

/**
 * Regular expression to match the start of an HTML block that can interrupt a paragraph; see
 * {@link HTML_BLOCK_CONDITION_SOURCES}.
 */
const HTML_BLOCK_START_REGEX = new RegExp(
  `<(?:${HTML_BLOCK_CONDITION_SOURCES.map(([start]) => start).join('|')})`,
  'i',
);

/**
 * Start and end conditions of the HTML blocks that can interrupt a paragraph, with the start as a
 * regular expression to match a line; see {@link HTML_BLOCK_CONDITION_SOURCES}.
 * @type {[RegExp, RegExp | null][]}
 */
const HTML_BLOCK_CONDITIONS = HTML_BLOCK_CONDITION_SOURCES.map(([start, end]) => [
  new RegExp(`^ {0,3}<(?:${start})`, 'i'),
  end,
]);

/**
 * Global version of `INLINE_HTML_REGEX`.
 */
const GLOBAL_INLINE_HTML_REGEX = new RegExp(INLINE_HTML_REGEX, 'g');

/**
 * Regular expression to match a line that starts an HTML block that can’t interrupt a paragraph.
 * @see https://spec.commonmark.org/0.31.2/#html-blocks
 */
const STANDALONE_HTML_TAG_REGEX = new RegExp(
  `^ {0,3}(?!</?(?:pre|script|style|textarea)\\b)(?:${HTML_TAG_SOURCE})[ \\t]*$`,
  'i',
);

/**
 * Regular expression to match a line that doesn’t continue a paragraph: an ATX heading, a
 * blockquote, a list item, a code fence, a table row, an HTML block, an indented code block, a
 * thematic break or a setext heading underline.
 */
const NON_PARAGRAPH_LINE_REGEX = new RegExp(
  [
    ATX_HEADING_REGEX.source,
    /^ {0,3}(?:>|[-+*](?:[ \t]|$)|\d{1,9}[.)](?:[ \t]|$)|`{3,}|~{3,}|\|)/.source,
    `^ {0,3}${HTML_BLOCK_START_REGEX.source}`,
    /^(?: {4}|\t)/.source,
    THEMATIC_BREAK_REGEX.source,
    SETEXT_UNDERLINE_REGEX.source,
  ].join('|'),
  'i',
);

/**
 * Regular expression to match a line that is a block on its own, so the line after it isn’t in a
 * paragraph: an ATX heading or a thematic break. A setext heading underline is one as well, but
 * only after a paragraph line.
 */
const SINGLE_LINE_BLOCK_REGEX = new RegExp(
  [ATX_HEADING_REGEX.source, THEMATIC_BREAK_REGEX.source].join('|'),
);

/**
 * Regular expression to match a line that ends the paragraph before it: a line that doesn’t
 * continue a paragraph, other than an indented line, which does.
 */
const PARAGRAPH_INTERRUPTION_REGEX = new RegExp(
  NON_PARAGRAPH_LINE_REGEX.source.replace(`|${/^(?: {4}|\t)/.source}`, ''),
  'i',
);

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
 * Backslashes and spaces are literal in a code span.
 * @param {string} part Part of a Markdown string outside fenced code blocks.
 * @returns {string} Processed part.
 */
const splitMultilineCodeSpans = (part) =>
  part.replace(
    /(?<=^|[\s\p{P}\p{S}])(?<![`\\])`([^`\n]+?)\n([^`\n]+?)`(?=[\s\p{P}\p{S}]|$)(?!`)/gu,
    '`$1`\n`$2`',
  );

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
                .some(({ indent, text: lineText }) =>
                  PARAGRAPH_INTERRUPTION_REGEX.test(`${indent}${lineText}`),
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

/**
 * Placeholder put after an escaped backslash at the end of a line; see `addImportPlaceholders()`.
 */
const ESCAPED_BACKSLASH_PLACEHOLDER = '\uE002';
/**
 * Placeholder put with a period between a backslash and a formatting marker; see
 * `addImportPlaceholders()`.
 */
const PUNCTUATION_PLACEHOLDER = '\uE003';
/**
 * Placeholder put in place of a tab in a code span; see `addImportPlaceholders()`.
 */
const CODE_TAB_PLACEHOLDER = '\uE005';
/**
 * Placeholder put in place of a space in a code span made only of spaces; see
 * `addImportPlaceholders()`.
 */
const CODE_SPACE_PLACEHOLDER = '\uE006';

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
  /**
   * End condition of the current HTML block: a regular expression, `null` for a blank line, or
   * `undefined` if the line is not in an HTML block.
   * @type {RegExp | null | undefined}
   */
  let end;
  let isInParagraph = false;

  return part
    .split('\n')
    .map((line) => {
      const isBlankLine = !line.trim();

      if (end === null && isBlankLine) {
        end = undefined;
      }

      if (end === undefined) {
        const condition = HTML_BLOCK_CONDITIONS.find(([start]) => start.test(line));

        if (condition) {
          [, end] = condition;
        } else if (!isInParagraph && STANDALONE_HTML_TAG_REGEX.test(line)) {
          end = null;
        } else {
          // A heading or a thematic break doesn’t leave a paragraph open, so a standalone tag
          // after it starts an HTML block. A line like `===` is a heading underline only after a
          // paragraph line, and paragraph text otherwise
          isInParagraph =
            !isBlankLine &&
            !SINGLE_LINE_BLOCK_REGEX.test(line) &&
            !(isInParagraph && SETEXT_UNDERLINE_REGEX.test(line));

          return line.includes('\t')
            ? line.replace(GLOBAL_INLINE_HTML_REGEX, (tag) =>
                tag.replaceAll('\t', CODE_TAB_PLACEHOLDER),
              )
            : line;
        }
      }

      if (end?.test(line)) {
        end = undefined;
      }

      isInParagraph = false;

      return `${HTML_BLOCK_PLACEHOLDER}${line.replaceAll('\t', CODE_TAB_PLACEHOLDER)}`;
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

/**
 * Convert the fenced code blocks using tildes, like `~~~`, to ones using backticks, because Lexical
 * only supports the latter. The new fence is made longer than any backtick fence in the code, so
 * the code block isn’t closed early. Backticks can’t be used in the info string of a backtick
 * fence, so those after the language are replaced with a placeholder, which the code block
 * transformer turns back into backticks, exporting a tilde fence again; see `CODE`. Other backticks
 * are removed.
 * @param {string} value Markdown string to process.
 * @returns {string} Processed Markdown string.
 */
export const convertTildeFences = (value) => {
  if (!/^[ \t]*~{3,}/m.test(value)) {
    return value;
  }

  const lines = value.split('\n');

  findCodeBlocks(lines)
    .filter(({ fence }) => fence.startsWith('~'))
    .forEach(({ start, end, closed }) => {
      const codeLines = lines.slice(start + 1, closed ? end : end + 1);

      const longestFence = Math.max(
        2,
        ...codeLines.map(
          (line) => /** @type {RegExpMatchArray} */ (line.match(/^[ \t]*(`*)/))[1].length,
        ),
      );

      const backticks = '`'.repeat(longestFence + 1);

      // Unlike that of a tilde fence, the info string of a backtick fence can’t contain a backtick
      lines[start] = lines[start].replace(
        /^([ \t]*)~+([ \t]*[\w-]+)?(.*)$/,
        (_, indent, language, rest) =>
          `${indent}${backticks}${language ?? ''}${rest.replaceAll('`', language ? INFO_BACKTICK : '')}`,
      );

      if (closed) {
        lines[end] = lines[end].replace(/^([ \t]*)~+[ \t]*$/, `$1${backticks}`);
      }
    });

  return lines.join('\n');
};

/**
 * Check if the given line is part of a paragraph.
 * @param {string} line Line.
 * @returns {boolean} Result.
 */
const isParagraphLine = (line) => !!line.trim() && !NON_PARAGRAPH_LINE_REGEX.test(line);

/**
 * Convert setext headings, underlined with `===` or `---`, to ATX headings, like `# Heading`,
 * because Lexical only supports the latter. Without it, the underline is imported as text or a
 * horizontal rule. Fenced code blocks are left untouched. To avoid misreading a horizontal rule,
 * only a paragraph that follows a blank line, an ATX heading or the start of the document is
 * converted; for example, the second `---` of a block like front matter, which starts with a
 * horizontal rule, is left as is.
 * @param {string} value Markdown string to process.
 * @returns {string} Processed Markdown string.
 */
export const convertSetextHeadings = (value) => {
  if (!/^ {0,3}(?:=+|-+)[ \t]*$/m.test(value)) {
    return value;
  }

  return mapOutsideCodeBlocks(value, (part) => {
    /** @type {string[]} */
    const lines = [];

    part.split('\n').forEach((line) => {
      const [, underline] = line.match(SETEXT_UNDERLINE_REGEX) ?? [];
      let start = lines.length;

      while (start > 0 && isParagraphLine(lines[start - 1])) {
        start -= 1;
      }

      const previous = lines[start - 1];

      if (
        !underline ||
        start === lines.length ||
        (previous !== undefined && previous.trim() && !ATX_HEADING_REGEX.test(previous))
      ) {
        lines.push(line);

        return;
      }

      const text = lines
        .splice(start)
        .map((paragraphLine) => paragraphLine.trim())
        .join(' ');

      lines.push(`${underline.startsWith('=') ? '#' : '##'} ${text}`);
    });

    return lines.join('\n');
  });
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
