import { describe, expect, it } from 'vitest';
import {
  convertSetextHeadings,
  convertTildeFences,
  increaseListIndentation,
  padBlankBlockquoteLines,
  splitMultilineFormatting,
  trimBlankBlockquoteLines,
} from './markdown.js';

describe('splitMultilineFormatting', () => {
  it('should split italic formatting across lines', () => {
    expect(splitMultilineFormatting('  _foo\nbar_  ')).toBe('  _foo_\n_bar_  ');
  });

  it('should split bold formatting across lines', () => {
    expect(splitMultilineFormatting('  **foo\nbar**  ')).toBe('  **foo**\n**bar**  ');
  });

  it('should split strikethrough formatting across lines', () => {
    expect(splitMultilineFormatting('  ~~foo\nbar~~  ')).toBe('  ~~foo~~\n~~bar~~  ');
  });

  it('should split code formatting across lines', () => {
    expect(splitMultilineFormatting('  `foo\nbar`  ')).toBe('  `foo`\n`bar`  ');
  });

  it('should handle multiple formatting types', () => {
    expect(
      splitMultilineFormatting('  _italic\ntext_   **bold\ntext**  ~~strike\nthrough~~  '),
    ).toBe('  _italic_\n_text_   **bold**\n**text**  ~~strike~~\n~~through~~  ');
  });

  it('should not affect properly formatted single-line text', () => {
    expect(splitMultilineFormatting('_italic_ **bold** ~~strike~~ `code`')).toBe(
      '_italic_ **bold** ~~strike~~ `code`',
    );
  });

  it('should only split when surrounded by whitespace', () => {
    expect(splitMultilineFormatting('_foo\nbar_')).toBe('_foo\nbar_');
  });

  it('should handle formatting at different indentation levels', () => {
    expect(splitMultilineFormatting('    _foo\nbar_    ')).toBe('    _foo_\n_bar_    ');
  });

  it('should leave formatting in fenced code blocks alone', () => {
    const code = '```md\nSome _italic\ntext_ here\n```\n~~~py\nx = 2 **a\nb** 3\n~~~';

    expect(splitMultilineFormatting(code)).toBe(code);
    expect(splitMultilineFormatting(`a _b\nc_ d\n${code}\ne _f\ng_ h`)).toBe(
      `a _b_\n_c_ d\n${code}\ne _f_\n_g_ h`,
    );
  });

  it('should leave formatting in an unclosed fenced code block alone', () => {
    expect(splitMultilineFormatting('a _b\nc_ d\n```\nx _y\nz_ w')).toBe(
      'a _b_\n_c_ d\n```\nx _y\nz_ w',
    );
  });

  it('should process a long run of whitespace in linear time', () => {
    const value = `${' \n'.repeat(100_000)}x`;
    const start = performance.now();

    expect(splitMultilineFormatting(value)).toBe(value);
    // The previous regexes took several seconds on this input
    expect(performance.now() - start).toBeLessThan(500);
  });
});

describe('increaseListIndentation', () => {
  it('should double indentation for bullet lists', () => {
    expect(increaseListIndentation('  - item')).toBe('    - item');
  });

  it('should double indentation for numbered lists', () => {
    expect(increaseListIndentation('  1. item')).toBe('    1. item');
  });

  it('should handle different list markers', () => {
    expect(increaseListIndentation('  - a\n  + b\n  * c')).toBe('    - a\n    + b\n    * c');
  });

  it('should double different indentation levels', () => {
    expect(increaseListIndentation('  - level 1\n    - level 2')).toBe(
      '    - level 1\n        - level 2',
    );
  });

  it('should not affect non-list content', () => {
    expect(increaseListIndentation('regular text')).toBe('regular text');
  });

  it('should not affect lists without preceding spaces', () => {
    expect(increaseListIndentation('- item')).toBe('- item');
  });

  it('should handle mixed content', () => {
    expect(increaseListIndentation('paragraph\n  - item\nmore text')).toBe(
      'paragraph\n    - item\nmore text',
    );
  });

  it('should handle lists with various indentation levels', () => {
    expect(increaseListIndentation('  - a\n      - b\n          - c')).toBe(
      '    - a\n            - b\n                    - c',
    );
  });

  it('should return unchanged string if no matching lists', () => {
    expect(increaseListIndentation('paragraph with - no list')).toBe('paragraph with - no list');
  });

  it('should not modify list items inside a backtick fenced code block', () => {
    const input = '  - before\n```\n  - inside code\n    - nested\n```\n  - after';
    const expected = '    - before\n```\n  - inside code\n    - nested\n```\n    - after';

    expect(increaseListIndentation(input)).toBe(expected);
  });

  it('should not modify list items inside a tilde fenced code block', () => {
    const input = '  - before\n~~~\n  - inside code\n~~~\n  - after';
    const expected = '    - before\n~~~\n  - inside code\n~~~\n    - after';

    expect(increaseListIndentation(input)).toBe(expected);
  });

  it('should handle multiple fenced code blocks', () => {
    const input = '  - a\n```\n  - x\n```\n  - b\n```\n  - y\n```\n  - c';
    const expected = '    - a\n```\n  - x\n```\n    - b\n```\n  - y\n```\n    - c';

    expect(increaseListIndentation(input)).toBe(expected);
  });

  it('should not end a code block at a shorter or different fence within it', () => {
    const input = '````\n```\n  - inside code\n~~~\n  - inside code\n````\n  - after';
    const expected = '````\n```\n  - inside code\n~~~\n  - inside code\n````\n    - after';

    expect(increaseListIndentation(input)).toBe(expected);
  });

  it('should not end a code block at a fence followed by an info string', () => {
    const input = '```\n```js\n  - inside code\n```\n  - after';
    const expected = '```\n```js\n  - inside code\n```\n    - after';

    expect(increaseListIndentation(input)).toBe(expected);
  });

  it('should not modify list items inside an indented fenced code block', () => {
    const input = '  - before\n  ```\n  - inside code\n  ```\n  - after';
    const expected = '    - before\n  ```\n  - inside code\n  ```\n    - after';

    expect(increaseListIndentation(input)).toBe(expected);
  });
});

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
});
