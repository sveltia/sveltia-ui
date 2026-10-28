import { $getState as getState, $setState as setState, createState } from 'lexical';

/**
 * @import { TextMatchTransformer } from '@lexical/markdown';
 * @import { TextNode } from 'lexical';
 */

/**
 * Placeholder put at the start of a line of an HTML block; see `addImportPlaceholders()`.
 */
export const HTML_BLOCK_PLACEHOLDER = '\uE007';

/**
 * Whitespace within an HTML tag, including the placeholder of a tab; see `addImportPlaceholders()`.
 */
const TAG_SPACE = '[ \\t\\uE005]';

/**
 * Regular expression source to match an HTML open tag or closing tag.
 * @see https://spec.commonmark.org/0.31.2/#raw-html
 */
export const HTML_TAG_SOURCE =
  `<[A-Za-z][A-Za-z0-9-]*(?:${TAG_SPACE}+[A-Za-z_:][\\w.:-]*` +
  `(?:${TAG_SPACE}*=${TAG_SPACE}*(?:[^\\s"'=<>\`\\uE005]+|'[^'\\n]*'|"[^"\\n]*"))?)*` +
  `${TAG_SPACE}*/?>|</[A-Za-z][A-Za-z0-9-]*${TAG_SPACE}*>`;

/**
 * Regular expression source to match the place before a `<` that isn’t escaped. The lookahead comes
 * first, so the lookbehind is only tried before a `<`.
 */
const UNESCAPED_LT_SOURCE = String.raw`(?=<)(?<!(?:^|[^\\])(?:\\\\)*\\)`;

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
const AUTOLINK_REGEX = new RegExp(
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
const FOOTNOTE_REFERENCE_REGEX = /(?<!(?:^|[^\\])(?:\\\\)*\\)\[\^[^\s[\]]+\]/;

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
 * Label of a link reference definition or a footnote definition, like `[foo]:` in
 * `[foo]: https://example.com` or `[^1]:` in `[^1]: Note`, which isn’t supported. The rest of the
 * line is left to the other transformers, so a paragraph that only starts like one keeps its
 * formatting.
 * @see https://spec.commonmark.org/0.31.2/#link-reference-definitions
 */
const DEFINITION_SYNTAX = String.raw`\[(?:[^\\[\]]|\\.)+\]:`;
/**
 * Regular expression to match the Markdown syntax that the editor imports as text, but that has to
 * be exported as is: the block syntax at the start of a line, which can’t be nested in a blockquote
 * or a list item, or isn’t supported, like the `)` ordered list delimiter or a definition.
 */
const RAW_SYNTAX_REGEX = new RegExp(`^ {0,3}(?:${BLOCK_SYNTAX}|${DEFINITION_SYNTAX})`);

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
 * Get the Markdown a text node was imported from, if it’s raw syntax.
 * @param {TextNode} node Text node.
 * @returns {string | undefined} Markdown, or `undefined` if the node is not raw syntax.
 */
export const getImportedRawSyntax = (node) => getState(node, rawSyntaxState) || undefined;

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

  // Raw syntax has no escapes, so the text is the Markdown, even if it has been edited since
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

/**
 * Regular expression to match raw HTML: a line of an HTML block after the placeholder that marks
 * it, inline HTML, like a tag, an autolink or a footnote reference, which would otherwise be
 * escaped on export as text that only looks like one. The placeholder is left out of the match, so
 * an editor component that matches the line after it, which comes first, still takes precedence;
 * see `removePlaceholdersFromMatch()` in `core.js`. It’s included if the line starts with a
 * formatting marker, though: Lexical prefers formatting to a text match that covers the same text,
 * so a line like `*foo*` would otherwise be imported as italic. A component pattern doesn’t start
 * with one.
 */
const RAW_HTML_REGEX = new RegExp(
  [
    `^${HTML_BLOCK_PLACEHOLDER}(?=[*_~=]).+`,
    `(?<=^${HTML_BLOCK_PLACEHOLDER}).+`,
    INLINE_HTML_REGEX.source,
    AUTOLINK_REGEX.source,
    FOOTNOTE_REFERENCE_REGEX.source,
  ].join('|'),
);

/**
 * Import-only transformer that marks raw HTML, so it’s exported as is. Neither the Markdown syntax
 * nor the escapes are read in raw HTML, so an escape added to it on export, like `\_` in an
 * attribute value or `\*` in the text of an HTML block, would show up as a backslash. Lexical
 * removes the escapes from the text it has imported, so the text is restored with
 * `getImportedRawSyntax()` once the import is done.
 * @type {TextMatchTransformer}
 * @see https://spec.commonmark.org/0.31.2/#raw-html
 * @see https://spec.commonmark.org/0.31.2/#html-blocks
 * @see https://github.com/sveltia/sveltia-cms/issues/1105
 * @see https://github.com/sveltia/sveltia-cms/issues/1106
 */
export const RAW_HTML = {
  dependencies: [],
  /**
   * Leave the export to `BLOCK_SYNTAX_ESCAPE`.
   * @returns {null} Nothing.
   */
  export: () => null,
  importRegExp: RAW_HTML_REGEX,
  // Never used as a shortcut
  regExp: /(?!)/,
  replace: RAW_SYNTAX.replace,
  type: 'text-match',
};
