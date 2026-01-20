import { describe, expect, it } from 'vitest';
import {
  fixMarkdownFormatting,
  increaseListIndentation,
  splitMultilineFormatting,
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

describe('fixMarkdownFormatting', () => {
  it('should fix unclosed bold markers with space in between', () => {
    expect(fixMarkdownFormatting('**foo **bar')).toBe('**foo** bar');
  });

  it('should fix unclosed italic markers with space in between', () => {
    expect(fixMarkdownFormatting('_foo _bar')).toBe('_foo_ bar');
  });

  it('should fix multiple bold markers', () => {
    expect(fixMarkdownFormatting('**foo **bar **baz **qux')).toBe('**foo** bar **baz** qux');
  });

  it('should fix multiple italic markers', () => {
    expect(fixMarkdownFormatting('_foo _bar _baz _qux')).toBe('_foo_ bar _baz_ qux');
  });

  it('should fix mixed bold and italic markers', () => {
    expect(fixMarkdownFormatting('**foo **bar _baz _qux')).toBe('**foo** bar _baz_ qux');
  });

  it('should not affect properly closed bold markers', () => {
    expect(fixMarkdownFormatting('**foo** bar')).toBe('**foo** bar');
  });

  it('should not affect properly closed italic markers', () => {
    expect(fixMarkdownFormatting('_foo_ bar')).toBe('_foo_ bar');
  });

  it('should preserve other formatting', () => {
    expect(fixMarkdownFormatting('~~strikethrough~~ **bold** _italic_')).toBe(
      '~~strikethrough~~ **bold** _italic_',
    );
  });

  it('should handle bold and italic in combination', () => {
    expect(fixMarkdownFormatting('**foo **bar _baz _qux **test **end')).toBe(
      '**foo** bar _baz_ qux **test** end',
    );
  });

  it('should handle markers at the start of a line', () => {
    expect(fixMarkdownFormatting('**foo **bar\n_baz _qux')).toBe('**foo** bar\n_baz_ qux');
  });

  it('should handle markers at the end of a line', () => {
    expect(fixMarkdownFormatting('line 1 **foo **bar\nline 2 _baz _qux')).toBe(
      'line 1 **foo** bar\nline 2 _baz_ qux',
    );
  });

  it('should work with global flag for multiple occurrences', () => {
    expect(fixMarkdownFormatting('**a **b **c **d _e _f')).toBe('**a** b **c** d _e_ f');
  });

  it('should not break when markers are not present', () => {
    expect(fixMarkdownFormatting('regular text without formatting')).toBe(
      'regular text without formatting',
    );
  });

  it('should handle edge case with only formatting markers', () => {
    expect(fixMarkdownFormatting('**foo **')).toBe('**foo** ');
  });

  it('should handle underscores in words (not formatting)', () => {
    expect(fixMarkdownFormatting('snake_case_variable **foo **bar')).toBe(
      'snake_case_variable **foo** bar',
    );
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
});
