/**
 * Convert the block syntax Lexical doesn’t support, like tilde fences and setext headings, to the
 * one it does, and keep blank blockquote lines.
 */

import { INFO_BACKTICK } from '../placeholder-chars.js';
import { ATX_HEADING_REGEX, isParagraphLine, SETEXT_UNDERLINE_REGEX } from './block-structure.js';
import {
  findCodeBlocks,
  mapLinesOutsideCodeBlocks,
  mapOutsideCodeBlocks,
  parseOpeningFence,
} from './code-blocks.js';

/**
 * @import { OpeningFence } from './code-blocks.js';
 */

/**
 * Convert the fenced code blocks using tildes, like `~~~`, to ones using backticks, because Lexical
 * only supports the latter. The new fence is made longer than any backtick fence in the code, so
 * the code block isn’t closed early. Backticks can’t be used in the info string of a backtick
 * fence, so those after the language are replaced with a placeholder, which the code block
 * transformer turns back into backticks, exporting a tilde fence again; see `CODE`. Other backticks
 * are removed.
 * @param {string} value Markdown string to process.
 * @returns {string} Processed Markdown string.
 */
export const convertTildeFences = (value) => {
  if (!/^[ \t]*~{3,}/m.test(value)) {
    return value;
  }

  const lines = value.split('\n');

  findCodeBlocks(lines)
    // A code block in a list item, like `- ~~~`, is left as is, as it’s imported as the text of
    // the item; see `CODE`
    .filter(({ start, fence }) => fence.startsWith('~') && /^[ \t]*~/.test(lines[start]))
    .forEach(({ start, end, closed }) => {
      const codeLines = lines.slice(start + 1, closed ? end : end + 1);

      const longestFence = Math.max(
        2,
        ...codeLines.map(
          (line) => /** @type {RegExpMatchArray} */ (line.match(/^[ \t]*(`*)/))[1].length,
        ),
      );

      const backticks = '`'.repeat(longestFence + 1);

      const { indent, info, language } = /** @type {OpeningFence} */ (
        parseOpeningFence(lines[start])
      );

      // Unlike that of a tilde fence, the info string of a backtick fence can’t contain a backtick.
      // The language can’t contain one either, so only the metadata after it is replaced
      lines[start] = `${indent}${backticks}${info.replaceAll('`', language ? INFO_BACKTICK : '')}`;

      if (closed) {
        lines[end] = lines[end].replace(/^([ \t]*)~+[ \t]*$/, `$1${backticks}`);
      }
    });

  return lines.join('\n');
};

/**
 * Multiline version of `SETEXT_UNDERLINE_REGEX`, which matches at the start of any line.
 */
const SETEXT_UNDERLINE_MULTILINE_REGEX = new RegExp(SETEXT_UNDERLINE_REGEX.source, 'm');

/**
 * Convert setext headings, underlined with `===` or `---`, to ATX headings, like `# Heading`,
 * because Lexical only supports the latter. Without it, the underline is imported as text or a
 * horizontal rule. Fenced code blocks are left untouched. To avoid misreading a horizontal rule,
 * only a paragraph that follows a blank line, an ATX heading or the start of the document is
 * converted; for example, the second `---` of a block like front matter, which starts with a
 * horizontal rule, is left as is.
 * @param {string} value Markdown string to process.
 * @returns {string} Processed Markdown string.
 */
export const convertSetextHeadings = (value) => {
  if (!SETEXT_UNDERLINE_MULTILINE_REGEX.test(value)) {
    return value;
  }

  return mapOutsideCodeBlocks(value, (part) => {
    /** @type {string[]} */
    const lines = [];
    // Index of the first of the paragraph lines at the end of `lines`, tracked as the lines are
    // added rather than found by walking back, which would take quadratic time on a long paragraph
    let start = 0;

    part.split('\n').forEach((line) => {
      const previous = lines[start - 1];

      if (
        !SETEXT_UNDERLINE_REGEX.test(line) ||
        start === lines.length ||
        (previous !== undefined && previous.trim() && !ATX_HEADING_REGEX.test(previous))
      ) {
        lines.push(line);

        if (!isParagraphLine(line)) {
          start = lines.length;
        }

        return;
      }

      const text = lines
        .splice(start)
        .map((paragraphLine) => paragraphLine.trim())
        .join(' ');

      lines.push(`${line.trimStart().startsWith('=') ? '#' : '##'} ${text}`);
      start = lines.length;
    });

    return lines.join('\n');
  });
};

/**
 * Add a trailing space to a blank blockquote line (`>`) so Lexical treats it as a blank line within
 * the blockquote. Without the space, the line does not match Lexical's `/^>\s/` quote pattern and
 * is imported as literal `>` text, which is then exported as `> >`, an empty nested blockquote.
 * @param {string} value Markdown string to process.
 * @returns {string} Processed Markdown string.
 * @see https://github.com/sveltia/sveltia-cms/issues/995
 */
export const padBlankBlockquoteLines = (value) => {
  if (!/^>$/m.test(value)) {
    return value;
  }

  return mapLinesOutsideCodeBlocks(value, (line) => (line === '>' ? '> ' : line));
};

/**
 * Remove the trailing space Lexical outputs for a blank blockquote line (`> `) so the line
 * round-trips as `>`, the canonical form.
 * @param {string} value Markdown string to process.
 * @returns {string} Processed Markdown string.
 * @see https://github.com/sveltia/sveltia-cms/issues/995
 */
export const trimBlankBlockquoteLines = (value) => {
  if (!/^> $/m.test(value)) {
    return value;
  }

  return mapLinesOutsideCodeBlocks(value, (line) => (line === '> ' ? '>' : line));
};
