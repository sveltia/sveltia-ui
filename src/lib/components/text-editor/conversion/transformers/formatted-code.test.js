import { CodeNode } from '@lexical/code-core';
import { $isLinkNode as isLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import {
  $convertFromMarkdownString as convertFromMarkdownString,
  $convertToMarkdownString as convertToMarkdownString,
  BOLD_STAR,
  TRANSFORMERS,
} from '@lexical/markdown';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { $getRoot as getRoot, createEditor } from 'lexical';
import { describe, expect, it } from 'vitest';

import { addCodeSpanSplit } from './formatted-code.js';
import { LEADING_INLINE_CODE } from './inline-code.js';

/**
 * @import { TextMatchTransformer, Transformer } from '@lexical/markdown';
 */

/**
 * Standard transformers, with the one for inline code at the start of a node.
 */
const STANDARD_TRANSFORMERS = [...TRANSFORMERS, LEADING_INLINE_CODE];

/**
 * Import the given Markdown and export it again.
 * @param {string} markdown Markdown.
 * @param {Transformer[]} [transformers] Transformers for the import.
 * @returns {{ markdown: string, texts: string[] }} Exported Markdown, and the text nodes of the
 * imported content, with their formats, like `bold,code:a`, and `link:` if they’re in a link.
 */
const roundTrip = (markdown, transformers = addCodeSpanSplit(STANDARD_TRANSFORMERS)) => {
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

  /** @type {string[]} */
  let texts = [];
  let output = '';

  editor.update(
    () => {
      convertFromMarkdownString(markdown, transformers);
      texts = getRoot()
        .getAllTextNodes()
        .map((node) => {
          const formats = /** @type {const} */ (['bold', 'italic', 'strikethrough', 'code']).filter(
            (format) => node.hasFormat(format),
          );

          return `${isLinkNode(node.getParent()) ? 'link:' : ''}${formats.join(',')}:${node.getTextContent()}`;
        });
      output = convertToMarkdownString(STANDARD_TRANSFORMERS);
    },
    { discrete: true },
  );

  return { markdown: output, texts };
};

describe('addCodeSpanSplit', () => {
  it('works around Lexical, which loses the formatting around a code span after other formatting', () => {
    // If this fails, Lexical has fixed the issue, and the transformer can be removed
    expect(roundTrip('**a** **`b`**', STANDARD_TRANSFORMERS).texts).toEqual([
      'bold:a',
      ': **',
      'code:b',
      ':**',
    ]);
  });

  it('keeps the formatting around a code span after other formatting', () => {
    expect(roundTrip('**a** **`b`**').texts).toEqual(['bold:a', ': ', 'bold,code:b']);
    expect(roundTrip('*a* *`b`* ~~c~~ ~~`d`~~').markdown).toBe('*a* *`b`* ~~c~~ ~~`d`~~');
    expect(roundTrip('**a** c **d `b` e** f').markdown).toBe('**a** c **d `b` e** f');
    // After a code span
    expect(roundTrip('`a` **b** **`c`**').markdown).toBe('`a` **b** **`c`**');
  });

  it('keeps the formatting around a code span after a link with formatting', () => {
    expect(roundTrip('[**a**](u)**`b`**').texts).toEqual(['link:bold:a', 'bold,code:b']);
    expect(roundTrip('[*a*](u)*`b`*').markdown).toBe('[*a*](u)*`b`*');
  });

  it('keeps the formatting around a code span in a link', () => {
    expect(roundTrip('[**a** **`b`**](u)').texts).toEqual([
      'link:bold:a',
      'link:: ',
      'link:bold,code:b',
    ]);
  });

  it('keeps nested formatting around a code span', () => {
    expect(roundTrip('**a** **_`b`_ c**').texts).toEqual([
      'bold:a',
      ': ',
      'bold,italic,code:b',
      'bold: c',
    ]);
    expect(roundTrip('***a*** ***`b`***').texts).toEqual([
      'bold,italic:a',
      ': ',
      'bold,italic,code:b',
    ]);
  });

  it('does not split the text where it would cut a link in two', () => {
    // CommonMark reads `[a **b](u)` as a link, but Lexical pairs the emphasis across it, so the
    // text is left to Lexical as is
    expect(roundTrip('**c** [a **b](u) `d`**').texts).toEqual(
      roundTrip('**c** [a **b](u) `d`**', STANDARD_TRANSFORMERS).texts,
    );
  });

  it('leaves the other text alone', () => {
    [
      'a `b` c',
      '**a** `b` **c**',
      '**`a`** **b**',
      '[a](u) **`b`**',
      '\\*\\*a\\*\\* **`b`**',
      '**a** \\**`b`**',
      '_a_ b_`c`_',
    ].forEach((markdown) => {
      expect(roundTrip(markdown).texts).toEqual(roundTrip(markdown, STANDARD_TRANSFORMERS).texts);
    });
  });

  it('returns the transformers as is without inline code', () => {
    const transformers = [BOLD_STAR];

    expect(addCodeSpanSplit(transformers)).toBe(transformers);
  });

  it('is only used to import', () => {
    const [splitter] = /** @type {TextMatchTransformer[]} */ (
      addCodeSpanSplit(STANDARD_TRANSFORMERS)
    );

    expect(
      splitter.export?.(
        /** @type {any} */ ({}),
        () => '',
        () => '',
      ),
    ).toBeNull();
    expect(splitter.regExp.test('**a** **`b`**')).toBe(false);
  });

  it('skips a match of the other text match transformers before the split', () => {
    /** @type {TextMatchTransformer} */
    const transformer = {
      dependencies: [],
      /**
       * Get the end index of a match.
       * @returns {number} End index.
       */
      getEndIndex: () => 5,
      importRegExp: /x/,
      regExp: /x/,
      /**
       * Leave the text as is.
       * @returns {undefined} Nothing.
       */
      replace: () => undefined,
      type: 'text-match',
    };

    const wrapped = /** @type {TextMatchTransformer} */ (
      addCodeSpanSplit([...STANDARD_TRANSFORMERS, transformer]).at(-1)
    );

    /**
     * Get the end index of the match in the given text.
     * @param {string} text Text.
     * @returns {number | false | undefined} End index.
     */
    const getEndIndex = (text) =>
      wrapped.getEndIndex?.(
        /** @type {any} */ ({ getTextContent: String.prototype.toString.bind(text) }),
        /** @type {RegExpMatchArray} */ (text.match(/x/)),
      );

    expect(getEndIndex('x')).toBe(5);
    // The text is split at 8
    expect(getEndIndex('**x** a **`b`**')).toBe(false);
    // The text is split at 4
    expect(getEndIndex('_x_ _`b`_')).toBe(5);
  });
});
