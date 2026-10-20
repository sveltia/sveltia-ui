import { CODE as LEXICAL_CODE } from '@lexical/markdown';

/**
 * @import { MultilineElementTransformer } from '@lexical/markdown';
 * @import { ElementNode, LexicalNode } from 'lexical';
 */

/**
 * Placeholder for a backtick in the info string of a code block fenced with tildes, which is
 * converted to one fenced with backticks before the Markdown is imported; see
 * `convertTildeFences()`. Unlike that of a tilde fence, the info string of a backtick fence can’t
 * contain a backtick.
 */
export const INFO_BACKTICK = '\uE001';

/**
 * Regular expression to match the opening fence of a code block and its info string, if any. Like
 * Lexical, the language is the leading word of the info string, and the rest is metadata.
 */
const OPENING_FENCE_REGEX = /^([ \t]*`{3,})[ \t]*([\w-]+)?[ \t]*/;

/**
 * Code block transformer that, unlike Lexical’s, doesn’t take a line with a backtick after the
 * opening backtick fence for a code block. In CommonMark, the info string of a backtick fence
 * can’t contain a backtick, so such a line is a paragraph starting with inline code, like a code
 * span of three backticks, which the editor exports with a fence of four backticks. Lexical would
 * turn it into a code block the next time the Markdown is read. It also reads the info string as
 * CommonMark does when Lexical doesn’t: the language after spaces, like ```` ``` js ````, and the
 * metadata after the language of a code block without a closing fence, like
 * ```` ```js title=x ````, which Lexical would add to the code. Last, it exports a code block with
 * a backtick in its info string, imported from a tilde fence, with a tilde fence again. The rest is
 * Lexical’s.
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
    const openingLine = lines[startLineIndex];
    const startMatch = /** @type {RegExpMatchArray} */ (openingLine.match(OPENING_FENCE_REGEX));
    const fence = startMatch[1].trim();
    const closingFenceRegex = new RegExp(`^[ \\t]*\`{${fence.length},}$`);
    // Lexical only reads the metadata of a code block with a closing fence, so close it at the end
    // of the Markdown if it isn’t closed
    const isClosed = lines.slice(startLineIndex + 1).some((line) => closingFenceRegex.test(line));

    const result = LEXICAL_CODE.handleImportAfterStartMatch?.({
      ...args,
      lines: isClosed ? lines : [...lines, fence],
      startLineIndex,
      startMatch,
    });

    return result && [result[0], Math.min(result[1], lines.length - 1)];
  },
  regExpStart: new RegExp(`${LEXICAL_CODE.regExpStart.source}(?=[^\`]*$)`),
};
