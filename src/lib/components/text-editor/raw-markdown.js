/**
 * Markdown editing helpers for the plain text mode of the text editor, where the toolbar buttons
 * edit the Markdown source in the `<textarea>` instead of Lexical nodes. Apart from
 * {@link getRawTextState}, {@link applyRawTextEdit} and {@link insertComponent}, everything here is
 * pure: a function takes the current value and selection, and returns the edit to apply.
 */

import { getComponentMarkdown } from './core.js';

/**
 * @import {
 * TextEditorBlockType,
 * TextEditorComponent,
 * TextEditorFormatType,
 * } from '$lib/typedefs';
 */

/**
 * Current value and selection of the `<textarea>`.
 * @typedef {object} RawTextState
 * @property {string} value Value.
 * @property {number} start Selection start.
 * @property {number} end Selection end.
 */

/**
 * Edit to apply to the `<textarea>`: replace the text between `start` and `end` with `text`, then
 * select the text between `selectionStart` and `selectionEnd`, which are offsets in the new value.
 * @typedef {object} RawTextEdit
 * @property {number} start Start of the range to replace.
 * @property {number} end End of the range to replace.
 * @property {string} text Replacement text.
 * @property {number} selectionStart New selection start.
 * @property {number} selectionEnd New selection end.
 */

/**
 * Markdown markers for the inline formats.
 * @type {Record<TextEditorFormatType, string>}
 */
const INLINE_MARKERS = {
  bold: '**',
  italic: '_',
  strikethrough: '~~',
  code: '`',
};

/**
 * Prefix of a heading, list item or blockquote line.
 */
const BLOCK_PREFIX_REGEX = /^(?:#{1,6}[ \t]+|>[ \t]?|[-*+][ \t]+|\d+[.)][ \t]+)/;
const CODE_FENCE_REGEX = /^[ \t]*(?:```|~~~)/;

/**
 * Get the range of the full lines covered by the selection.
 * @param {RawTextState} state Current state.
 * @returns {{ lineStart: number, lineEnd: number }} Start of the first line and end of the last
 * line, excluding the line break.
 */
const getLineRange = ({ value, start, end }) => {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  // Ignore a selection that ends at the very start of a line, like a triple-clicked line
  const lastIndex = end > start && value[end - 1] === '\n' ? end - 1 : end;
  const lineEndIndex = value.indexOf('\n', lastIndex);

  return { lineStart, lineEnd: lineEndIndex === -1 ? value.length : lineEndIndex };
};

/**
 * Find the fenced code block the given line is in.
 * @param {string[]} lines All the lines.
 * @param {number} lineIndex Index of the line.
 * @returns {{ open: number, close: number } | undefined} Indexes of the opening and closing fence
 * lines, or `undefined` if the line is not in a code block. An unclosed block ends at the last
 * line.
 */
const findCodeBlock = (lines, lineIndex) => {
  /** @type {number | undefined} */
  let open;

  for (let index = 0; index < lines.length; index += 1) {
    if (CODE_FENCE_REGEX.test(lines[index])) {
      if (open === undefined) {
        open = index;
      } else {
        if (lineIndex >= open && lineIndex <= index) {
          return { open, close: index };
        }

        open = undefined;
      }
    }

    if (open === undefined && index >= lineIndex) {
      return undefined;
    }
  }

  return open !== undefined && lineIndex >= open ? { open, close: lines.length } : undefined;
};

/**
 * Get the type of the block where the selection starts.
 * @param {RawTextState} state Current state.
 * @returns {TextEditorBlockType} Block type.
 */
export const getBlockType = ({ value, start }) => {
  const lines = value.split('\n');
  const lineIndex = value.slice(0, start).split('\n').length - 1;
  const line = lines[lineIndex];

  if (findCodeBlock(lines, lineIndex)) {
    return 'code-block';
  }

  const [, hashes] = line.match(/^(#{1,6})[ \t]/) ?? [];

  if (hashes) {
    return /** @type {TextEditorBlockType} */ (`heading-${hashes.length}`);
  }

  if (/^[-*+][ \t]/.test(line)) {
    return 'bulleted-list';
  }

  if (/^\d+[.)][ \t]/.test(line)) {
    return 'numbered-list';
  }

  if (line.startsWith('>')) {
    return 'blockquote';
  }

  return 'paragraph';
};

/**
 * Wrap the selection with the Markdown markers of the given inline format, or unwrap it if it’s
 * already formatted. Without a selection, the markers are inserted with the caret in between.
 * @param {RawTextState} state Current state.
 * @param {TextEditorFormatType} type Format type.
 * @returns {RawTextEdit} Edit.
 */
export const toggleInlineFormat = ({ value, start, end }, type) => {
  const marker = INLINE_MARKERS[type];
  const { length } = marker;
  const selected = value.slice(start, end);

  // The markers are selected along with the text
  if (selected.length >= length * 2 && selected.startsWith(marker) && selected.endsWith(marker)) {
    const text = selected.slice(length, -length);

    return { start, end, text, selectionStart: start, selectionEnd: start + text.length };
  }

  // The markers surround the selection
  if (value.slice(start - length, start) === marker && value.slice(end, end + length) === marker) {
    return {
      start: start - length,
      end: end + length,
      text: selected,
      selectionStart: start - length,
      selectionEnd: end - length,
    };
  }

  // Keep the surrounding whitespace out of the markers, because `** bold **` is not bold
  const [, leading, content, trailing] = /** @type {RegExpMatchArray} */ (
    selected.match(/^(\s*)([\s\S]*?)(\s*)$/)
  );

  // Inline formatting cannot span multiple paragraphs, so format each line separately
  const text = `${leading}${content
    .split('\n')
    .map((line) => (line.trim() ? `${marker}${line}${marker}` : line))
    .join('\n')}${trailing}`;

  if (!content) {
    const caret = start + leading.length + length;

    return {
      start,
      end,
      text: `${leading}${marker}${marker}${trailing}`,
      selectionStart: caret,
      selectionEnd: caret,
    };
  }

  return {
    start,
    end,
    text,
    selectionStart: start + leading.length + length,
    selectionEnd: start + text.length - trailing.length - length,
  };
};

/**
 * Change the type of the blocks covered by the selection.
 * @param {RawTextState} state Current state.
 * @param {TextEditorBlockType} type New block type.
 * @returns {RawTextEdit} Edit.
 */
export const setBlockType = (state, type) => {
  const { value, start, end } = state;
  const lines = value.split('\n');
  const firstIndex = value.slice(0, start).split('\n').length - 1;
  const codeBlock = findCodeBlock(lines, firstIndex);

  // Leave a code block by removing its fences, then change the type of the selected lines
  if (codeBlock) {
    const { open, close } = codeBlock;
    const blockStart = lines.slice(0, open).join('\n').length + (open ? 1 : 0);
    const blockEnd = blockStart + lines.slice(open, close + 1).join('\n').length;
    const content = lines.slice(open + 1, close).join('\n');
    const contentStart = blockStart + lines[open].length + 1;
    /**
     * Map a position in the whole value to one in the content.
     * @param {number} position Position.
     * @returns {number} Position in the content.
     */
    const map = (position) => Math.min(Math.max(position - contentStart, 0), content.length);
    const edit = setBlockType({ value: content, start: map(start), end: map(end) }, type);

    return {
      start: blockStart,
      end: blockEnd,
      text: `${content.slice(0, edit.start)}${edit.text}${content.slice(edit.end)}`,
      selectionStart: blockStart + edit.selectionStart,
      selectionEnd: blockStart + edit.selectionEnd,
    };
  }

  const { lineStart, lineEnd } = getLineRange(state);
  const oldLines = value.slice(lineStart, lineEnd).split('\n');

  if (type === 'code-block') {
    const text = `\`\`\`\n${oldLines.join('\n')}\n\`\`\``;

    return {
      start: lineStart,
      end: lineEnd,
      text,
      selectionStart: start + 4,
      selectionEnd: end + 4,
    };
  }

  const [, level] = type.match(/^heading-(\d)$/) ?? [];
  let number = 0;

  /**
   * Get the prefix for the given line.
   * @param {string} line Line content without the prefix.
   * @returns {string} Prefix.
   */
  const getPrefix = (line) => {
    if (level) {
      return line.trim() ? `${'#'.repeat(Number(level))} ` : '';
    }

    if (type === 'bulleted-list') {
      return line.trim() ? '- ' : '';
    }

    if (type === 'numbered-list') {
      if (!line.trim()) {
        return '';
      }

      number += 1;

      return `${number}. `;
    }

    if (type === 'blockquote') {
      return line.trim() ? '> ' : '>';
    }

    return '';
  };

  let offset = 0;
  let selectionStart = start;
  let selectionEnd = end;

  const newLines = oldLines.map((line, index) => {
    const [oldPrefix = ''] = line.match(BLOCK_PREFIX_REGEX) ?? [];
    const content = line.slice(oldPrefix.length);
    const newPrefix = getPrefix(content);
    const oldLineStart = lineStart + oldLines.slice(0, index).join('\n').length + (index ? 1 : 0);
    const oldContentStart = oldLineStart + oldPrefix.length;
    const oldLineEnd = oldLineStart + line.length;
    const newContentStart = oldContentStart + offset + newPrefix.length - oldPrefix.length;
    /**
     * Map a position on the old line to the new line, keeping it after the prefix.
     * @param {number} position Position.
     * @returns {number} New position.
     */
    const map = (position) => newContentStart + Math.max(position - oldContentStart, 0);

    if (start >= oldLineStart && start <= oldLineEnd) {
      selectionStart = map(start);
    }

    if (end >= oldLineStart && end <= oldLineEnd) {
      selectionEnd = map(end);
    }

    offset += newPrefix.length - oldPrefix.length;

    return `${newPrefix}${content}`;
  });

  // The selection may end on the next line, which is left as is, but still shifted
  if (end > lineEnd) {
    selectionEnd = end + offset;
  }

  return {
    start: lineStart,
    end: lineEnd,
    text: newLines.join('\n'),
    selectionStart,
    selectionEnd: Math.max(selectionStart, selectionEnd),
  };
};

/**
 * Replace the selection with a Markdown link.
 * @param {RawTextState} state Current state.
 * @param {object} link Link.
 * @param {string} link.url URL.
 * @param {string} [link.text] Link text. Defaults to the selected text, then the URL.
 * @returns {RawTextEdit} Edit.
 */
export const insertLink = ({ value, start, end }, { url, text }) => {
  // Keep the whitespace around the selected text out of the link, as a double-clicked word may come
  // with a trailing space
  const [, leading, selected, trailing] = /** @type {RegExpMatchArray} */ (
    value.slice(start, end).match(/^(\s*)([\s\S]*?)(\s*)$/)
  );

  const label = (text ?? selected).trim() || url;
  const escapedLabel = label.replace(/([[\]\\])/g, '\\$1');
  // A URL with whitespace or parentheses has to be enclosed in angle brackets
  const destination = /[\s()<>]/.test(url) ? `<${url.replace(/[<>]/g, encodeURIComponent)}>` : url;
  const markdown = `[${escapedLabel}](${destination})`;
  const caret = start + leading.length + markdown.length;

  return {
    start,
    end,
    text: `${leading}${markdown}${trailing}`,
    selectionStart: caret,
    selectionEnd: caret,
  };
};

/**
 * Insert the given Markdown at the selection. A block is separated from the surrounding text with
 * blank lines, while inline content is inserted as is.
 * @param {RawTextState} state Current state.
 * @param {string} markdown Markdown to insert.
 * @param {object} [options] Options.
 * @param {boolean} [options.block] Whether the Markdown is a block.
 * @returns {RawTextEdit} Edit.
 */
export const insertMarkdown = ({ value, start, end }, markdown, { block = false } = {}) => {
  if (!block) {
    const caret = start + markdown.length;

    return { start, end, text: markdown, selectionStart: caret, selectionEnd: caret };
  }

  const before = value.slice(0, start).replace(/[ \t]*$/, '');
  const after = value.slice(end).replace(/^[ \t]*/, '');
  const trimmedStart = before.length;
  const trimmedEnd = value.length - after.length;

  const leading = !before
    ? ''
    : before.endsWith('\n\n')
      ? ''
      : before.endsWith('\n')
        ? '\n'
        : '\n\n';

  const trailing = after.startsWith('\n\n') ? '' : after.startsWith('\n') ? '\n' : '\n\n';
  const text = `${leading}${markdown}${trailing}`;
  // Place the caret after the block
  const caret = trimmedStart + text.length;

  return { start: trimmedStart, end: trimmedEnd, text, selectionStart: caret, selectionEnd: caret };
};

/**
 * Get the current value and selection of the given `<textarea>`.
 * @param {HTMLTextAreaElement} textArea `<textarea>` element.
 * @returns {RawTextState} State.
 */
export const getRawTextState = ({ value, selectionStart, selectionEnd }) => ({
  value,
  start: selectionStart,
  end: selectionEnd,
});

/**
 * Move the focus to the given `<textarea>`. A toolbar menu is a modal, which leaves the rest of the
 * page inert until it’s closed, so the focus may not move right away when an item is selected;
 * retry until it does, or give up after a second.
 * @param {HTMLTextAreaElement} textArea `<textarea>` element.
 * @returns {Promise<boolean>} Whether the `<textarea>` has the focus.
 */
export const focusTextArea = async (textArea) => {
  const deadline = Date.now() + 1000;

  for (;;) {
    textArea.focus();

    if (document.activeElement === textArea || Date.now() > deadline) {
      return document.activeElement === textArea;
    }

    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      window.setTimeout(resolve, 20);
    });
  }
};

/**
 * Whether the given `<textarea>` can be edited by the user, and therefore by the toolbar.
 * @param {HTMLTextAreaElement} textArea `<textarea>` element.
 * @returns {boolean} Result.
 */
export const isRawTextEditable = ({ readOnly, disabled }) => !readOnly && !disabled;

/**
 * Apply the given edit to the `<textarea>`, and focus it. Nothing happens if it’s read-only or
 * disabled, because the fallback below would edit it anyway.
 * @param {HTMLTextAreaElement} textArea `<textarea>` element.
 * @param {RawTextEdit} edit Edit.
 * @returns {Promise<void>} Nothing.
 */
export const applyRawTextEdit = async (
  textArea,
  { start, end, text, selectionStart, selectionEnd },
) => {
  if (!isRawTextEditable(textArea)) {
    return;
  }

  // The edit only goes into the undo history while the `<textarea>` has the focus
  const focused = await focusTextArea(textArea);

  if (textArea.value.slice(start, end) !== text) {
    textArea.setSelectionRange(start, end);

    // `execCommand()` is deprecated, but it’s still the only way to keep the edit in the native
    // undo history. It fires an `input` event, so a bound value is updated as well
    const done =
      focused &&
      typeof document.execCommand === 'function' &&
      (text
        ? document.execCommand('insertText', false, text)
        : document.execCommand('delete', false));

    if (!done || textArea.value.slice(start, start + text.length) !== text) {
      textArea.setRangeText(text, start, end);
      textArea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  textArea.setSelectionRange(selectionStart, selectionEnd);
};

/**
 * Insert the Markdown of a new instance of the given editor component into the `<textarea>`. A
 * component matched by a single-line pattern is inserted inline at the caret; anything else is
 * inserted as a separate block. If the component has no Markdown to insert, the focus just moves
 * back to the `<textarea>`.
 * @param {HTMLTextAreaElement} textArea `<textarea>` element.
 * @param {TextEditorComponent} component Editor component.
 * @returns {Promise<void>} Nothing.
 */
export const insertComponent = async (textArea, component) => {
  const markdown = getComponentMarkdown(component);

  if (!markdown) {
    textArea.focus();

    return;
  }

  const block = component.transformer?.type !== 'text-match';

  await applyRawTextEdit(textArea, insertMarkdown(getRawTextState(textArea), markdown, { block }));
};
