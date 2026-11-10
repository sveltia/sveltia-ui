import {
  $createTextNode as createTextNode,
  $isParagraphNode as isParagraphNode,
  $isRootNode as isRootNode,
  $isTextNode as isTextNode,
} from 'lexical';

/**
 * @import { TextMatchTransformer } from '@lexical/markdown';
 * @import { ElementNode, LexicalNode, TextNode } from 'lexical';
 */

/**
 * Check if the given node is inline code made only of whitespace.
 * @param {LexicalNode | null} node Node.
 * @returns {boolean} Result.
 */
const isWhitespaceCode = (node) =>
  isTextNode(node) && node.hasFormat('code') && /^\s+$/.test(node.getTextContent());

/**
 * Get a view of the given node that Lexical can export with the formats of inline code made only
 * of whitespace, like the bold in `` **` `** ``. Lexical takes a node with only whitespace as
 * having no format, as it can’t put the syntax of a format around whitespace, but code is exported
 * with its backticks, around which the syntax can go. So the view, and the views of its siblings,
 * give a placeholder as the text of such code. Lexical only reads the text to tell if it has any,
 * and exports the text it’s given. Other methods are those of the node.
 * @param {TextNode} node Text node.
 * @returns {TextNode} View of the node, or the node itself if neither it nor its siblings are such
 * code.
 */
export const getFormatExportNode = (node) => {
  const previous = node.getPreviousSibling();
  const next = node.getNextSibling();

  if (![node, previous, next].some(isWhitespaceCode)) {
    return node;
  }

  /**
   * Get a view of a node with a placeholder as its text, if it’s inline code made only of
   * whitespace.
   * @template {LexicalNode | null} T
   * @param {T} target Node.
   * @returns {T} View or the node itself.
   */
  const getView = (target) =>
    isWhitespaceCode(target)
      ? Object.create(target, {
          getTextContent: {
            /**
             * Get a placeholder instead of the whitespace.
             * @returns {string} Placeholder.
             */
            value: () => '\uE004',
          },
        })
      : target;

  return Object.create(getView(node), {
    getPreviousSibling: {
      /**
       * Get the view of the previous sibling.
       * @returns {LexicalNode | null} View or the sibling itself.
       */
      value: () => getView(previous),
    },
    getNextSibling: {
      /**
       * Get the view of the next sibling.
       * @returns {LexicalNode | null} View or the sibling itself.
       */
      value: () => getView(next),
    },
  });
};

/**
 * Check if the given node is a paragraph Lexical takes as empty when it exports the document: one
 * with nothing but a text node of up to 3 whitespace characters, even if the text is code.
 * @param {LexicalNode | null} node Node.
 * @returns {boolean} Result.
 */
const isLexicalEmptyParagraph = (node) => {
  if (!isParagraphNode(node)) {
    return false;
  }

  const child = node.getFirstChild();

  return (
    !child ||
    (node.getChildrenSize() === 1 && isTextNode(child) && /^\s{0,3}$/.test(child.getTextContent()))
  );
};

/**
 * Get the line breaks to add around a code node made only of whitespace that is the only content
 * of a paragraph in the document root. Lexical takes such a paragraph as empty, so it puts a single
 * line break, not a blank line, between it and the blocks next to it, which would make one
 * paragraph of them. The line break is added on the side of the code, unless the block next to it
 * is a paragraph Lexical takes as empty too: the line break is added by the one before, if it has
 * code, and isn’t needed otherwise, as an empty paragraph adds a line break of its own.
 * @param {TextNode} node Code node.
 * @returns {[string, string]} Line breaks to add before and after the code.
 */
const getParagraphLineBreaks = (node) => {
  const paragraph = node.getParent();

  if (!isLexicalEmptyParagraph(paragraph) || !isRootNode(paragraph?.getParent())) {
    return ['', ''];
  }

  const previous = paragraph?.getPreviousSibling() ?? null;
  const next = paragraph?.getNextSibling() ?? null;

  /**
   * Check if a paragraph is empty, with no code.
   * @param {LexicalNode | null} sibling Sibling.
   * @returns {boolean} Result.
   */
  const isEmpty = (sibling) => {
    const child = /** @type {ElementNode} */ (sibling)?.getFirstChild();

    return isLexicalEmptyParagraph(sibling) && !(isTextNode(child) && child.hasFormat('code'));
  };

  return [
    previous && !isLexicalEmptyParagraph(previous) ? '\n' : '',
    next && !isEmpty(next) ? '\n' : '',
  ];
};

/**
 * Import-only transformer for a code span at the start of a node, such as a table cell, a
 * paragraph or bold text starting with inline code. Lexical’s `INLINE_CODE` transformer then reuses
 * the node for the code, and removes the backslash escapes from the node once the inline syntax has
 * been imported, so `` `C:\$MFT` `` would become `C:$MFT`, though backslashes are literal in a code
 * span. Backslashes in a code span split from the text before it are kept. A text match wrapping a
 * code span takes priority over it, and this one replaces the node with a new one, leaving the old
 * node, which is no longer in the document, to be unescaped. It also exports a code span that
 * starts and ends with whitespace, which Lexical pads with a space on both sides, though CommonMark
 * only strips that padding if both ends are spaces and the content isn’t all spaces, so `` ` ` ``
 * would get two spaces longer on every save, and `` `\t` `` would become `` ` \t ` ``.
 * It exports code next to inline code made only of whitespace too; see `getFormatExportNode()`.
 * @type {TextMatchTransformer}
 * @see https://github.com/sveltia/sveltia-cms/issues/1100
 * @see https://spec.commonmark.org/0.31.2/#code-spans
 */
export const LEADING_INLINE_CODE = {
  dependencies: [],
  /**
   * Export a code span that starts and ends with whitespace without the padding Lexical adds, if
   * CommonMark wouldn’t strip it, and with the line breaks around it if it’s the only content of a
   * paragraph; see `getParagraphLineBreaks()`. Lexical exports the other code spans.
   * @param {LexicalNode} node Node.
   * @param {(node: ElementNode) => string} _exportChildren Function to export the children of an
   * element, unused.
   * @param {(node: TextNode, textContent: string) => string} exportFormat Function to export a text
   * node with its format.
   * @returns {string | null} Markdown, or `null` to leave the node to the other transformers.
   */
  export: (node, _exportChildren, exportFormat) => {
    if (!isTextNode(node) || !node.hasFormat('code')) {
      return null;
    }

    const content = node.getTextContent();
    const exportNode = getFormatExportNode(node);
    const [before, after] = isWhitespaceCode(node) ? getParagraphLineBreaks(node) : ['', ''];

    // Lexical pads code that starts and ends with whitespace, though CommonMark only strips one
    // space from both ends, if the code isn’t all spaces
    const hasExtraPadding =
      !content.includes('`') &&
      /^\s/.test(content) &&
      /\s$/.test(content) &&
      !(content.startsWith(' ') && content.endsWith(' ') && /[^ ]/.test(content));

    if (!hasExtraPadding && exportNode === node && !before && !after) {
      return null;
    }

    const markdown = exportFormat(exportNode, content);

    // The code is wrapped with the syntax of its other formats, if any, which has no whitespace
    return `${before}${
      hasExtraPadding ? markdown.replace(`\` ${content} \``, () => `\`${content}\``) : markdown
    }${after}`;
  },
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
