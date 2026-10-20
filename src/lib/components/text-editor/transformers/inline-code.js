import { $createTextNode as createTextNode } from 'lexical';

/**
 * @import { TextMatchTransformer } from '@lexical/markdown';
 * @import { TextNode } from 'lexical';
 */

/**
 * Import-only transformer for a code span at the start of a node, such as a table cell, a
 * paragraph or bold text starting with inline code. Lexical’s `INLINE_CODE` transformer then reuses
 * the node for the code, and removes the backslash escapes from the node once the inline syntax has
 * been imported, so `` `C:\$MFT` `` would become `C:$MFT`, though backslashes are literal in a code
 * span. Backslashes in a code span split from the text before it are kept. A text match wrapping a
 * code span takes priority over it, and this one replaces the node with a new one, leaving the old
 * node, which is no longer in the document, to be unescaped.
 * @type {TextMatchTransformer}
 * @see https://github.com/sveltia/sveltia-cms/issues/1100
 */
export const LEADING_INLINE_CODE = {
  dependencies: [],
  /**
   * Never export Markdown; Lexical’s `INLINE_CODE` transformer exports the code.
   * @returns {null} Nothing.
   */
  export: () => null,
  // A code span as Lexical’s `INLINE_CODE` transformer reads it: from a backtick run to the next
  // run of the same length
  // @see https://spec.commonmark.org/0.31.2/#code-spans
  importRegExp: /^(`+)(?!`)([^]*?[^`])\1(?!`)/,
  regExp: /(?!)/,
  /**
   * Replace the given text node, which has been split at the end of the code span, with a new code
   * node, keeping its formats and style.
   * @param {TextNode} node Text node.
   * @param {RegExpMatchArray} match Match of the code span.
   * @returns {TextNode} New node.
   */
  replace: (node, [, , content]) => {
    // One space is stripped from both ends of the content if it’s padded on both sides and has a
    // non-space character
    const codeNode = createTextNode(/^ .*[^ ].* $/s.test(content) ? content.slice(1, -1) : content)
      .setFormat(node.getFormat())
      .setStyle(node.getStyle())
      // Lexical doesn’t import the inline syntax in a node that is already code
      .toggleFormat('code');

    node.replace(codeNode);

    return codeNode;
  },
  type: 'text-match',
};
