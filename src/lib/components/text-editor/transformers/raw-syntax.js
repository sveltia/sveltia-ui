import { $getState as getState, $setState as setState, createState } from 'lexical';

/**
 * @import { TextMatchTransformer } from '@lexical/markdown';
 * @import { TextNode } from 'lexical';
 */

/**
 * Block syntax at the start of a line, after up to 3 spaces.
 */
const BLOCK_SYNTAX = [
  // Thematic break, which comes first as it can start like a bullet list item
  /([-*_])(?:[ \t]*\1){2,}[ \t]*$/,
  // Setext heading underline
  /(?:=+|-{2,})[ \t]*$/,
  // ATX heading, bullet list item or ordered list item
  /(?:#{1,6}|[-+*]|\d{1,9}[.)])(?=[ \t]|$)/,
  // Blockquote or code fence
  />|`{3,}|~{3,}/,
]
  .map(({ source }) => source)
  .join('|');

/**
 * Regular expression to match the Markdown syntax that the editor imports as text, but that has to
 * be exported as is: the block syntax at the start of a line, which can’t be nested in a blockquote
 * or a list item, or isn’t supported, like the `)` ordered list delimiter.
 */
const RAW_SYNTAX_REGEX = new RegExp(`^ {0,3}(?:${BLOCK_SYNTAX})`);

/**
 * State of a text node imported from the {@link RAW_SYNTAX_REGEX raw syntax}, holding the Markdown
 * it was imported from.
 */
const rawSyntaxState = createState('suiRawSyntax', {
  /**
   * Parse the state value.
   * @param {unknown} value Value.
   * @returns {string} Markdown, or an empty string if the node is not raw syntax.
   */
  parse: (value) => (typeof value === 'string' ? value : ''),
});

/**
 * Get the Markdown of a text node imported from raw syntax.
 * @param {TextNode} node Text node.
 * @returns {string | undefined} The Markdown the node was imported from, or its current text if it
 * has been edited since. `undefined` if the node is not raw syntax.
 */
export const getRawSyntax = (node) => {
  const markdown = getState(node, rawSyntaxState);

  if (!markdown) {
    return undefined;
  }

  // The block syntax has no escapes, so the text is the Markdown, even if it has been edited since
  return node.getTextContent();
};

/**
 * Import-only transformer that marks the text imported from the Markdown syntax the editor doesn’t
 * support, like a list in a blockquote, so it’s exported as is, while the same text typed by the
 * user, pasted as text, or imported from escaped Markdown, like `\- a`, is escaped; see
 * `BLOCK_SYNTAX_ESCAPE`. Without it, the syntax from the Markdown would be escaped, changing the
 * meaning of the Markdown.
 * @type {TextMatchTransformer}
 */
export const RAW_SYNTAX = {
  dependencies: [],
  /**
   * Leave the export to `BLOCK_SYNTAX_ESCAPE`.
   * @returns {null} Nothing.
   */
  export: () => null,
  importRegExp: RAW_SYNTAX_REGEX,
  // Never used as a shortcut
  regExp: /(?!)/,
  /**
   * Mark the text node as raw syntax. The node is left out of the other transformers, as nothing
   * in the syntax is converted.
   * @param {TextNode} node Text node with the matched text.
   */
  replace: (node) => {
    setState(node, rawSyntaxState, node.getTextContent());
  },
  type: 'text-match',
};
