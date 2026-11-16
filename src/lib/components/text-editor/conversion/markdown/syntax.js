/**
 * Regular expression sources and helpers to read the Markdown syntax, shared by the Markdown
 * processing and the transformers. They don’t depend on Lexical.
 */

import { CODE_TAB_PLACEHOLDER } from '../placeholder-chars.js';

/**
 * Regular expression source to match the place after a character that isn’t escaped: one preceded
 * by an even number of backslashes, which escape each other.
 */
export const UNESCAPED_LOOKBEHIND = String.raw`(?<!(?:^|[^\\])(?:\\\\)*\\)`;

/**
 * Count the backslashes right before the given index, which escape the character there if their
 * number is odd. They’re counted rather than matched with a regular expression, which would take
 * quadratic time on a long run of backslashes.
 * @param {string} text Text.
 * @param {number} index Index.
 * @returns {number} Number of backslashes.
 */
export const countBackslashesBefore = (text, index) => {
  let count = 0;

  while (text[index - count - 1] === '\\') {
    count += 1;
  }

  return count;
};

/**
 * Regular expression source to match a whitespace, punctuation or symbol character, which can
 * flank a delimiter run as opposed to a word character. It needs the `u` flag.
 * @see https://spec.commonmark.org/0.31.2/#left-flanking-delimiter-run
 */
export const WHITESPACE_OR_PUNCTUATION = String.raw`[\s\p{P}\p{S}]`;

/**
 * Regular expression to match a {@link WHITESPACE_OR_PUNCTUATION whitespace, punctuation or symbol
 * character}.
 */
export const WHITESPACE_OR_PUNCTUATION_REGEX = new RegExp(WHITESPACE_OR_PUNCTUATION, 'u');

/**
 * Check if the given character is a word character, which is neither whitespace nor punctuation
 * (or a symbol). An underscore next to one on both sides can’t open or close emphasis.
 * @param {string | undefined} char Character.
 * @returns {boolean} Result.
 * @see https://spec.commonmark.org/0.31.2/#left-flanking-delimiter-run
 */
export const isWordChar = (char) => !!char && !WHITESPACE_OR_PUNCTUATION_REGEX.test(char);

/**
 * Regular expression source to match a thematic break after its indentation, like `***` or
 * `- - -`, up to the end of the line. Each character is spelled out rather than matched with a
 * backreference, so the source can be combined with other capturing groups.
 * @see https://spec.commonmark.org/0.31.2/#thematic-breaks
 */
export const THEMATIC_BREAK = String.raw`(?:${[
  String.raw`-(?:[ \t]*-){2,}`,
  String.raw`\*(?:[ \t]*\*){2,}`,
  String.raw`_(?:[ \t]*_){2,}`,
].join('|')})[ \t]*$`;
/**
 * Regular expression source to match a setext heading underline after its indentation, like `===`
 * or `---`, up to the end of the line. A single `-` is also a bullet list item, so where both are
 * matched as alternatives, the list item comes first.
 * @see https://spec.commonmark.org/0.31.2/#setext-headings
 */
export const SETEXT_UNDERLINE = String.raw`(?:=+|-+)[ \t]*$`;
/**
 * Regular expression source to match the opening sequence of an ATX heading, like `##`, which has
 * to be followed by {@link MARKER_END}.
 * @see https://spec.commonmark.org/0.31.2/#atx-headings
 */
export const ATX_HEADING_MARKER = '#{1,6}';
/**
 * Regular expression source to match a bullet list marker, which has to be followed by
 * {@link MARKER_END}.
 * @see https://spec.commonmark.org/0.31.2/#list-items
 */
export const BULLET_LIST_MARKER = '[-+*]';
/**
 * Regular expression source to match the number of an ordered list marker.
 * @see https://spec.commonmark.org/0.31.2/#list-items
 */
export const ORDERED_LIST_NUMBER = String.raw`\d{1,9}`;
/**
 * Regular expression source to match the delimiter after the number of an ordered list marker.
 */
export const ORDERED_LIST_DELIMITER = '[.)]';

/**
 * Regular expression source to match an ordered list marker, like `1.` or `1)`.
 */
const ORDERED_LIST_MARKER = `${ORDERED_LIST_NUMBER}${ORDERED_LIST_DELIMITER}`;

/**
 * Regular expression source to match a bullet or ordered list marker, which has to be followed by
 * {@link MARKER_END}.
 */
export const LIST_MARKER = `(?:${BULLET_LIST_MARKER}|${ORDERED_LIST_MARKER})`;
/**
 * Regular expression source to match the place after an ATX heading or list marker: whitespace or
 * the end of the line.
 */
export const MARKER_END = String.raw`(?=[ \t]|$)`;
/**
 * Regular expression source to match a code fence, made of three or more backticks or tildes.
 * @see https://spec.commonmark.org/0.31.2/#fenced-code-blocks
 */
export const CODE_FENCE = '(?:`{3,}|~{3,})';

/**
 * Whitespace within an HTML tag, including the placeholder of a tab; see `addImportPlaceholders()`.
 */
const TAG_SPACE = `[ \\t${CODE_TAB_PLACEHOLDER}]`;

/**
 * Regular expression source to match an HTML open tag or closing tag.
 * @see https://spec.commonmark.org/0.31.2/#raw-html
 */
export const HTML_TAG_SOURCE =
  `<[A-Za-z][A-Za-z0-9-]*(?:${TAG_SPACE}+[A-Za-z_:][\\w.:-]*` +
  `(?:${TAG_SPACE}*=${TAG_SPACE}*` +
  `(?:[^\\s"'=<>\`${CODE_TAB_PLACEHOLDER}]+|'[^'\\n]*'|"[^"\\n]*"))?)*` +
  `${TAG_SPACE}*/?>|</[A-Za-z][A-Za-z0-9-]*${TAG_SPACE}*>`;

/**
 * Regular expression source to match the place before a `<` that isn’t escaped. The lookahead comes
 * first, so the lookbehind is only tried before a `<`.
 */
const UNESCAPED_LT_SOURCE = `(?=<)${UNESCAPED_LOOKBEHIND}`;

/**
 * Regular expression to match inline raw HTML on a line: an open tag, a closing tag, a comment, a
 * processing instruction, a declaration or a CDATA section, which isn’t escaped.
 * @see https://spec.commonmark.org/0.31.2/#raw-html
 */
export const INLINE_HTML_REGEX = new RegExp(
  [
    UNESCAPED_LT_SOURCE,
    '(?:',
    [
      HTML_TAG_SOURCE,
      // Comment
      String.raw`<!-->|<!--->|<!--.*?-->`,
      // Processing instruction
      String.raw`<\?.*?\?>`,
      // Declaration
      String.raw`<![A-Za-z][^>]*>`,
      // CDATA section
      String.raw`<!\[CDATA\[.*?\]\]>`,
    ].join('|'),
    ')',
  ].join(''),
);

/**
 * Regular expression source to match a URI scheme that runs a script or embeds content, in any
 * case, as a scheme is case-insensitive.
 */
const UNSAFE_SCHEME_SOURCE = `(?:${['javascript', 'vbscript', 'data']
  .map((scheme) => scheme.replace(/[a-z]/g, (char) => `[${char}${char.toUpperCase()}]`))
  .join('|')})`;

/**
 * Regular expression to match an autolink, like `<https://example.com>` or `<foo@example.com>`,
 * which isn’t escaped.
 * @see https://spec.commonmark.org/0.31.2/#autolinks
 */
export const AUTOLINK_REGEX = new RegExp(
  [
    UNESCAPED_LT_SOURCE,
    '(?:',
    [
      // URI, other than one with a scheme that runs a script or embeds content, which is left to
      // be escaped as text
      String.raw`<(?!${UNSAFE_SCHEME_SOURCE}:)[A-Za-z][A-Za-z0-9+.-]{1,31}:[^\s<>]*>`,
      // Email address
      String.raw`<[\w.!#$%&'*+/=?^\x60{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?` +
        String.raw`(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*>`,
    ].join('|'),
    ')',
  ].join(''),
);

/**
 * Regular expression to match a footnote reference, like `[^1]`, which isn’t escaped. Footnotes
 * aren’t supported, but they’re read by GitHub and many other renderers.
 * @see https://github.github.com/gfm/
 */
export const FOOTNOTE_REFERENCE_REGEX = new RegExp(
  String.raw`${UNESCAPED_LOOKBEHIND}\[\^[^\s[\]]+\]`,
);
/**
 * Regular expression to match a named character reference, like `&copy;`, which isn’t escaped.
 * Lexical imports it as text, the same as the escaped `\&copy;`, which is exported escaped; see
 * `escapeNamedCharacterReferences()`. The lookahead comes first, so the lookbehind is only tried
 * before a `&`.
 * @see https://spec.commonmark.org/0.31.2/#entity-and-numeric-character-references
 */
export const NAMED_CHARACTER_REFERENCE_REGEX = new RegExp(
  `(?=&)${UNESCAPED_LOOKBEHIND}&[A-Za-z][A-Za-z\\d]*;`,
);
