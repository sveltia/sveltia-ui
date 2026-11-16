/**
 * Placeholder characters used while converting Markdown, from the Unicode Private Use Area, which
 * a document is unlikely to contain. Each one has its own code point, so a new placeholder takes
 * the next one that is free.
 */

/**
 * Placeholder for the text of a raw syntax node, which Lexical doesn’t escape.
 */
export const RAW_TEXT_PLACEHOLDER = '';

/**
 * Placeholder for a backtick in the info string of a code block fenced with tildes, which is
 * converted to one fenced with backticks before the Markdown is imported; see
 * `convertTildeFences()`. Unlike that of a tilde fence, the info string of a backtick fence can’t
 * contain a backtick.
 */
export const INFO_BACKTICK = '';

/**
 * Placeholder put after an escaped backslash at the end of a line; see `addImportPlaceholders()`.
 */
export const ESCAPED_BACKSLASH_PLACEHOLDER = '';

/**
 * Placeholder put with a period between a backslash and a formatting marker; see
 * `addImportPlaceholders()`.
 */
export const PUNCTUATION_PLACEHOLDER = '';

/**
 * Placeholder given as the text of inline code made only of whitespace when it’s exported, so
 * Lexical exports its formats; see `getFormatExportNode()`.
 */
export const WHITESPACE_CODE_PLACEHOLDER = '';

/**
 * Placeholder put in place of a tab in a code span; see `addImportPlaceholders()`.
 */
export const CODE_TAB_PLACEHOLDER = '';

/**
 * Placeholder put in place of a space in a code span made only of spaces; see
 * `addImportPlaceholders()`.
 */
export const CODE_SPACE_PLACEHOLDER = '';

/**
 * Placeholder put at the start of a line of an HTML block; see `addImportPlaceholders()`.
 */
export const HTML_BLOCK_PLACEHOLDER = '';
