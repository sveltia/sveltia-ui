import {
  $createParagraphNode as createParagraphNode,
  $createTextNode as createTextNode,
  $getRoot as getRoot,
  createEditor,
} from 'lexical';
import { describe, expect, it } from 'vitest';

import { getRawSyntax, RAW_SYNTAX } from './raw-syntax.js';

/**
 * Get the text matched as raw syntax in the given text.
 * @param {string} text Text.
 * @returns {string | undefined} Matched text.
 */
const match = (text) => text.match(/** @type {RegExp} */ (RAW_SYNTAX.importRegExp))?.[0];

describe('RAW_SYNTAX', () => {
  it('is an import-only text match transformer', () => {
    expect(RAW_SYNTAX.type).toBe('text-match');
    expect(RAW_SYNTAX.regExp.test('- a')).toBe(false);
    expect(
      RAW_SYNTAX.export?.(
        /** @type {any} */ ({}),
        () => '',
        () => '',
      ),
    ).toBeNull();
  });

  it('matches the block syntax at the start of a line', () => {
    expect(match('- a')).toBe('-');
    expect(match('* a')).toBe('*');
    expect(match('> a')).toBe('>');
    expect(match('  ## a')).toBe('  ##');
    expect(match('1) a')).toBe('1)');
    expect(match('```js')).toBe('```');
    expect(match('~~~')).toBe('~~~');
    expect(match('---')).toBe('---');
    expect(match('* * *')).toBe('* * *');
    expect(match('- - -')).toBe('- - -');
  });

  it('doesn’t match the escaped block syntax or text that only starts like it', () => {
    expect(match('\\- a')).toBeUndefined();
    expect(match('-5 degrees')).toBeUndefined();
    expect(match('#hashtag')).toBeUndefined();
    expect(match('*italic*')).toBeUndefined();
  });
});

describe('getRawSyntax()', () => {
  it('returns the Markdown of a node imported from raw syntax', () => {
    const editor = createEditor({
      /**
       * Fail the test on an editor error.
       * @param {Error} error Error.
       * @throws {Error} The same error.
       */
      onError: (error) => {
        throw error;
      },
    });

    editor.update(
      () => {
        const raw = createTextNode('1)');
        const edited = createTextNode('1)');
        const plain = createTextNode('1)');

        [raw, edited].forEach((node) => {
          RAW_SYNTAX.replace?.(node, /** @type {any} */ ([]));
        });

        edited.setTextContent('2)');
        getRoot().append(createParagraphNode().append(raw, edited, plain));

        expect(getRawSyntax(raw)).toBe('1)');
        expect(getRawSyntax(edited)).toBe('2)');
        expect(getRawSyntax(plain)).toBeUndefined();
      },
      { discrete: true },
    );
  });
});
