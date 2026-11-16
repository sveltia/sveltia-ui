/**
 * Regular expressions and helpers to read the block structure of a Markdown string, like the
 * headings, the HTML blocks and the lines that end a paragraph.
 */

import {
  ATX_HEADING_MARKER,
  CODE_FENCE,
  HTML_TAG_SOURCE,
  LIST_MARKER,
  MARKER_END,
  SETEXT_UNDERLINE,
  THEMATIC_BREAK,
} from './syntax.js';

/**
 * Regular expression to match a setext heading underline, like `===` or `---`.
 */
export const SETEXT_UNDERLINE_REGEX = new RegExp(`^ {0,3}${SETEXT_UNDERLINE}`);
/**
 * Regular expression to match an ATX heading, like `## Heading`.
 */
export const ATX_HEADING_REGEX = new RegExp(`^ {0,3}${ATX_HEADING_MARKER}${MARKER_END}`);

/**
 * Regular expression to match a thematic break, like `***` or `- - -`.
 */
const THEMATIC_BREAK_REGEX = new RegExp(`^ {0,3}${THEMATIC_BREAK}`);

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
    `^ {0,3}(?:>|${LIST_MARKER}${MARKER_END}|${CODE_FENCE}|\\|)`,
    `^ {0,3}${HTML_BLOCK_START_REGEX.source}`,
    /^(?: {4}|\t)/.source,
    THEMATIC_BREAK_REGEX.source,
    SETEXT_UNDERLINE_REGEX.source,
  ].join('|'),
  'i',
);

/**
 * Regular expression to match a table row, which starts with a pipe.
 */
export const TABLE_ROW_LINE_REGEX = /^ {0,3}\|/;

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
 * Check if the given line is paragraph text: a line that isn’t blank and doesn’t start another
 * block, or continue one like an indented code block.
 * @param {string} line Line.
 * @returns {boolean} Result.
 */
export const isParagraphLine = (line) => !!line.trim() && !NON_PARAGRAPH_LINE_REGEX.test(line);

/**
 * Check if a paragraph can’t continue after the given line: a blank line, or a block on its own,
 * like a heading or a thematic break.
 * @param {string} line Line.
 * @returns {boolean} Result.
 */
export const endsParagraph = (line) => !line.trim() || SINGLE_LINE_BLOCK_REGEX.test(line);

/**
 * Check if the given line can’t continue the paragraph before it: a blank line, or a line that
 * starts another block, like a list item, a heading or a table row. An indented line continues it.
 * @param {string} line Line.
 * @returns {boolean} Result.
 */
export const interruptsParagraph = (line) =>
  !line.trim() || PARAGRAPH_INTERRUPTION_REGEX.test(line);

/**
 * Find the lines of a part of a Markdown string that are in an HTML block, which is raw HTML,
 * without any Markdown syntax.
 * @param {string[]} lines Lines of a part of a Markdown string outside fenced code blocks.
 * @returns {boolean[]} Whether each line is in an HTML block.
 * @see https://spec.commonmark.org/0.31.2/#html-blocks
 */
export const findHtmlBlockLines = (lines) => {
  /**
   * End condition of the current HTML block: a regular expression, `null` for a blank line, or
   * `undefined` if the line is not in an HTML block.
   * @type {RegExp | null | undefined}
   */
  let end;
  let isInParagraph = false;

  return lines.map((line) => {
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
        // A heading or a thematic break doesn’t leave a paragraph open, so a standalone tag after
        // it starts an HTML block. A line like `===` is a heading underline only after a
        // paragraph line, and paragraph text otherwise
        isInParagraph =
          !endsParagraph(line) && !(isInParagraph && SETEXT_UNDERLINE_REGEX.test(line));

        return false;
      }
    }

    if (end?.test(line)) {
      end = undefined;
    }

    isInParagraph = false;

    return true;
  });
};
