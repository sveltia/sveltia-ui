import { CodeNode } from '@lexical/code-core';
import {
  $convertFromMarkdownString as convertFromMarkdownString,
  $convertToMarkdownString as convertToMarkdownString,
  CODE as LEXICAL_CODE,
  INLINE_CODE,
} from '@lexical/markdown';
import { createEditor } from 'lexical';
import { describe, expect, it } from 'vitest';

import { CODE, INFO_BACKTICK } from './code.js';

/**
 * Import Markdown and export it again.
 * @param {string} markdown Markdown.
 * @returns {string} Exported Markdown.
 */
const roundTrip = (markdown) => {
  const editor = createEditor({
    nodes: [CodeNode],
    /**
     * Fail the test on an editor error.
     * @param {Error} error Error.
     * @throws {Error} The same error.
     */
    onError: (error) => {
      throw error;
    },
  });

  editor.update(() => convertFromMarkdownString(markdown, [CODE, INLINE_CODE]), {
    discrete: true,
  });

  return editor.read(() => convertToMarkdownString([CODE, INLINE_CODE]));
};

describe('CODE', () => {
  it('extends Lexical’s code block transformer', () => {
    expect(CODE.replace).toBe(LEXICAL_CODE.replace);
    expect(CODE.regExpStart).not.toBe(LEXICAL_CODE.regExpStart);
  });

  it('imports a code block', () => {
    expect(roundTrip('```js\nconst a = 1;\n```')).toBe('```js\nconst a = 1;\n```');
    expect(roundTrip('````\n```\n````')).toBe('````\n```\n````');
    expect(roundTrip('a\n\n```\nb')).toBe('a\n\n```\nb\n```');
  });

  it('doesn’t take a line with a backtick after the opening fence for a code block', () => {
    // A paragraph starting with inline code that contains three backticks, as exported
    expect(roundTrip('```` ``` ```` a\nb')).toBe('```` ``` ```` a\nb');
    expect(roundTrip('``` `` ```\nb')).toBe('``` `` ```\nb');
    expect(roundTrip('```a```\nb')).toBe('`a`\nb');
  });

  it('reads the language after spaces in the info string', () => {
    expect(roundTrip('``` js\ncode\n```')).toBe('```js\ncode\n```');
    expect(roundTrip('```  js  title=x \ncode\n```')).toBe('```js title=x\ncode\n```');
    expect(roundTrip('``` js\ncode')).toBe('```js\ncode\n```');
  });

  it('keeps the metadata out of the code of a code block without a closing fence', () => {
    expect(roundTrip('```js title=x\ncode')).toBe('```js title=x\ncode\n```');
    expect(roundTrip('```js title=x\n\ncode\n')).toBe('```js title=x\n\ncode\n```');
    expect(roundTrip('a\n\n````js title=x\n```\nb')).toBe('a\n\n````js title=x\n```\nb\n````');
    expect(roundTrip('```js title=x')).toBe('```js title=x\n```');
  });

  it('keeps the text after an opening fence without a language in the code, like Lexical', () => {
    expect(roundTrip('```{.js}\ncode\n```')).toBe('```\n{.js}\ncode\n```');
  });

  it('exports a code block with a backtick in its info string with a tilde fence', () => {
    const backtick = INFO_BACKTICK;

    expect(roundTrip(`\`\`\`js ${backtick}x${backtick}\ncode\n\`\`\``)).toBe(
      '~~~js `x`\ncode\n~~~',
    );
    expect(roundTrip(`\`\`\`js ${backtick}x${backtick}\n~~~\n  ~~~~\n\`\`\``)).toBe(
      '~~~~~js `x`\n~~~\n  ~~~~\n~~~~~',
    );
    expect(roundTrip(`\`\`\`js ${backtick}\n\`\`\``)).toBe('~~~js `\n~~~');
  });
});
