import { $isLineBreakNode as isLineBreakNode, $isTextNode as isTextNode } from 'lexical';

import { getFormatExportNode } from './inline-code.js';
import { getRawSyntax } from './raw-syntax.js';

/**
 * @import { TextMatchTransformer } from '@lexical/markdown';
 * @import { ElementNode, LexicalNode, TextNode } from 'lexical';
 */

/**
 * Escape the Markdown block syntax at the start of a line, so text that only looks like a heading,
 * a list item, a blockquote, a setext heading underline or a thematic break stays text when the
 * Markdown is read again. Lexical already escapes the inline syntax characters, including `*`, `_`,
 * `` ` `` and `~`.
 * @param {string} text Exported Markdown of a line start.
 * @returns {string} Escaped Markdown.
 */
export const escapeBlockSyntax = (text) =>
  text
    // ATX heading, bullet list item, blockquote, setext heading underline or thematic break
    .replace(/^( {0,3})(#{1,6}(?=[ \t]|$)|[-+](?=[ \t]|$)|>|=+[ \t]*$|-{2,}[ \t]*$)/, '$1\\$2')
    // Ordered list item, whose number can’t be escaped, unlike the delimiter after it
    .replace(/^( {0,3}\d{1,9})([.)])(?=[ \t]|$)/, '$1\\$2');

/**
 * Check if the given character is a word character, which is neither whitespace nor punctuation
 * (or a symbol). An underscore next to one on both sides can’t open or close emphasis.
 * @param {string | undefined} char Character.
 * @returns {boolean} Result.
 * @see https://spec.commonmark.org/0.31.2/#left-flanking-delimiter-run
 */
const isWordChar = (char) => !!char && /[^\s\p{P}\p{S}]/u.test(char);

/**
 * Remove the backslashes Lexical adds before underscores and backslashes in text, where they’re not
 * needed, so `snake_case` and `C:\Users` aren’t exported as `snake\_case` and `C:\\Users`. Unlike
 * a global replacement, the escapes that are needed are kept: an underscore that could open or
 * close emphasis, like that in `\_not italic\_`, and a backslash that would otherwise escape the
 * next character or make a hard line break.
 * @param {string} markdown Markdown exported from a text node with its format, in which every
 * backslash starts an escape.
 * @returns {string} Tidied Markdown.
 * @see https://github.com/sveltia/sveltia-cms/issues/430
 * @see https://github.com/sveltia/sveltia-cms/issues/512
 */
export const unescapeText = (markdown) =>
  markdown.replace(/((?:\\_)+)|\\(.)/gs, (match, underscores, char, offset, string) => {
    if (underscores) {
      return isWordChar(string[offset - 1]) && isWordChar(string[offset + match.length])
        ? underscores.replaceAll('\\', '')
        : match;
    }

    if (char === '\\') {
      const next = string[offset + 2];

      // The backslash is literal unless it’s followed by ASCII punctuation, which it would
      // escape, or a line break, which it would turn into a hard line break. The end of the node
      // is kept escaped, as the next node may start with either
      return next && !/[\n\r!-/:-@[-`{-~]/.test(next) ? char : match;
    }

    return match;
  });

/**
 * Characters for the numeric character references Lexical exports in place of literal text.
 * @type {Record<string, string>}
 */
const REFERENCED_CHARS = { 38: '&', 60: '<', 91: '[', 93: ']' };
/**
 * Regular expression to match the start of an email autolink after its `<`, which can start with a
 * digit or a symbol, like `<1@example.com>`.
 * @see https://spec.commonmark.org/0.31.2/#email-autolink
 */
const EMAIL_AUTOLINK_START_REGEX = /^[\w.!#$%&'*+/=?^`{|}~-]{1,64}@[A-Za-z\d]/;

/**
 * Replace the numeric character references Lexical exports for `<`, `&`, `[` and `]` in text, so
 * HTML, a character reference or a link isn’t read from it, with the characters themselves where
 * they can’t start one, so `a <= b`, `see [1]` and the `[ ]` of a task list item stay readable.
 * The others are escaped with a backslash instead, as the Markdown would be written by hand: a `<`
 * that could start a tag, a comment or an autolink, a `&` that could start a numeric reference, a
 * `[` that could start a footnote and a `]` that could end a link text or a link label. One at the
 * end of the node stays escaped, as the next node may complete the syntax, unless nothing but a
 * line break follows, which none of them can be followed by. A bracket in a link text stays escaped
 * too, as unbalanced brackets would end the link text early. Every replacement is punctuation,
 * like the reference, so the escapes left by `unescapeText()` stay valid.
 * @param {string} markdown Markdown exported from a text node with its format.
 * @param {object} context Where the text node is.
 * @param {boolean} context.isInLink Whether the text node is in a link.
 * @param {boolean} context.isAtLineEnd Whether the text node is at the end of a line.
 * @returns {string} Tidied Markdown.
 * @see https://github.com/facebook/lexical/pull/9481
 */
export const unescapeCharacterReferences = (markdown, { isInLink, isAtLineEnd }) =>
  markdown.replace(/&#(38|60|91|93);/g, (match, code, offset, string) => {
    const char = REFERENCED_CHARS[code];
    // Enough for the local part of an email address, the longest the checks below need, without
    // copying the rest of a long text each time
    const next = string.slice(offset + match.length, offset + match.length + 70);

    const isNeeded =
      (!next && !isAtLineEnd) ||
      (char === '<' && (/^[A-Za-z/!?]/.test(next) || EMAIL_AUTOLINK_START_REGEX.test(next))) ||
      (char === '&' && /^#(?:\d{1,7}|[xX][\dA-Fa-f]{1,6});/.test(next)) ||
      (char === '[' && (isInLink || next.startsWith('^'))) ||
      (char === ']' && (isInLink || /^[(:[]/.test(next)));

    return isNeeded ? `\\${char}` : char;
  });

/**
 * Check if the given text node is italic and the italic text it’s part of is next to a word
 * character, like `b` in `a*b*c`. The italic text then needs the `*` delimiter instead of `_`,
 * which can’t be used within a word.
 * @param {TextNode} node Text node.
 * @returns {boolean} Result.
 */
const isItalicWithinWord = (node) => {
  if (!node.hasFormat('italic')) {
    return false;
  }

  /**
   * Check if the given node is italic text.
   * @param {LexicalNode | null} sibling Node.
   * @returns {sibling is TextNode} Result.
   */
  const isItalicText = (sibling) => isTextNode(sibling) && sibling.hasFormat('italic');
  let first = node;
  let last = node;

  while (isItalicText(first.getPreviousSibling())) {
    first = /** @type {TextNode} */ (first.getPreviousSibling());
  }

  while (isItalicText(last.getNextSibling())) {
    last = /** @type {TextNode} */ (last.getNextSibling());
  }

  // Lexical puts the delimiters inside the leading and trailing whitespace, if any
  const firstText = first.getTextContent();
  const lastText = last.getTextContent();
  const before = /^\s/.test(firstText) ? ' ' : first.getPreviousSibling()?.getTextContent().at(-1);
  const after = /\s$/.test(lastText) ? ' ' : last.getNextSibling()?.getTextContent()[0];

  return isWordChar(before) || isWordChar(after);
};

/**
 * Placeholder for the text of a raw syntax node, which Lexical doesn’t escape.
 */
const RAW_TEXT = '\uE000';

/**
 * Export-only transformer that tidies up the Markdown of a text node that isn’t inline code, which
 * Lexical exports verbatim. It removes the unnecessary escapes Lexical adds; see `unescapeText()`.
 * It uses `*` instead of `_` for italic text within a word, like `a*b*c`, which would otherwise be
 * exported as `a_b_c`, plain text. Last, it escapes the Markdown block syntax at the start of a
 * block or of a line after a line break. Without it, a paragraph typed as `## Hours` with the
 * Markdown shortcuts turned off, pasted as text, or imported from the escaped `\## Hours` would be
 * exported as is and become a heading the next time the Markdown is read. The text imported from
 * the syntax the editor doesn’t support, like a list in a blockquote, is exported as is instead;
 * see `RAW_SYNTAX`.
 * @type {TextMatchTransformer}
 */
export const BLOCK_SYNTAX_ESCAPE = {
  dependencies: [],
  /**
   * Export a text node.
   * @param {LexicalNode} node Node.
   * @param {(node: ElementNode) => string} _exportChildren Function to export the children of an
   * element, unused.
   * @param {(node: TextNode, textContent: string) => string} exportFormat Function to export a text
   * node with its format.
   * @returns {string | null} Markdown, or `null` to leave the node to the other transformers.
   */
  export: (node, _exportChildren, exportFormat) => {
    if (!isTextNode(node) || node.hasFormat('code')) {
      return null;
    }

    const text = node.getTextContent();

    // Lexical exports formatted whitespace, like the bold space in `**_a_ [b](u)**`, as is, but it
    // drops the closing syntax due after it, before a link for example, leaving `**_a_ **[b](u)**`.
    // Export a placeholder instead to get the closing syntax, which goes before the whitespace
    if (node.getFormat() && /^\s+$/.test(text)) {
      return `${exportFormat(getFormatExportNode(node), RAW_TEXT).replace(RAW_TEXT, '')}${text}`;
    }

    const rawSyntax = getRawSyntax(node);

    // Raw syntax is exported as is, but with the syntax of its format, if any
    let markdown = exportFormat(
      getFormatExportNode(node),
      rawSyntax === undefined ? text : RAW_TEXT,
    );

    if (isItalicWithinWord(node)) {
      // Every underscore in the text is escaped, so an unescaped one is an italic delimiter
      markdown = markdown.replace(/\\.|_/gs, (match) => (match === '_' ? '*' : match));
    }

    if (rawSyntax !== undefined) {
      return markdown.replace(RAW_TEXT, () => rawSyntax);
    }

    const parent = node.getParent();
    const previous = node.getPreviousSibling();
    const next = node.getNextSibling();

    markdown = unescapeCharacterReferences(unescapeText(markdown), {
      isInLink: !!parent?.isInline(),
      isAtLineEnd: !next || isLineBreakNode(next),
    });

    // Text in a link or other inline element, in a code block, which is exported verbatim, or in a
    // heading, whose content is only parsed for inline syntax, or text after the start of a line
    if (
      !parent ||
      parent.isInline() ||
      ['code', 'heading'].includes(parent.getType()) ||
      (previous && !isLineBreakNode(previous))
    ) {
      return markdown;
    }

    // A formatted node starts with its own syntax, such as `**`, which is left as is
    return escapeBlockSyntax(markdown);
  },
  // Never used to import Markdown or as a shortcut
  regExp: /(?!)/,
  type: 'text-match',
};
