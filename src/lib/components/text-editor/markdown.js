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
const findCodeBlocks = (lines) => {
  /** @type {CodeBlock[]} */
  const blocks = [];
  /** @type {Omit<CodeBlock, 'end' | 'closed'> | undefined} */
  let openBlock;

  lines.forEach((line, index) => {
    // Like Lexical’s `CODE_START_REGEX`, allow an indented fence
    const fence = line.match(/^[ \t]*(`{3,}|~{3,})/)?.[1];

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
const mapOutsideCodeBlocks = (value, callback) => {
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
const mapLinesOutsideCodeBlocks = (value, callback) => {
  const lines = value.split('\n');

  const codeLines = new Set(
    findCodeBlocks(lines).flatMap(({ start, end }) =>
      Array.from({ length: end - start + 1 }, (_, offset) => start + offset),
    ),
  );

  return lines.map((line, index) => (codeLines.has(index) ? line : callback(line))).join('\n');
};

/**
 * Split multiline formatting into separate lines to prevent Markdown parsing issues. Fenced code
 * blocks are left untouched, as the formatting syntax is not parsed there.
 * @param {string} value Markdown string to process.
 * @returns {string} Processed Markdown string.
 * @see https://github.com/sveltia/sveltia-cms/issues/548
 */
export const splitMultilineFormatting = (value) =>
  mapOutsideCodeBlocks(value, (part) =>
    part
      // The surrounding whitespace is checked with lookarounds rather than matched with `\s+`,
      // which would take quadratic time on a long run of whitespace not followed by a formatting
      // marker
      .replace(/(?<=\s)_([^_\n]+?)\n([^_\n]+?)_(?=\s)/g, '_$1_\n_$2_')
      .replace(/(?<=\s)\*\*([^*\n]+?)\n([^*\n]+?)\*\*(?=\s)/g, '**$1**\n**$2**')
      .replace(/(?<=\s)~~([^~\n]+?)\n([^~\n]+?)~~(?=\s)/g, '~~$1~~\n~~$2~~')
      .replace(/(?<=\s)`([^`\n]+?)\n([^`\n]+?)`(?=\s)/g, '`$1`\n`$2`'),
  );

/**
 * Convert the fenced code blocks using tildes, like `~~~`, to ones using backticks, because Lexical
 * only supports the latter. The new fence is made longer than any backtick fence in the code, so
 * the code block isn’t closed early.
 * @param {string} value Markdown string to process.
 * @returns {string} Processed Markdown string.
 */
export const convertTildeFences = (value) => {
  if (!/^[ \t]*~{3,}/m.test(value)) {
    return value;
  }

  const lines = value.split('\n');

  findCodeBlocks(lines)
    .filter(({ fence }) => fence.startsWith('~'))
    .forEach(({ start, end, closed }) => {
      const codeLines = lines.slice(start + 1, closed ? end : end + 1);

      const longestFence = Math.max(
        2,
        ...codeLines.map(
          (line) => /** @type {RegExpMatchArray} */ (line.match(/^[ \t]*(`*)/))[1].length,
        ),
      );

      const backticks = '`'.repeat(longestFence + 1);

      lines[start] = lines[start].replace(/^([ \t]*)~+/, `$1${backticks}`);

      if (closed) {
        lines[end] = lines[end].replace(/^([ \t]*)~+[ \t]*$/, `$1${backticks}`);
      }
    });

  return lines.join('\n');
};

/**
 * Regular expression to match a setext heading underline, like `===` or `---`.
 */
const SETEXT_UNDERLINE_REGEX = /^ {0,3}(=+|-+)[ \t]*$/;
/**
 * Regular expression to match an ATX heading, like `## Heading`.
 */
const ATX_HEADING_REGEX = /^ {0,3}#{1,6}(?:[ \t]|$)/;

/**
 * Names of the HTML elements that start an HTML block that can interrupt a paragraph, as opposed to
 * inline HTML, like `<span>`, which a paragraph can start with.
 * @see https://spec.commonmark.org/0.31.2/#html-blocks
 */
const HTML_BLOCK_TAG_NAMES = [
  'address',
  'article',
  'aside',
  'base',
  'basefont',
  'blockquote',
  'body',
  'caption',
  'center',
  'col',
  'colgroup',
  'dd',
  'details',
  'dialog',
  'dir',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'frame',
  'frameset',
  'h[1-6]',
  'head',
  'header',
  'hr',
  'html',
  'iframe',
  'legend',
  'li',
  'link',
  'main',
  'menu',
  'menuitem',
  'nav',
  'noframes',
  'ol',
  'optgroup',
  'option',
  'p',
  'param',
  'search',
  'section',
  'summary',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'title',
  'tr',
  'track',
  'ul',
];

/**
 * Regular expression to match the start of an HTML block that can interrupt a paragraph: a raw
 * text element, a comment, a processing instruction, a declaration, a CDATA section or a block
 * element.
 * @see https://spec.commonmark.org/0.31.2/#html-blocks
 */
const HTML_BLOCK_START_REGEX = new RegExp(
  `<(?:(?:script|pre|style|textarea)(?:[ \\t>]|$)|!--|\\?|![A-Za-z]|!\\[CDATA\\[|` +
    `/?(?:${HTML_BLOCK_TAG_NAMES.join('|')})(?:[ \\t>]|/>|$))`,
  'i',
);

/**
 * Regular expression to match a line that doesn’t continue a paragraph: an ATX heading, a
 * blockquote, a list item, a code fence, a table row, an HTML block, an indented code block, a
 * thematic break or a setext heading underline.
 */
const NON_PARAGRAPH_LINE_REGEX = new RegExp(
  [
    ATX_HEADING_REGEX.source,
    /^ {0,3}(?:>|[-+*](?:[ \t]|$)|\d{1,9}[.)](?:[ \t]|$)|`{3,}|~{3,}|\|)/.source,
    `^ {0,3}${HTML_BLOCK_START_REGEX.source}`,
    /^(?: {4}|\t)/.source,
    /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/.source,
    SETEXT_UNDERLINE_REGEX.source,
  ].join('|'),
  'i',
);

/**
 * Check if the given line is part of a paragraph.
 * @param {string} line Line.
 * @returns {boolean} Result.
 */
const isParagraphLine = (line) => !!line.trim() && !NON_PARAGRAPH_LINE_REGEX.test(line);

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
  if (!/^ {0,3}(?:=+|-+)[ \t]*$/m.test(value)) {
    return value;
  }

  return mapOutsideCodeBlocks(value, (part) => {
    /** @type {string[]} */
    const lines = [];

    part.split('\n').forEach((line) => {
      const [, underline] = line.match(SETEXT_UNDERLINE_REGEX) ?? [];
      let start = lines.length;

      while (start > 0 && isParagraphLine(lines[start - 1])) {
        start -= 1;
      }

      const previous = lines[start - 1];

      if (
        !underline ||
        start === lines.length ||
        (previous !== undefined && previous.trim() && !ATX_HEADING_REGEX.test(previous))
      ) {
        lines.push(line);

        return;
      }

      const text = lines
        .splice(start)
        .map((paragraphLine) => paragraphLine.trim())
        .join(' ');

      lines.push(`${underline.startsWith('=') ? '#' : '##'} ${text}`);
    });

    return lines.join('\n');
  });
};

/**
 * Increase list indentation levels to prevent Markdown parsing issues.
 * Slate uses 2 spaces per indentation level, whereas Lexical uses 4 spaces.
 * This function doubles the indentation to match Lexical's expectations.
 * @param {string} value Markdown string to process.
 * @returns {string} Processed Markdown string.
 * @see https://github.com/sveltia/sveltia-cms/issues/549
 */
export const increaseListIndentation = (value) => {
  if (!value.match(/^\s{2}(?:-|\+|\*|\d+\.)\s/m)) {
    return value;
  }

  return mapLinesOutsideCodeBlocks(value, (line) =>
    line.replace(/^(\s+)(-|\+|\*|\d+\.)/, (_match, p1, p2) => `${' '.repeat(p1.length * 2)}${p2}`),
  );
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
