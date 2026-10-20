import { $isLinkNode as isLinkNode } from '@lexical/link';
import { LINK as LEXICAL_LINK } from '@lexical/markdown';
import { $isLineBreakNode as isLineBreakNode, $isTextNode as isTextNode } from 'lexical';

/**
 * @import { TextMatchTransformer } from '@lexical/markdown';
 * @import { ElementNode, LexicalNode, TextFormatType, TextNode } from 'lexical';
 */

/**
 * Text formats that can be moved out of a link, with the Markdown delimiters Lexical can export
 * for each. Inline code can’t, as it would make the link text code.
 * @type {Partial<Record<TextFormatType, string[]>>}
 */
const FORMAT_DELIMITERS = {
  bold: ['**', '__'],
  italic: ['_', '*'],
  strikethrough: ['~~'],
};

/**
 * Regular expression to match a format delimiter at the start of a string.
 */
const DELIMITER_REGEX = /^(?:\*\*|__|~~|\*|_)/;

/**
 * Get the text of a node as exported: inline code starts and ends with a backtick, even if its text
 * is only whitespace.
 * @param {LexicalNode | null | undefined} node Node.
 * @returns {string} Text.
 */
const getExportedText = (node) =>
  isTextNode(node) && node.hasFormat('code') ? '`' : (node?.getTextContent() ?? '');

/**
 * Get the formats a link can be wrapped with instead of having them in its text, like `**[a](b)**`
 * instead of `[**a**](b)`: the ones every text node in the link has. Lexical puts the delimiters in
 * the link text, so the Markdown would change every time it’s exported. They’re only moved out if
 * the link text is all text with no whitespace at either end, other than in inline code, and the
 * character on either side of the link is whitespace or punctuation, which the delimiters need to
 * open and close emphasis there. If the text next to the link has any of the formats, it must be
 * whitespace, or the delimiters of the link and the text would meet.
 * @param {ElementNode} node Link node.
 * @returns {TextFormatType[]} Formats.
 * @see https://spec.commonmark.org/0.31.2/#left-flanking-delimiter-run
 */
const getOuterFormats = (node) => {
  const children = node.getChildren();

  if (
    !children.length ||
    !children.every((child) => isTextNode(child) && /\S/.test(getExportedText(child))) ||
    /^\s/.test(getExportedText(children[0])) ||
    /\s$/.test(getExportedText(children.at(-1)))
  ) {
    return [];
  }

  const formats = /** @type {TextFormatType[]} */ (Object.keys(FORMAT_DELIMITERS)).filter(
    (format) => children.every((child) => /** @type {TextNode} */ (child).hasFormat(format)),
  );

  /**
   * Check if the given sibling of the link allows the delimiters next to the link.
   * @param {LexicalNode | null} sibling Previous or next sibling.
   * @param {(text: string) => string | undefined} getChar Function to get the character next to
   * the link from the sibling’s text.
   * @returns {boolean} Result.
   */
  const isSeparated = (sibling, getChar) => {
    if (!sibling || isLineBreakNode(sibling)) {
      return true;
    }

    if (!isTextNode(sibling)) {
      return false;
    }

    const char = getChar(getExportedText(sibling)) ?? '';

    // Lexical puts the delimiters of the text inside its whitespace, which keeps them apart
    return formats.some((format) => sibling.hasFormat(format))
      ? /\s/.test(char)
      : /[\s\p{P}\p{S}]/u.test(char);
  };

  return formats.length &&
    isSeparated(node.getPreviousSibling(), (text) => text.at(-1)) &&
    isSeparated(node.getNextSibling(), (text) => text[0])
    ? formats
    : [];
};

/**
 * Remove the given formats’ delimiters from either end of the exported link text, where Lexical
 * puts them when every text node in the link has the formats.
 * @param {string} markdown Exported link text.
 * @param {TextFormatType[]} formats Formats.
 * @returns {{ text: string, delimiters: string } | undefined} The text without the delimiters, and
 * the opening delimiters, or `undefined` if the text doesn’t start and end with them.
 */
const stripDelimiters = (markdown, formats) => {
  const remaining = [...formats];
  let delimiters = '';

  while (remaining.length) {
    const [delimiter] = markdown.slice(delimiters.length).match(DELIMITER_REGEX) ?? [];

    const index = remaining.findIndex((format) =>
      FORMAT_DELIMITERS[format]?.includes(delimiter ?? ''),
    );

    if (!delimiter || index === -1) {
      return undefined;
    }

    remaining.splice(index, 1);
    delimiters += delimiter;
  }

  const closing = [...delimiters].reverse().join('');

  if (markdown.length < delimiters.length * 2 || !markdown.endsWith(closing)) {
    return undefined;
  }

  return { text: markdown.slice(delimiters.length, -closing.length), delimiters };
};

/**
 * Link transformer that exports the formats of the whole link text outside the link, where they’re
 * imported from; see `getOuterFormats()`. The rest is Lexical’s.
 * @type {TextMatchTransformer}
 */
export const LINK = {
  ...LEXICAL_LINK,
  /**
   * Export a link node.
   * @param {LexicalNode} node Node.
   * @param {(node: ElementNode) => string} exportChildren Function to export the children of an
   * element.
   * @param {(node: TextNode, textContent: string) => string} exportFormat Function to export a text
   * node with its format.
   * @returns {string | null} Markdown, or `null` to leave the node to the other transformers.
   */
  export: (node, exportChildren, exportFormat) => {
    const formats = isLinkNode(node) ? getOuterFormats(node) : [];
    /** @type {string | undefined} */
    let delimiters;

    const markdown = LEXICAL_LINK.export?.(
      node,
      (linkNode) => {
        const text = exportChildren(linkNode);
        const stripped = formats.length ? stripDelimiters(text, formats) : undefined;

        delimiters = stripped?.delimiters;

        return stripped?.text ?? text;
      },
      exportFormat,
    );

    return markdown && delimiters
      ? `${delimiters}${markdown}${[...delimiters].reverse().join('')}`
      : (markdown ?? null);
  },
};
