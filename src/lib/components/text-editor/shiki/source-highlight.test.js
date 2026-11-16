import { describe, expect, it } from 'vitest';
import { getCodeFenceLanguages, MAX_HIGHLIGHT_LENGTH } from './source-highlight.svelte.js';

describe('getCodeFenceLanguages', () => {
  it('gets the unique languages of the fenced code blocks in order', () => {
    const source = [
      '```js',
      'a',
      '```',
      '  ~~~ c++',
      'b',
      '~~~',
      '```',
      'plain',
      '```',
      '```js',
      'c',
      '```',
      '```objective-c#',
    ].join('\n');

    expect(getCodeFenceLanguages(source)).toEqual(['js', 'c++', 'objective-c#']);
  });

  it('gets nothing from a source without fenced code blocks', () => {
    expect(getCodeFenceLanguages('Text with `code`')).toEqual([]);
  });
});

it('limits the length of the source to highlight', () => {
  expect(MAX_HIGHLIGHT_LENGTH).toBe(20_000);
});
