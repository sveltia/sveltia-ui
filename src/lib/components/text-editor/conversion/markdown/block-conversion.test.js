import { describe, expect, it } from 'vitest';
import { expectLinearTime } from '../../../../test-utils/complexity.js';
import { INFO_BACKTICK } from '../placeholder-chars.js';
import {
  convertSetextHeadings,
  convertTildeFences,
  padBlankBlockquoteLines,
  trimBlankBlockquoteLines,
} from './block-conversion.js';

describe('padBlankBlockquoteLines', () => {
  it('should add a trailing space to a blank blockquote line', () => {
    expect(padBlankBlockquoteLines('> "A quotation."\n>\n> **Attribution**, Title')).toBe(
      '> "A quotation."\n> \n> **Attribution**, Title',
    );
  });

  it('should pad every blank blockquote line', () => {
    expect(padBlankBlockquoteLines('> a\n>\n>\n> b\n\ntext\n\n>\n> c')).toBe(
      '> a\n> \n> \n> b\n\ntext\n\n> \n> c',
    );
  });

  it('should not affect blockquote lines that already have content or a trailing space', () => {
    expect(padBlankBlockquoteLines('> a\n> \n> >\n> b')).toBe('> a\n> \n> >\n> b');
  });

  it('should not affect a `>` that is not at the start of a line', () => {
    expect(padBlankBlockquoteLines('a > b\n >')).toBe('a > b\n >');
  });

  it('should return unchanged string if there is no blank blockquote line', () => {
    expect(padBlankBlockquoteLines('> a\n> b')).toBe('> a\n> b');
  });

  it('should not modify lines inside a fenced code block', () => {
    expect(padBlankBlockquoteLines('>\n```\n>\n```\n>')).toBe('> \n```\n>\n```\n> ');
    expect(padBlankBlockquoteLines('~~~\n>\n~~~')).toBe('~~~\n>\n~~~');
  });

  it('should not modify lines inside an indented fenced code block', () => {
    expect(padBlankBlockquoteLines('>\n  ```\n>\n  ```\n>')).toBe('> \n  ```\n>\n  ```\n> ');
  });

  it('should not modify lines inside a tilde fenced code block', () => {
    expect(padBlankBlockquoteLines('>\n~~~\n>\n~~~\n>')).toBe('> \n~~~\n>\n~~~\n> ');
  });

  it('should handle multiple fenced code blocks', () => {
    expect(padBlankBlockquoteLines('>\n```\n>\n```\n>\n```\n>\n```\n>')).toBe(
      '> \n```\n>\n```\n> \n```\n>\n```\n> ',
    );
  });

  it('should not end a code block at a shorter or different fence within it', () => {
    expect(padBlankBlockquoteLines('````\n```\n>\n~~~\n>\n````\n>')).toBe(
      '````\n```\n>\n~~~\n>\n````\n> ',
    );
  });

  it('should not end a code block at a fence followed by an info string', () => {
    expect(padBlankBlockquoteLines('```\n```js\n>\n```\n>')).toBe('```\n```js\n>\n```\n> ');
  });
});

describe('trimBlankBlockquoteLines', () => {
  it('should remove the trailing space from a blank blockquote line', () => {
    expect(trimBlankBlockquoteLines('> "A quotation."\n> \n> **Attribution**, Title')).toBe(
      '> "A quotation."\n>\n> **Attribution**, Title',
    );
  });

  it('should trim every blank blockquote line', () => {
    expect(trimBlankBlockquoteLines('> a\n> \n> \n> b\n\ntext\n\n> \n> c')).toBe(
      '> a\n>\n>\n> b\n\ntext\n\n>\n> c',
    );
  });

  it('should not affect blockquote lines with content', () => {
    expect(trimBlankBlockquoteLines('> a \n> >\n> b')).toBe('> a \n> >\n> b');
  });

  it('should return unchanged string if there is no blank blockquote line', () => {
    expect(trimBlankBlockquoteLines('> a\n> b')).toBe('> a\n> b');
  });

  it('should not modify lines inside a fenced code block', () => {
    expect(trimBlankBlockquoteLines('> \n```\n> \n```\n> ')).toBe('>\n```\n> \n```\n>');
  });
});

describe('convertTildeFences', () => {
  it('should leave a value without tilde fences as is', () => {
    expect(convertTildeFences('```js\ncode\n```\n\n~~strike~~')).toBe(
      '```js\ncode\n```\n\n~~strike~~',
    );
  });

  it('should convert tilde fences to backtick fences', () => {
    expect(convertTildeFences('a\n\n~~~py\nprint(1)\n~~~\n\nb\n\n  ~~~~\n  x\n  ~~~~~')).toBe(
      'a\n\n```py\nprint(1)\n```\n\nb\n\n  ```\n  x\n  ```',
    );
  });

  it('should make the fence longer than the backtick fences in the code', () => {
    expect(convertTildeFences('~~~md\n```js\ncode\n```\n  ````\n~~~')).toBe(
      '`````md\n```js\ncode\n```\n  ````\n`````',
    );
  });

  it('should convert the opening fence of an unclosed code block', () => {
    expect(convertTildeFences('~~~\ncode\n~~')).toBe('```\ncode\n~~');
  });

  it('should replace backticks after the language in the info string with a placeholder', () => {
    expect(convertTildeFences('~~~js `a`\ncode\n~~~')).toBe(
      `\`\`\`js ${INFO_BACKTICK}a${INFO_BACKTICK}\ncode\n\`\`\``,
    );
  });

  it('should remove backticks from an info string without a language', () => {
    expect(convertTildeFences('~~~`js`\ncode\n~~~')).toBe('```js\ncode\n```');
  });

  it('should leave a code block in a list item alone', () => {
    expect(convertTildeFences('- ~~~\n  x\n  ~~~')).toBe('- ~~~\n  x\n  ~~~');
  });

  it('should leave a tilde fence within a backtick code block alone', () => {
    expect(convertTildeFences('```\n~~~\ncode\n~~~\n```')).toBe('```\n~~~\ncode\n~~~\n```');
  });

  it('should not close a code block with a shorter or a different fence', () => {
    expect(convertTildeFences('~~~~\n~~~\n```\n~~~~')).toBe('````\n~~~\n```\n````');
  });
});

describe('convertSetextHeadings', () => {
  it('should leave a value without underlines as is', () => {
    expect(convertSetextHeadings('# Title\n\nText')).toBe('# Title\n\nText');
  });

  it('should convert a setext heading starting with inline HTML, but not after an HTML block', () => {
    expect(convertSetextHeadings('<span>Title</span>\n=====')).toBe('# <span>Title</span>');
    expect(convertSetextHeadings('Intro\n\n<div>\nx\n</div>\n---')).toBe(
      'Intro\n\n<div>\nx\n</div>\n---',
    );
  });

  it('should convert setext headings to ATX headings', () => {
    expect(convertSetextHeadings('Title\n=====\n\nSub  \n---\n\nText')).toBe(
      '# Title\n\n## Sub\n\nText',
    );
  });

  it('should join the lines of a multiline heading', () => {
    expect(convertSetextHeadings('Long\n title\n===')).toBe('# Long title');
  });

  it('should convert a heading after an ATX heading or a code block', () => {
    expect(convertSetextHeadings('# A\nB\n---\n```\ncode\n```\nC\n===')).toBe(
      '# A\n## B\n```\ncode\n```\n# C',
    );
  });

  it('should leave a horizontal rule after a blank line or another block as is', () => {
    expect(convertSetextHeadings('Text\n\n---\n\n- item\n---\n\n> quote\n---\n\n===')).toBe(
      'Text\n\n---\n\n- item\n---\n\n> quote\n---\n\n===',
    );
  });

  it('should leave a paragraph after a block other than a heading as is', () => {
    expect(convertSetextHeadings('- item\nlazy\n---\n\n| a |\nb\n===')).toBe(
      '- item\nlazy\n---\n\n| a |\nb\n===',
    );
  });

  it('should leave a block like front matter as is', () => {
    expect(convertSetextHeadings('Text\n\n---\ntitle: x\n---\n\nMore')).toBe(
      'Text\n\n---\ntitle: x\n---\n\nMore',
    );
  });

  it('should leave the lines in a code block alone', () => {
    expect(convertSetextHeadings('```\nTitle\n===\n```\n~~~\nSub\n---\n~~~')).toBe(
      '```\nTitle\n===\n```\n~~~\nSub\n---\n~~~',
    );
  });

  it('should convert a long paragraph with many underlines in linear time', () => {
    expectLinearTime(
      (size) => `${'a\n'.repeat(size)}===\n${'b\n'.repeat(size)}---\n${'- c\n---\n'.repeat(size)}`,
      (value) => convertSetextHeadings(value),
      2000,
    );
  });
});
