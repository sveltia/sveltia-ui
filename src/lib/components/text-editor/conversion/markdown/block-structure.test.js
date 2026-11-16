import { describe, expect, it } from 'vitest';
import {
  endsParagraph,
  findHtmlBlockLines,
  interruptsParagraph,
  isParagraphLine,
} from './block-structure.js';

describe('isParagraphLine', () => {
  it('should only match paragraph text', () => {
    expect(isParagraphLine('a')).toBe(true);
    ['', '  ', '- a', '# a', '> a', '| a |', '    a', '***', '==='].forEach((line) => {
      expect(isParagraphLine(line)).toBe(false);
    });
  });
});

describe('endsParagraph', () => {
  it('should match a blank line or a block on its own', () => {
    ['', ' \t', '# a', '***', '- - -'].forEach((line) => {
      expect(endsParagraph(line)).toBe(true);
    });
    ['a', '- a', '> a', '| a |'].forEach((line) => {
      expect(endsParagraph(line)).toBe(false);
    });
  });
});

describe('interruptsParagraph', () => {
  it('should match a blank line or the start of another block, but not an indented line', () => {
    ['', '- a', '1. a', '# a', '> a', '| a |', '```', '<div>', '***', '==='].forEach((line) => {
      expect(interruptsParagraph(line)).toBe(true);
    });
    ['a', '    a', '\ta', '<span>'].forEach((line) => {
      expect(interruptsParagraph(line)).toBe(false);
    });
  });
});

describe('findHtmlBlockLines', () => {
  it('should find an HTML block that ends with a blank line', () => {
    expect(findHtmlBlockLines(['<div>', '`a', '', 'b'])).toEqual([true, true, false, false]);
  });

  it('should find an HTML block that ends with its end condition, across blank lines', () => {
    expect(findHtmlBlockLines(['<pre>', '', 'a', '</pre>', 'b'])).toEqual([
      true,
      true,
      true,
      true,
      false,
    ]);
    expect(findHtmlBlockLines(['<!-- a', '', '-->', 'b'])).toEqual([true, true, true, false]);
  });

  it('should only start an HTML block with a standalone tag outside a paragraph', () => {
    expect(findHtmlBlockLines(['a', '<span>', 'b'])).toEqual([false, false, false]);
    expect(findHtmlBlockLines(['<span>', 'b'])).toEqual([true, true]);
    expect(findHtmlBlockLines(['# a', '<span>'])).toEqual([false, true]);
  });
});
