import { $isLinkNode as isLinkNode, LinkNode } from '@lexical/link';
import {
  $convertFromMarkdownString as convertFromMarkdownString,
  $convertToMarkdownString as convertToMarkdownString,
  LINK as LEXICAL_LINK,
  TRANSFORMERS,
} from '@lexical/markdown';
import { $getRoot as getRoot, createEditor } from 'lexical';
import { describe, expect, it } from 'vitest';

import { DISABLED_MARKDOWN_TAGS } from '../constants.js';
import { BLOCK_SYNTAX_ESCAPE } from './block-escape.js';
import { LEADING_INLINE_CODE } from './inline-code.js';
import { LINK } from './link.js';

/**
 * Create a headless editor with the link node.
 * @returns {import('lexical').LexicalEditor} Editor.
 */
const createTestEditor = () =>
  createEditor({
    nodes: [LinkNode],
    /**
     * Fail the test on an editor error.
     * @param {Error} error Error.
     * @throws {Error} The same error.
     */
    onError: (error) => {
      throw error;
    },
  });

/**
 * Import Markdown and get the links and the text of the first paragraph.
 * @param {string} markdown Markdown.
 * @returns {{ text: string, links: { text: string, url: string, title: string | null }[] }}
 * Result.
 */
const importLinks = (markdown) => {
  const editor = createTestEditor();

  editor.update(() => convertFromMarkdownString(markdown, [LINK]), { discrete: true });

  return editor.read(() => {
    const paragraph = /** @type {import('lexical').ElementNode} */ (getRoot().getFirstChild());

    return {
      text: paragraph.getTextContent(),
      links: paragraph
        .getChildren()
        .filter(isLinkNode)
        .map((link) => ({
          text: link.getTextContent(),
          url: link.getURL(),
          title: link.getTitle(),
        })),
    };
  });
};

/**
 * Import Markdown with the text format transformers and export it again, like the editor does.
 * @param {string} markdown Markdown.
 * @returns {string} Exported Markdown.
 */
const roundTrip = (markdown) => {
  const editor = createTestEditor();

  const transformers = TRANSFORMERS.filter(
    (transformer) =>
      transformer.type === 'text-format' && !DISABLED_MARKDOWN_TAGS.includes(transformer.tag),
  );

  editor.update(
    () => convertFromMarkdownString(markdown, [...transformers, LINK, LEADING_INLINE_CODE]),
    {
      discrete: true,
    },
  );

  return editor.read(() =>
    convertToMarkdownString([...transformers, LINK, LEADING_INLINE_CODE, BLOCK_SYNTAX_ESCAPE]),
  );
};

describe('LINK', () => {
  it('extends Lexical’s link transformer', () => {
    expect(LINK.export).not.toBe(LEXICAL_LINK.export);
    expect(LINK.regExp).toBe(LEXICAL_LINK.regExp);
    expect(LINK.importRegExp).toBe(LEXICAL_LINK.importRegExp);
  });

  it('imports a link', () => {
    expect(importLinks('a [b](https://example.com/\\(c\\) "d\\"e") f')).toEqual({
      text: 'a b f',
      links: [{ text: 'b', url: 'https://example.com/(c)', title: 'd"e' }],
    });
  });

  it('leaves an unbalanced bracket out of the link, like Lexical', () => {
    expect(importLinks('[a [b](c)')).toEqual({
      text: '[a b',
      links: [{ text: 'b', url: 'c', title: null }],
    });
    expect(importLinks('[a]b](c)').links).toEqual([]);
  });

  it('exports the formats of the whole link text around the link', () => {
    expect(roundTrip('**[a](b)**')).toBe('**[a](b)**');
    expect(roundTrip('_[a](b)_ and ~~[c](d "e")~~')).toBe('_[a](b)_ and ~~[c](d "e")~~');
    expect(roundTrip('**_[a](b)_**, (**[c](d)**)')).toBe('**_[a](b)_**, (**[c](d)**)');
    expect(roundTrip('[**a**](b)')).toBe('**[a](b)**');
    expect(roundTrip('**[a](b) c**')).toBe('**[a](b)** **c**');
    expect(roundTrip('a\n**[b](c)**\nd')).toBe('a\n**[b](c)**\nd');
    expect(roundTrip('**[` `](b)** **[` ` c ` `](d)**')).toBe('**[` `](b)** **[` ` c ` `](d)**');
  });

  it('exports the formats of part of the link text in the link', () => {
    expect(roundTrip('[**a** b](c)')).toBe('[**a** b](c)');
    expect(roundTrip('[_a_ **b**](c)')).toBe('[_a_ **b**](c)');
    expect(roundTrip('[`a`](b)')).toBe('[`a`](b)');
  });

  it('exports the formats in the link text if the delimiters can’t be next to the link', () => {
    // Text with the same format right next to the link, whose delimiters would meet
    expect(roundTrip('**[a](b)c**')).toBe('[**a**](b)**c**');
    expect(roundTrip('**[a](b). c**')).toBe('[**a**](b)**. c**');
    // Another link
    expect(roundTrip('**[a](b)[c](d)**')).toBe('[**a**](b)[**c**](d)');
    expect(roundTrip('**` `[a](b)**')).toBe('**` `**[**a**](b)');
  });
});
