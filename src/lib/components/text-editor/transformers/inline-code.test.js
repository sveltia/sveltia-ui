import { CodeNode } from '@lexical/code-core';
import { LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import {
  $convertFromMarkdownString as convertFromMarkdownString,
  $convertToMarkdownString as convertToMarkdownString,
  TRANSFORMERS,
} from '@lexical/markdown';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import {
  $createParagraphNode as createParagraphNode,
  $createTextNode as createTextNode,
  $getRoot as getRoot,
  $isTextNode as isTextNode,
  createEditor,
} from 'lexical';
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

/**
 * Export paragraphs, each with a text node, which can be code. Lexical can’t import code with a
 * tab, as it turns it into a tab node.
 * @param {...(string | { code: string, bold?: boolean })} paragraphs Text of each paragraph, or the
 * code and whether it’s bold. An empty string is an empty paragraph.
 * @returns {string} Exported Markdown.
 */
const exportParagraphs = (...paragraphs) => {
  const transformers = [...TRANSFORMERS, LEADING_INLINE_CODE];
  const editor = createEditor({ nodes: [CodeNode, LinkNode] });
  let output = '';

  editor.update(
    () => {
      paragraphs.forEach((paragraph) => {
        const element = createParagraphNode();

        if (typeof paragraph !== 'string') {
          const code = createTextNode(paragraph.code).toggleFormat('code');

          element.append(paragraph.bold ? code.toggleFormat('bold') : code);
        } else if (paragraph) {
          element.append(createTextNode(paragraph));
        }

        getRoot().append(element);
      });
      output = convertToMarkdownString(transformers);
    },
    { discrete: true },
  );

  return output;
};

describe('LEADING_INLINE_CODE', () => {
  it('is never used to export other nodes or as a shortcut', () => {
    expect(
      LEADING_INLINE_CODE.export?.(
        /** @type {any} */ ({}),
        () => '',
        () => '',
      ),
    ).toBeNull();
    expect(LEADING_INLINE_CODE.regExp.test('`a`')).toBe(false);
  });

  it('exports a code span made only of spaces without padding', () => {
    expect(roundTrip('` `').markdown).toBe('` `');
    expect(roundTrip('a `  ` b').markdown).toBe('a `  ` b');
    expect(roundTrip('`   `').markdown).toBe('`   `');
  });

  it('exports a code span that starts and ends with a tab without padding', () => {
    expect(exportParagraphs({ code: '\t' })).toBe('`\t`');
    expect(exportParagraphs({ code: '\t ' })).toBe('`\t `');
    expect(exportParagraphs({ code: ' \ta\t' })).toBe('` \ta\t`');
    expect(exportParagraphs({ code: '\t', bold: true })).toBe('**`\t`**');
    // CommonMark would strip one space from both ends
    expect(exportParagraphs({ code: ' \t ' })).toBe('`  \t  `');
  });

  it('exports a paragraph with only a code span made of whitespace as a paragraph', () => {
    expect(exportParagraphs('a', { code: '\t' }, 'b')).toBe('a\n\n`\t`\n\nb');
    expect(exportParagraphs('a', { code: ' ', bold: true }, { code: '  ' }, 'b')).toBe(
      'a\n\n**` `**\n\n`  `\n\nb',
    );
    expect(exportParagraphs('a', '', { code: '\t' }, '', 'b')).toBe(
      exportParagraphs('a', '', 'x', '', 'b').replace('x', '`\t`'),
    );
    // Not taken as empty
    expect(exportParagraphs('a', { code: '    ' }, 'b')).toBe('a\n\n`    `\n\nb');
  });

  it('exports the formats around a code span made only of spaces', () => {
    expect(roundTrip('**` `** *` `* ~~`  `~~').markdown).toBe('**` `** *` `* ~~`  `~~');

    // Like those around other code spans
    ['~~**`x`**`a`~~', '~~`a`**`x`**~~'].forEach((markdown) => {
      expect(roundTrip(markdown.replace('x', ' ')).markdown).toBe(
        roundTrip(markdown).markdown.replace('x', ' '),
      );
    });
  });

  it('keeps exporting the other code spans with Lexical’s padding', () => {
    expect(roundTrip('` a `').markdown).toBe('`a`');
    expect(roundTrip('`  a  `').markdown).toBe('`  a  `');
    expect(roundTrip('` a` and `a `').markdown).toBe('` a` and `a `');
    expect(roundTrip('`` ` ``').markdown).toBe('`` ` ``');
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
