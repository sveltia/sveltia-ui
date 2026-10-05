import { $isLineBreakNode as isLineBreakNode, $isTextNode as isTextNode } from 'lexical';

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
 * Export-only transformer that escapes the Markdown block syntax at the start of a block or of a
 * line after a line break. Without it, a paragraph typed as `## Hours` with the Markdown shortcuts
 * turned off, pasted as text, or imported from the escaped `\## Hours` would be exported as is and
 * become a heading the next time the Markdown is read.
 * @type {TextMatchTransformer}
 */
export const BLOCK_SYNTAX_ESCAPE = {
  dependencies: [],
  /**
   * Export a text node at the start of a line, escaping the block syntax it starts with.
   * @param {LexicalNode} node Node.
   * @param {(node: ElementNode) => string} _exportChildren Function to export the children of an
   * element, unused.
   * @param {(node: TextNode, textContent: string) => string} exportFormat Function to export a text
   * node with its format.
   * @returns {string | null} Markdown, or `null` to leave the node to the other transformers.
   */
  export: (node, _exportChildren, exportFormat) => {
    if (!isTextNode(node)) {
      return null;
    }

    const parent = node.getParent();
    const previous = node.getPreviousSibling();

    // Text in a link or other inline element, in a code block, which is exported verbatim, or in a
    // heading, whose content is only parsed for inline syntax
    if (!parent || parent.isInline() || ['code', 'heading'].includes(parent.getType())) {
      return null;
    }

    if (previous && !isLineBreakNode(previous)) {
      return null;
    }

    // A formatted node starts with its own syntax, such as `**`, which is left as is
    return escapeBlockSyntax(exportFormat(node, node.getTextContent()));
  },
  // Never used to import Markdown or as a shortcut
  regExp: /(?!)/,
  type: 'text-match',
};
