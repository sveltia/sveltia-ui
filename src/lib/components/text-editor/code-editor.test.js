import { describe, expect, it } from 'vitest';
import { parseCodeBlock, toCodeBlock } from './code-editor.js';

describe('toCodeBlock', () => {
  it('should wrap code in a fence with the language', () => {
    expect(toCodeBlock('js', 'const a = 1;')).toBe('```js\nconst a = 1;\n```');
  });

  it('should keep multi-line code as is', () => {
    expect(toCodeBlock('css', 'a {\n  color: red;\n}')).toBe('```css\na {\n  color: red;\n}\n```');
  });

  it('should produce an empty block without code', () => {
    expect(toCodeBlock('plain', '')).toBe('```plain\n```');
  });
});

describe('parseCodeBlock', () => {
  it('should extract the language and the code', () => {
    expect(parseCodeBlock('```js\nconst a = 1;\n```')).toEqual({
      lang: 'js',
      code: 'const a = 1;',
    });
  });

  it('should keep line breaks within the code', () => {
    expect(parseCodeBlock('```css\na {\n  color: red;\n}\n```')).toEqual({
      lang: 'css',
      code: 'a {\n  color: red;\n}',
    });
  });

  it('should handle an empty block', () => {
    expect(parseCodeBlock('```html\n```')).toEqual({ lang: 'html', code: '' });
  });

  it('should default to plain text without a language', () => {
    expect(parseCodeBlock('```\nhello\n```')).toEqual({ lang: 'plain', code: 'hello' });
  });

  it('should return the defaults for something that is not a code block', () => {
    expect(parseCodeBlock('hello')).toEqual({ lang: 'plain', code: '' });
    expect(parseCodeBlock('')).toEqual({ lang: 'plain', code: '' });
  });

  it('should round-trip with toCodeBlock', () => {
    const code = 'line 1\n\nline 3';

    expect(parseCodeBlock(toCodeBlock('md', code))).toEqual({ lang: 'md', code });
    expect(parseCodeBlock(toCodeBlock('md', ''))).toEqual({ lang: 'md', code: '' });
  });
});
