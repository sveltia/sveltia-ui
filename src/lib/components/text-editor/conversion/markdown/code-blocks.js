/**
 * Helpers to process a Markdown string outside its fenced code blocks, which are left untouched.
 */

/**
 * @typedef {object} CodeBlock
 * @property {number} start Index of the line with the opening fence.
 * @property {number} end Index of the line with the closing fence, or of the last line if the code
 * block is not closed, in which case it runs to the end of the document.
 * @property {string} fence Opening fence, made of three or more backticks or tildes.
 * @property {boolean} closed Whether the code block has a closing fence.
 */

/**
 * Find the fenced code blocks in the lines of a Markdown string.
 * @param {string[]} lines Lines of a Markdown string.
 * @returns {CodeBlock[]} Code blocks.
 */
export const findCodeBlocks = (lines) => {
  /** @type {CodeBlock[]} */
  const blocks = [];
  /** @type {Omit<CodeBlock, 'end' | 'closed'> | undefined} */
  let openBlock;

  lines.forEach((line, index) => {
    // Like Lexical’s `CODE_START_REGEX`, allow an indented fence. A backtick fence can’t be
    // followed by a backtick on the same line; see `CODE`
    const fence = line.match(/^[ \t]*(`{3,}(?=[^`]*$)|~{3,})/)?.[1];

    if (!openBlock) {
      if (fence) {
        openBlock = { start: index, fence };
      }

      return;
    }

    // Like Lexical’s `CODE_END_REGEX`, a code block is only closed by a bare fence of the same
    // character that is at least as long as the opening one, so a shorter fence within the block,
    // like ```` ``` ```` within ```` ```` ````, is part of the code
    if (
      fence?.[0] === openBlock.fence[0] &&
      fence.length >= openBlock.fence.length &&
      !line.trim().slice(fence.length)
    ) {
      blocks.push({ ...openBlock, end: index, closed: true });
      openBlock = undefined;
    }
  });

  if (openBlock) {
    blocks.push({ ...openBlock, end: lines.length - 1, closed: false });
  }

  return blocks;
};

/**
 * Apply a function to the parts of a Markdown string outside fenced code blocks, leaving the code
 * blocks, fences included, untouched. Each part is given with the line breaks around it, if any, so
 * a regular expression can tell the start and the end of a line from those of the part.
 * @param {string} value Markdown string to process.
 * @param {(part: string) => string} callback Function that returns a processed part. It must keep
 * the line breaks at the start and the end of the part.
 * @returns {string} Processed Markdown string.
 */
export const mapOutsideCodeBlocks = (value, callback) => {
  const lines = value.split('\n');
  /** @type {string[]} */
  const output = [];
  let index = 0;

  /**
   * Process the lines from the current index to the given one, exclusive.
   * @param {number} end Index of the line to stop at.
   */
  const flush = (end) => {
    if (end > index) {
      const before = index > 0 ? '\n' : '';
      const after = end < lines.length ? '\n' : '';
      const part = callback(`${before}${lines.slice(index, end).join('\n')}${after}`);

      output.push(part.slice(before.length, part.length - after.length));
    }
  };

  findCodeBlocks(lines).forEach(({ start, end }) => {
    flush(start);
    output.push(lines.slice(start, end + 1).join('\n'));
    index = end + 1;
  });

  flush(lines.length);

  return output.join('\n');
};

/**
 * Apply a function to each line of a Markdown string, leaving the lines inside fenced code blocks
 * untouched.
 * @param {string} value Markdown string to process.
 * @param {(line: string) => string} callback Function that returns a processed line.
 * @returns {string} Processed Markdown string.
 */
export const mapLinesOutsideCodeBlocks = (value, callback) => {
  const lines = value.split('\n');

  const codeLines = new Set(
    findCodeBlocks(lines).flatMap(({ start, end }) =>
      Array.from({ length: end - start + 1 }, (_, offset) => start + offset),
    ),
  );

  return lines.map((line, index) => (codeLines.has(index) ? line : callback(line))).join('\n');
};
