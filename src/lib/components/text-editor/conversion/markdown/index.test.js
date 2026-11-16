import { describe, expect, it } from 'vitest';
import { HTML_BLOCK_PLACEHOLDER } from '../placeholder-chars.js';
import * as markdown from './index.js';

const { convertBlockSyntax, toLexicalMarkdown } = markdown;

describe('index', () => {
  it('should export the Markdown processing functions', () => {
    expect(Object.keys(markdown).sort()).toEqual([
      'convertBlockSyntax',
      'removeImportPlaceholders',
      'toLexicalMarkdown',
      'trimBlankBlockquoteLines',
    ]);
  });
});

describe('convertBlockSyntax', () => {
  const value = '~~~js\nx\n~~~\n\nTitle\n===';

  it('should convert the block syntax of the enabled elements only', () => {
    expect(convertBlockSyntax(value, { hasCodeBlocks: true, hasHeadings: true })).toBe(
      '```js\nx\n```\n\n# Title',
    );
    expect(convertBlockSyntax(value, { hasCodeBlocks: true, hasHeadings: false })).toBe(
      '```js\nx\n```\n\nTitle\n===',
    );
    expect(convertBlockSyntax(value, { hasCodeBlocks: false, hasHeadings: true })).toBe(
      '~~~js\nx\n~~~\n\n# Title',
    );
    expect(convertBlockSyntax(value, { hasCodeBlocks: false, hasHeadings: false })).toBe(value);
  });
});

describe('toLexicalMarkdown', () => {
  it('should split multiline formatting and pad blank blockquote lines', () => {
    expect(toLexicalMarkdown('**a\nb**\n\n> c\n>\n> d')).toEqual({
      markdown: '**a**\n**b**\n\n> c\n> \n> d',
      hasPlaceholders: false,
    });
  });

  it('should tell if any placeholder has been added', () => {
    expect(toLexicalMarkdown('<div>\na\n</div>')).toEqual({
      markdown: ['<div>', 'a', '</div>']
        .map((line) => `${HTML_BLOCK_PLACEHOLDER}${line}`)
        .join('\n'),
      hasPlaceholders: true,
    });
  });
});
