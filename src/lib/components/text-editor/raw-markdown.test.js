import { isMac } from '@sveltia/utils/events';
import { describe, expect, it, vi } from 'vitest';
import {
  applyRawTextEdit,
  editRawText,
  focusTextArea,
  getBlockType,
  getRawTextState,
  insertLink,
  insertMarkdown,
  registerRawTextShortcut,
  setBlockType,
  toggleInlineFormat,
} from './raw-markdown.js';

/**
 * @import { RawTextEdit, RawTextState } from './raw-markdown.js';
 */

/**
 * Create a state from a string where `|` marks the selection start and end, or the caret.
 * @param {string} marked Value with markers.
 * @returns {RawTextState} State.
 */
const state = (marked) => {
  const start = marked.indexOf('|');
  const end = marked.indexOf('|', start + 1);

  return end === -1
    ? { value: marked.replace('|', ''), start, end: start }
    : { value: marked.replaceAll('|', ''), start, end: end - 1 };
};

/**
 * Apply an edit to a state, and mark the new selection like {@link state}.
 * @param {RawTextState} current Current state.
 * @param {RawTextEdit} edit Edit.
 * @returns {string} New value with markers.
 */
const apply = ({ value }, { start, end, text, selectionStart, selectionEnd }) => {
  const newValue = `${value.slice(0, start)}${text}${value.slice(end)}`;
  const before = newValue.slice(0, selectionStart);
  const after = newValue.slice(selectionEnd);

  return selectionStart === selectionEnd
    ? `${before}|${after}`
    : `${before}|${newValue.slice(selectionStart, selectionEnd)}|${after}`;
};

describe('toggleInlineFormat', () => {
  /**
   * Toggle the format on the marked value.
   * @param {string} marked Value with markers.
   * @param {any} type Format type.
   * @returns {string} Result with markers.
   */
  const toggle = (marked, type) => apply(state(marked), toggleInlineFormat(state(marked), type));

  it('wraps the selection with the markers', () => {
    expect(toggle('Hello |world|', 'bold')).toBe('Hello **|world|**');
    expect(toggle('Hello |world|', 'italic')).toBe('Hello _|world|_');
    expect(toggle('Hello |world|', 'strikethrough')).toBe('Hello ~~|world|~~');
    expect(toggle('Hello |world|', 'code')).toBe('Hello `|world|`');
  });

  it('keeps the surrounding whitespace out of the markers', () => {
    expect(toggle('Hello| world |!', 'bold')).toBe('Hello **|world|** !');
  });

  it('formats each line separately', () => {
    expect(toggle('|One\n\nTwo|', 'italic')).toBe('_|One_\n\n_Two|_');
  });

  it('inserts the markers with the caret in between without a selection', () => {
    expect(toggle('Hello |', 'bold')).toBe('Hello **|**');
    expect(toggle('|   |', 'code')).toBe('   `|`');
  });

  it('unwraps the selection when the markers are selected or surround it', () => {
    expect(toggle('Hello |**world**|', 'bold')).toBe('Hello |world|');
    expect(toggle('Hello **|world|**', 'bold')).toBe('Hello |world|');
    expect(toggle('Hello **||**', 'bold')).toBe('Hello |');
  });
});

describe('getBlockType', () => {
  it('detects the type of the line where the selection starts', () => {
    expect(getBlockType(state('|Text'))).toBe('paragraph');
    expect(getBlockType(state('# |Title'))).toBe('heading-1');
    expect(getBlockType(state('Text\n###### |Title'))).toBe('heading-6');
    expect(getBlockType(state('####### |Not a heading'))).toBe('paragraph');
    expect(getBlockType(state('- |Item'))).toBe('bulleted-list');
    expect(getBlockType(state('* |Item'))).toBe('bulleted-list');
    expect(getBlockType(state('12. |Item'))).toBe('numbered-list');
    expect(getBlockType(state('> |Quote'))).toBe('blockquote');
  });

  it('detects a fenced code block, closed or not', () => {
    expect(getBlockType(state('```js\n|code\n```'))).toBe('code-block');
    expect(getBlockType(state('|```js\ncode\n```'))).toBe('code-block');
    expect(getBlockType(state('```js\ncode\n```|'))).toBe('code-block');
    expect(getBlockType(state('```js\ncode\n```\n|Text'))).toBe('paragraph');
    expect(getBlockType(state('~~~\ncode\n|'))).toBe('code-block');
    expect(getBlockType(state('|Text\n```\ncode\n```'))).toBe('paragraph');
  });
});

describe('setBlockType', () => {
  /**
   * Change the block type on the marked value.
   * @param {string} marked Value with markers.
   * @param {any} type Block type.
   * @returns {string} Result with markers.
   */
  const change = (marked, type) => apply(state(marked), setBlockType(state(marked), type));

  it('turns lines into headings, keeping the caret in place', () => {
    expect(change('Ti|tle\nText', 'heading-2')).toBe('## Ti|tle\nText');
    expect(change('# Ti|tle', 'heading-3')).toBe('### Ti|tle');
    expect(change('- |Title', 'heading-1')).toBe('# |Title');
  });

  it('moves the caret after the new prefix when it was in the old one', () => {
    expect(change('#|## Title', 'paragraph')).toBe('|Title');
  });

  it('turns every selected line into a list item or a quote, skipping blank lines', () => {
    expect(change('|One\nTwo\n\nThree|', 'bulleted-list')).toBe('- |One\n- Two\n\n- Three|');
    expect(change('|One\nTwo|', 'numbered-list')).toBe('1. |One\n2. Two|');
    expect(change('|One\n\nTwo|', 'blockquote')).toBe('> |One\n>\n> Two|');
    expect(change('|One\n\nTwo|', 'numbered-list')).toBe('1. |One\n\n2. Two|');
    expect(change('|One\n\nTwo|', 'heading-2')).toBe('## |One\n\n## Two|');
  });

  it('ignores a line only selected at its very start', () => {
    expect(change('|One\n|Two', 'bulleted-list')).toBe('- |One\n|Two');
  });

  it('turns lines back into paragraphs', () => {
    expect(change('|> One\n> Two|', 'paragraph')).toBe('|One\nTwo|');
  });

  it('wraps lines in a code block, and unwraps it again', () => {
    expect(change('Text\nco|de\nText', 'code-block')).toBe('Text\n```\nco|de\n```\nText');
    expect(change('Text\n```js\nco|de\n```\nText', 'paragraph')).toBe('Text\nco|de\nText');
    expect(change('```\none\ntw|o\n```', 'heading-1')).toBe('one\n# tw|o');
    // The caret on a fence line moves into the content
    expect(change('|```\ncode\n```', 'paragraph')).toBe('|code');
  });
});

describe('insertLink', () => {
  it('links the selected text', () => {
    const current = state('See |the docs|.');

    expect(apply(current, insertLink(current, { url: 'https://example.com' }))).toBe(
      'See [the docs](https://example.com)|.',
    );
  });

  it('keeps the whitespace around the selected text out of the link', () => {
    const current = state('See |docs |here');

    expect(apply(current, insertLink(current, { url: '/a' }))).toBe('See [docs](/a)| here');
  });

  it('uses the given text, or the URL without text', () => {
    const current = state('See |');

    expect(apply(current, insertLink(current, { url: '/a', text: ' Docs ' }))).toBe(
      'See [Docs](/a)|',
    );
    expect(apply(current, insertLink(current, { url: '/a', text: '' }))).toBe('See [/a](/a)|');
  });

  it('escapes the text and encloses a URL with special characters', () => {
    const current = state('|');

    expect(apply(current, insertLink(current, { url: '/a b(c)', text: '[x]' }))).toBe(
      '[\\[x\\]](</a b(c)>)|',
    );
    expect(apply(current, insertLink(current, { url: '/<a>', text: 'x' }))).toBe(
      '[x](</%3Ca%3E>)|',
    );
  });
});

describe('insertMarkdown', () => {
  /**
   * Insert Markdown into the marked value.
   * @param {string} marked Value with markers.
   * @param {string} markdown Markdown.
   * @param {boolean} [block] Whether it’s a block.
   * @returns {string} Result with markers.
   */
  const insert = (marked, markdown, block) =>
    apply(state(marked), insertMarkdown(state(marked), markdown, { block }));

  it('inserts inline content as is', () => {
    expect(insert('A |B', '![x](y)')).toBe('A ![x](y)|B');
    expect(insert('A |old| B', '[x]')).toBe('A [x]| B');
  });

  it('separates a block from the surrounding text with blank lines', () => {
    expect(insert('|', 'BLOCK', true)).toBe('BLOCK\n\n|');
    expect(insert('Before |After', 'BLOCK', true)).toBe('Before\n\nBLOCK\n\n|After');
    expect(insert('Before\n|After', 'BLOCK', true)).toBe('Before\n\nBLOCK\n\n|After');
    expect(insert('Before\n\n|\n\nAfter', 'BLOCK', true)).toBe('Before\n\nBLOCK|\n\nAfter');
    expect(insert('Before|\nAfter', 'BLOCK', true)).toBe('Before\n\nBLOCK\n|\nAfter');
  });
});

describe('textarea helpers', () => {
  it('gets the value and selection', () => {
    const textArea = document.createElement('textarea');

    textArea.value = 'Hello';
    textArea.setSelectionRange(1, 3);
    expect(getRawTextState(textArea)).toEqual({ value: 'Hello', start: 1, end: 3 });
  });

  it('applies an edit, firing an `input` event, and selects the given range', async () => {
    const textArea = document.createElement('textarea');
    const onInput = vi.fn();

    document.body.append(textArea);
    textArea.value = 'Hello world';
    textArea.addEventListener('input', onInput);

    await applyRawTextEdit(textArea, {
      start: 6,
      end: 11,
      text: '**world**',
      selectionStart: 8,
      selectionEnd: 13,
    });

    expect(textArea.value).toBe('Hello **world**');
    expect(onInput).toHaveBeenCalled();
    expect([textArea.selectionStart, textArea.selectionEnd]).toEqual([8, 13]);
    expect(document.activeElement).toBe(textArea);

    // An edit that changes nothing only moves the selection
    onInput.mockClear();
    await applyRawTextEdit(textArea, {
      start: 0,
      end: 5,
      text: 'Hello',
      selectionStart: 0,
      selectionEnd: 0,
    });
    expect(onInput).not.toHaveBeenCalled();
    expect(textArea.selectionStart).toBe(0);

    textArea.remove();
  });

  it('deletes text with the native command to keep it in the undo history', async () => {
    const textArea = document.createElement('textarea');
    const original = document.execCommand;

    const execCommand = vi.fn((/** @type {string} */ command) => {
      if (command === 'delete') {
        textArea.setRangeText('', textArea.selectionStart, textArea.selectionEnd);
      }

      return true;
    });

    document.body.append(textArea);
    textArea.value = 'Hello world';
    document.execCommand = execCommand;

    try {
      await applyRawTextEdit(textArea, {
        start: 5,
        end: 11,
        text: '',
        selectionStart: 5,
        selectionEnd: 5,
      });
    } finally {
      document.execCommand = original;
      textArea.remove();
    }

    expect(execCommand).toHaveBeenCalledWith('delete', false);
    expect(textArea.value).toBe('Hello');
    expect(textArea.selectionStart).toBe(5);
  });

  it('leaves a read-only or disabled `<textarea>` alone', async () => {
    const textArea = document.createElement('textarea');
    const edit = { start: 0, end: 0, text: 'x', selectionStart: 1, selectionEnd: 1 };

    document.body.append(textArea);
    textArea.readOnly = true;
    await applyRawTextEdit(textArea, edit);
    expect(textArea.value).toBe('');
    textArea.readOnly = false;
    textArea.disabled = true;
    await applyRawTextEdit(textArea, edit);
    expect(textArea.value).toBe('');
    textArea.remove();
  });

  it('edits the `<textarea>` from its current state, if any', async () => {
    const textArea = document.createElement('textarea');
    const getEdit = vi.fn((current) => toggleInlineFormat(current, 'bold'));

    document.body.append(textArea);
    textArea.value = 'Hello world';
    textArea.setSelectionRange(6, 11);
    await editRawText(textArea, getEdit);
    expect(getEdit).toHaveBeenCalledWith({ value: 'Hello world', start: 6, end: 11 });
    expect(textArea.value).toBe('Hello **world**');

    getEdit.mockClear();
    await editRawText(undefined, getEdit);
    expect(getEdit).not.toHaveBeenCalled();
    textArea.remove();
  });

  it('handles a keyboard shortcut while the `<textarea>` is editable', () => {
    const textArea = document.createElement('textarea');
    const handler = vi.fn();
    const unregister = registerRawTextShortcut(textArea, 'B', handler);

    /**
     * Press Accel+B.
     * @returns {KeyboardEvent} Event.
     */
    const press = () => {
      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: !isMac(),
        metaKey: isMac(),
        cancelable: true,
      });

      textArea.dispatchEvent(event);

      return event;
    };

    expect(press().defaultPrevented).toBe(true);
    expect(handler).toHaveBeenCalledOnce();

    textArea.readOnly = true;
    press();
    expect(handler).toHaveBeenCalledOnce();
    textArea.readOnly = false;

    unregister();
    press();
    expect(handler).toHaveBeenCalledOnce();
  });

  it('gives up on moving the focus to an element that cannot take it', async () => {
    vi.useFakeTimers();

    const textArea = document.createElement('textarea');
    const promise = focusTextArea(textArea);

    await vi.advanceTimersByTimeAsync(1100);
    await expect(promise).resolves.toBe(false);
    vi.useRealTimers();
  });
});
