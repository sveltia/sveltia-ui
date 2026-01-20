import { describe, expect, it } from 'vitest';
import { fixMarkdownFormatting } from './core.js';

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
