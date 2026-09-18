import { describe, expect, it } from 'vitest';
import {
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
