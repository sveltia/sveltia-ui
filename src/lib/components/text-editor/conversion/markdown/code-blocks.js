/**
 * Helpers to process a Markdown string outside its fenced code blocks, which are left untouched.
 */

import { LIST_MARKER } from './syntax.js';

/**
 * @typedef {object} CodeBlock
 * @property {number} start Index of the line with the opening fence.
 * @property {number} end Index of the line with the closing fence, or of the last line of the code
 * block if it is not closed, in which case it runs to the end of the document, or to the end of the
 * list item it starts in.
 * @property {string} fence Opening fence, made of three or more backticks or tildes.
 * @property {boolean} closed Whether the code block has a closing fence.
 */

/**
 * Regular expression to match the fence at the start of a line, after the indentation and the
 * markers of list items, if any, which are captured with it. A backtick fence can’t be followed by
 * a backtick on the same line; see `CODE`.
 */
const LINE_FENCE_REGEX = new RegExp(
  `^([ \\t]*(?:${LIST_MARKER}[ \\t]+)*)(\`{3,}(?=[^\`]*$)|~{3,})`,
);

/**
 * Find the fenced code blocks in the lines of a Markdown string, including those starting right
 * after the marker of a list item, like `- ~~~`, whose closing fence is indented to the content
 * of the item.
 * @param {string[]} lines Lines of a Markdown string.
 * @returns {CodeBlock[]} Code blocks.
 */
export const findCodeBlocks = (lines) => {
  /** @type {CodeBlock[]} */
  const blocks = [];
  /** @type {Omit<CodeBlock, 'end' | 'closed'> | undefined} */
  let openBlock;
  /**
   * Indentation of the content of the list item the open code block starts in, if any.
   * @type {number | undefined}
   */
  let contentIndent;

  lines.forEach((line, index) => {
    // Like Lexical’s `CODE_START_REGEX`, allow an indented fence, and also one after the marker of
    // a list item
    const [, prefix = '', fence] = line.match(LINE_FENCE_REGEX) ?? [];

    // A code block in a list item ends with the item, at a line indented less than its content
    if (
      openBlock &&
      contentIndent !== undefined &&
      line.trim() &&
      /** @type {RegExpMatchArray} */ (line.match(/^[ \t]*/))[0].length < contentIndent
    ) {
      blocks.push({ ...openBlock, end: index - 1, closed: false });
      openBlock = undefined;
    }

    if (!openBlock) {
      if (fence) {
        openBlock = { start: index, fence };
        contentIndent = prefix.trim() ? prefix.length : undefined;
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
 * Code blocks found in the lines of a Markdown string, keyed by the array of lines.
 * @type {WeakMap<string[], CodeBlock[]>}
 */
const codeBlockCache = new WeakMap();

/**
 * Get the fenced code blocks in the lines of a Markdown string, like {@link findCodeBlocks}, but
 * only scan the lines once for the same array, like the one Lexical passes to each transformer of
 * an import, or the one {@link splitLines} returns for the same string. The array must not be
 * changed afterwards.
 * @param {string[]} lines Lines of a Markdown string.
 * @returns {CodeBlock[]} Code blocks.
 */
export const getCodeBlocks = (lines) => {
  let blocks = codeBlockCache.get(lines);

  if (!blocks) {
    blocks = findCodeBlocks(lines);
    codeBlockCache.set(lines, blocks);
  }

  return blocks;
};

/**
 * Markdown string last split by {@link splitLines}, with its lines, kept only while
 * {@link withLineCache} runs, so the last document isn’t held in memory afterwards.
 * @type {{ value: string, lines: string[] } | undefined}
 */
let lastSplit;
/**
 * Number of {@link withLineCache} calls running, which may be nested.
 */
let lineCacheDepth = 0;

/**
 * Run the given steps of an import with the lines of the Markdown cached: {@link splitLines}
 * returns the same array for the same string as the last time, so {@link getCodeBlocks} doesn’t
 * scan it again when a step leaves the string as is. The cache is cleared once the steps are done.
 * @template T
 * @param {() => T} steps Function that runs the steps.
 * @returns {T} Result of the steps.
 */
export const withLineCache = (steps) => {
  lineCacheDepth += 1;

  try {
    return steps();
  } finally {
    lineCacheDepth -= 1;

    if (!lineCacheDepth) {
      lastSplit = undefined;
    }
  }
};

/**
 * Split a Markdown string into lines. Within {@link withLineCache}, the same array is returned for
 * the same string as the last time. The array must not be changed.
 * @internal
 * @param {string} value Markdown string.
 * @returns {string[]} Lines.
 */
export const splitLines = (value) => {
  if (!lineCacheDepth) {
    return value.split('\n');
  }

  if (lastSplit?.value !== value) {
    lastSplit = { value, lines: value.split('\n') };
  }

  return lastSplit.lines;
};

/**
 * @typedef {object} OpeningFence
 * @property {string} indent Whitespace before the fence.
 * @property {string} fence Fence, made of three or more backticks or tildes.
 * @property {string} info Rest of the line after the fence, the info string with the whitespace
 * around it.
 * @property {string | undefined} language Leading word of the info string, if any.
 * @property {string} meta Rest of the info string after the language, if any, trimmed. Empty
 * without a language, as the info string is then part of the code.
 * @property {RegExpMatchArray} match Match of the fence, the info string up to the end of the
 * language and the whitespace after it, which Lexical’s `CODE` transformer takes as `startMatch`:
 * the indented fence is the first group, and the language the second.
 */

/**
 * Regular expression to match the opening fence of a code block and the language of its info
 * string, if any; see {@link parseOpeningFence}.
 */
const OPENING_FENCE_REGEX = /^([ \t]*(?:`{3,}|~{3,}))[ \t]*([\w-][^\s`]*)?[ \t]*/;

/**
 * Parse the opening fence of a code block and its info string. Like Lexical, the language is the
 * leading word of the info string, and the rest is metadata. Unlike Lexical’s, the word runs to the
 * next whitespace or backtick, so a language with symbols, like `c#` or `c++`, isn’t cut off. Like
 * Lexical’s, it must start with a word character; otherwise, like `{.js}`, the text is part of the
 * code.
 * @param {string} line Line.
 * @returns {OpeningFence | undefined} Opening fence, or `undefined` if the line doesn’t start with
 * one, including a backtick fence followed by a backtick, which can’t be in its info string.
 * @see https://spec.commonmark.org/0.31.2/#fenced-code-blocks
 */
export const parseOpeningFence = (line) => {
  const match = line.match(OPENING_FENCE_REGEX);

  if (!match) {
    return undefined;
  }

  const [prefix, indentedFence, language] = match;
  const fence = indentedFence.trimStart();
  const info = line.slice(indentedFence.length);

  if (fence.startsWith('`') && info.includes('`')) {
    return undefined;
  }

  return {
    indent: indentedFence.slice(0, -fence.length),
    fence,
    info,
    language,
    meta: language ? line.slice(prefix.length).trim() : '',
    match,
  };
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
  const lines = splitLines(value);
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

  getCodeBlocks(lines).forEach(({ start, end }) => {
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
  const lines = splitLines(value);

  const codeLines = new Set(
    getCodeBlocks(lines).flatMap(({ start, end }) =>
      Array.from({ length: end - start + 1 }, (_, offset) => start + offset),
    ),
  );

  return lines.map((line, index) => (codeLines.has(index) ? line : callback(line))).join('\n');
};
