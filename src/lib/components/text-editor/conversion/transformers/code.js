import { $isCodeNode as isCodeNode } from '@lexical/code-core';
import { CODE as LEXICAL_CODE } from '@lexical/markdown';
import { $isTextNode as isTextNode } from 'lexical';

import { findCodeBlocks } from '../markdown/code-blocks.js';
import { INFO_BACKTICK } from '../placeholder-chars.js';

/**
 * @import { MultilineElementTransformer } from '@lexical/markdown';
 * @import { ElementNode, LexicalNode } from 'lexical';
 */

/**
 * Regular expression to match the opening fence of a code block and its info string, if any. Like
 * Lexical, the language is the leading word of the info string, and the rest is metadata. Unlike
 * Lexical’s, the word runs to the next whitespace, so a language with symbols, like `c#` or `c++`,
 * isn’t cut off. Like Lexical’s, it must start with a word character; otherwise, like `{.js}`, the
 * text is part of the code.
 */
const OPENING_FENCE_REGEX = /^([ \t]*`{3,})[ \t]*([\w-][^\s`]*)?[ \t]*/;
/**
 * Code blocks starting in a list item, found in the lines of the Markdown being imported. Lexical
 * passes the same array of lines for every fence line of an import, so the lines are only scanned
 * once per import rather than once per fence line.
 * @type {WeakMap<string[], { start: number, end: number }[]>}
 */
const listItemCodeBlockCache = new WeakMap();

/**
 * Check if the given line is within a code block starting in a list item, after its opening fence,
 * like `- ~~~`.
 * @param {string[]} lines Lines of the Markdown.
 * @param {number} index Index of the line.
 * @returns {boolean} Result.
 */
const isInListItemCodeBlock = (lines, index) => {
  let blocks = listItemCodeBlockCache.get(lines);

  if (!blocks) {
    blocks = findCodeBlocks(lines).filter(({ start }) => !/^[ \t]*[`~]/.test(lines[start]));
    listItemCodeBlockCache.set(lines, blocks);
  }

  return blocks.some(({ start, end }) => start < index && index <= end);
};

/**
 * For each line of the Markdown being imported, the length of the longest line made only of
 * backticks, which can close a code block, from that line to the end; see
 * {@link listItemCodeBlockCache} for why it’s cached.
 * @type {WeakMap<string[], number[]>}
 */
const closingFenceLengthCache = new WeakMap();

/**
 * Check if a code block opened with the given fence has a closing fence after the given line.
 * @param {string[]} lines Lines of the Markdown.
 * @param {number} index Index of the line with the opening fence.
 * @param {string} fence Opening fence.
 * @returns {boolean} Result.
 */
const hasClosingFence = (lines, index, fence) => {
  let lengths = closingFenceLengthCache.get(lines);

  if (!lengths) {
    lengths = Array.from({ length: lines.length + 1 }, () => 0);

    for (let i = lines.length - 1; i >= 0; i -= 1) {
      const length = lines[i].match(/^[ \t]*(`{3,})$/)?.[1].length ?? 0;

      lengths[i] = Math.max(length, lengths[i + 1]);
    }

    closingFenceLengthCache.set(lines, lengths);
  }

  return lengths[index + 1] >= fence.length;
};

/**
 * Code block transformer that, unlike Lexical’s, doesn’t take a line with a backtick after the
 * opening backtick fence for a code block. In CommonMark, the info string of a backtick fence
 * can’t contain a backtick, so such a line is a paragraph starting with inline code, like a code
 * span of three backticks, which the editor exports with a fence of four backticks. Lexical would
 * turn it into a code block the next time the Markdown is read. It also reads the info string as
 * CommonMark does when Lexical doesn’t: the language after spaces, like ```` ``` js ````, and the
 * metadata after the language of a code block without a closing fence, like
 * ```` ```js title=x ````, which Lexical would add to the code. It keeps the blank lines at the end
 * of the code as well, which Lexical removes. Last, it exports a code block with a backtick in its
 * info string, imported from a tilde fence, with a tilde fence again. The rest is Lexical’s.
 * @type {MultilineElementTransformer}
 * @see https://spec.commonmark.org/0.31.2/#fenced-code-blocks
 */
export const CODE = {
  ...LEXICAL_CODE,
  /**
   * Export a code block.
   * @param {LexicalNode} node Node.
   * @param {(node: ElementNode) => string} exportChildren Function to export the children of an
   * element.
   * @returns {string | null} Markdown, or `null` if the node isn’t a code block.
   */
  export: (node, exportChildren) => {
    const markdown = LEXICAL_CODE.export?.(node, exportChildren) ?? null;
    const [openingLine] = markdown?.split('\n', 1) ?? [];

    if (!markdown || !openingLine.includes(INFO_BACKTICK)) {
      return markdown;
    }

    // Lexical makes the fence longer than any backtick run in the code; do the same with tildes
    const code = markdown.slice(openingLine.length, markdown.lastIndexOf('\n'));

    const longestRun = Math.max(
      2,
      ...(code.match(/^[ \t]*~+/gm) ?? []).map((run) => run.trim().length),
    );

    const fence = '~'.repeat(longestRun + 1);

    return `${openingLine.replace(/^`+/, fence).replaceAll(INFO_BACKTICK, '`')}${code}\n${fence}`;
  },
  /**
   * Import a code block, starting with the given opening fence.
   * @param {object} args Arguments.
   * @param {string[]} args.lines Lines of the Markdown.
   * @param {ElementNode} args.rootNode Node to append the code block to.
   * @param {number} args.startLineIndex Index of the line with the opening fence.
   * @param {RegExpMatchArray} args.startMatch Match of the opening fence.
   * @param {MultilineElementTransformer} args.transformer This transformer.
   * @returns {[boolean, number] | null | undefined} Whether the code block has been imported, and
   * the index of its last line.
   */
  handleImportAfterStartMatch: ({ lines, startLineIndex, ...args }) => {
    // The editor doesn’t support a code block in a list item, like `- ~~~`, whose lines are
    // imported as the text of the item. Its closing fence, indented to the content of the item,
    // or a fence within it is part of that text, not the opening fence of another code block
    if (isInListItemCodeBlock(lines, startLineIndex)) {
      return null;
    }

    const openingLine = lines[startLineIndex];
    const startMatch = /** @type {RegExpMatchArray} */ (openingLine.match(OPENING_FENCE_REGEX));
    const fence = startMatch[1].trim();
    // Lexical only reads the metadata of a code block with a closing fence, so close it at the end
    // of the Markdown if it isn’t closed
    const isClosed = hasClosingFence(lines, startLineIndex, fence);

    const result = LEXICAL_CODE.handleImportAfterStartMatch?.({
      ...args,
      lines: isClosed ? lines : [...lines, fence],
      startLineIndex,
      startMatch,
    });

    // Lexical removes the blank lines at the end of the code, which are part of it in CommonMark,
    // so add them back, unless the code is blank. Those of a code block without a closing fence
    // are left out, as they’re rather the end of the document
    if (isClosed && result?.[0] && result[1] > startLineIndex) {
      const codeLines = lines.slice(startLineIndex + 1, result[1]);
      const blankLineCount = codeLines.length - codeLines.findLastIndex((line) => !!line) - 1;
      const codeNode = args.rootNode.getLastChild();
      const textNode = isCodeNode(codeNode) ? codeNode.getLastChild() : null;

      if (blankLineCount && isTextNode(textNode) && textNode.getTextContent()) {
        textNode.setTextContent(`${textNode.getTextContent()}${'\n'.repeat(blankLineCount)}`);
      }
    }

    return result && [result[0], Math.min(result[1], lines.length - 1)];
  },
  regExpStart: new RegExp(`${LEXICAL_CODE.regExpStart.source}(?=[^\`]*$)`),
};
