import { describe, expect, it } from 'vitest';
import { increaseListIndentation, splitMultilineFormatting } from './markdown.js';

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
});
