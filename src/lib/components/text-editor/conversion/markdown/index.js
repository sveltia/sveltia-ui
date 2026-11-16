/**
 * Markdown processing of the rich text editor: the Markdown is prepared before it’s imported, so
 * Lexical reads it as CommonMark does, and the placeholders added for that are removed afterwards.
 */

import {
  convertSetextHeadings,
  convertTildeFences,
  padBlankBlockquoteLines,
} from './block-conversion.js';
import { withLineCache } from './code-blocks.js';
import { splitMultilineFormatting } from './formatting.js';
import { addImportPlaceholders } from './placeholders.js';

export { trimBlankBlockquoteLines } from './block-conversion.js';
export { removeImportPlaceholders } from './placeholders.js';

/**
 * Convert the block syntax Lexical doesn’t support to the one it does, if the element is enabled:
 * tilde code fences to backtick ones, and setext headings to ATX ones. Otherwise the syntax is kept
 * as text, as written.
 * @param {string} value Markdown.
 * @param {object} features Enabled features.
 * @param {boolean} features.hasCodeBlocks Whether code blocks are supported.
 * @param {boolean} features.hasHeadings Whether headings are supported.
 * @returns {string} Converted Markdown.
 */
export const convertBlockSyntax = (value, { hasCodeBlocks, hasHeadings }) =>
  withLineCache(() => {
    const fencedValue = hasCodeBlocks ? convertTildeFences(value) : value;

    return hasHeadings ? convertSetextHeadings(fencedValue) : fencedValue;
  });

/**
 * Get the Markdown Lexical reads as CommonMark does, from Markdown converted with
 * {@link convertBlockSyntax}. Formatting that spans line breaks is split into one per line first,
 * as Lexical reads Markdown line by line, so the placeholders that follow are added to the final
 * lines: they mark the backslashes, the tabs in code spans and raw HTML. Blank blockquote lines
 * are then padded, so they are not imported as literal `>` text. The placeholders are removed from
 * the imported text with `removeImportPlaceholders()`.
 * @param {string} value Markdown.
 * @returns {{ markdown: string, hasPlaceholders: boolean }} Markdown to import, and whether any
 * placeholder has been added.
 */
export const toLexicalMarkdown = (value) =>
  withLineCache(() => {
    const splitValue = splitMultilineFormatting(value);
    const markedValue = addImportPlaceholders(splitValue);

    return {
      markdown: padBlankBlockquoteLines(markedValue),
      hasPlaceholders: markedValue !== splitValue,
    };
  });
