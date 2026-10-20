import { CodeNode } from '@lexical/code-core';
import { LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import {
  $convertFromMarkdownString as convertFromMarkdownString,
  $convertToMarkdownString as convertToMarkdownString,
  TRANSFORMERS,
} from '@lexical/markdown';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { $getRoot as getRoot, $isTextNode as isTextNode, createEditor } from 'lexical';
import { describe, expect, it } from 'vitest';

import { LEADING_INLINE_CODE } from './inline-code.js';

/**
 * Import the given Markdown with the standard transformers and this one, and export it again.
 * @param {string} markdown Markdown.
 * @returns {{ markdown: string, texts: { text: string, code: boolean, bold: boolean }[] }} Exported
 * Markdown, and the text nodes of the imported content.
 */
const roundTrip = (markdown) => {
  const transformers = [...TRANSFORMERS, LEADING_INLINE_CODE];

  const editor = createEditor({
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, LinkNode],
    /**
     * Fail the test on an editor error.
     * @param {Error} error Error.
     * @throws {Error} The same error.
     */
    onError: (error) => {
      throw error;
    },
  });

  /** @type {{ text: string, code: boolean, bold: boolean }[]} */
  let texts = [];
  let output = '';

  editor.update(
    () => {
      convertFromMarkdownString(markdown, transformers);
      texts = getRoot()
        .getAllTextNodes()
        .filter(isTextNode)
        .map((node) => ({
          text: node.getTextContent(),
          code: node.hasFormat('code'),
          bold: node.hasFormat('bold'),
        }));
      output = convertToMarkdownString(transformers);
    },
    { discrete: true },
  );

  return { markdown: output, texts };
};

describe('LEADING_INLINE_CODE', () => {
  it('is never used to export Markdown or as a shortcut', () => {
    expect(
      LEADING_INLINE_CODE.export?.(
        /** @type {any} */ ({}),
        () => '',
        () => '',
      ),
    ).toBeNull();
    expect(LEADING_INLINE_CODE.regExp.test('`a`')).toBe(false);
  });

  it('matches the code span at the start of the text', () => {
    /**
     * Get the length and content of the code span the given text starts with.
     * @param {string} text Text.
     * @returns {[number, string] | undefined} Result.
     */
    const match = (text) => {
      const result = text.match(/** @type {RegExp} */ (LEADING_INLINE_CODE.importRegExp));

      return result ? [result[0].length, result[2]] : undefined;
    };

    expect(match('`C:\\$MFT`')).toEqual([9, 'C:\\$MFT']);
    expect(match('`a` and `b`')).toEqual([3, 'a']);
    expect(match('`` a ` b `` text')).toEqual([11, ' a ` b ']);
    expect(match('` `')).toEqual([3, ' ']);
    expect(match('text `a`')).toBeUndefined();
    expect(match('``a`')).toBeUndefined();
    expect(match('`a``')).toBeUndefined();
    expect(match('`')).toBeUndefined();
  });

  it('strips one space from both ends of the content only if it is not all spaces', () => {
    expect(roundTrip('` a ` and `  b  ` and `   `').texts).toEqual([
      { text: 'a', code: true, bold: false },
      { text: ' and ', code: false, bold: false },
      { text: ' b ', code: true, bold: false },
      { text: ' and ', code: false, bold: false },
      { text: '   ', code: true, bold: false },
    ]);
  });

  it('keeps the backslashes in a code span that makes up the whole text', () => {
    expect(roundTrip('`C:\\$MFT`')).toEqual({
      markdown: '`C:\\$MFT`',
      texts: [{ text: 'C:\\$MFT', code: true, bold: false }],
    });
  });

  it('keeps the backslashes in code spans at the start and end of the text', () => {
    expect(roundTrip('`C:\\$MFT` and \\* `\\<`')).toEqual({
      markdown: '`C:\\$MFT` and \\* `\\<`',
      texts: [
        { text: 'C:\\$MFT', code: true, bold: false },
        { text: ' and * ', code: false, bold: false },
        { text: '\\<', code: true, bold: false },
      ],
    });
  });

  it('keeps the other formats of the code', () => {
    expect(roundTrip('**`a\\<b`** and **`\\$` c**')).toEqual({
      markdown: '**`a\\<b`** and **`\\$` c**',
      texts: [
        { text: 'a\\<b', code: true, bold: true },
        { text: ' and ', code: false, bold: false },
        { text: '\\$', code: true, bold: true },
        { text: ' c', code: false, bold: true },
      ],
    });
  });

  it('leaves a backtick run without a closing one as text', () => {
    expect(roundTrip('``a\\$` b')).toEqual({
      markdown: '\\`\\`a$\\` b',
      texts: [{ text: '``a$` b', code: false, bold: false }],
    });
  });
});
