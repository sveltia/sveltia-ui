import {
  $createParagraphNode as createParagraphNode,
  $createTextNode as createTextNode,
  $getRoot as getRoot,
  createEditor,
} from 'lexical';
import { describe, expect, it } from 'vitest';

import {
  getImportedRawSyntax,
  getRawSyntax,
  INLINE_HTML_REGEX,
  RAW_HTML,
  RAW_SYNTAX,
} from './raw-syntax.js';

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

describe('RAW_HTML', () => {
  /**
   * Get the text matched as raw HTML in the given text.
   * @param {string} text Text.
   * @returns {string | undefined} Matched text.
   */
  const matchHtml = (text) => text.match(/** @type {RegExp} */ (RAW_HTML.importRegExp))?.[0];

  it('is an import-only text match transformer', () => {
    expect(RAW_HTML.type).toBe('text-match');
    expect(RAW_HTML.regExp.test('<b>')).toBe(false);
    expect(
      RAW_HTML.export?.(
        /** @type {any} */ ({}),
        () => '',
        () => '',
      ),
    ).toBeNull();
  });

  it('matches a line of an HTML block', () => {
    expect(matchHtml('\uE007a *b* <c>')).toBe('a *b* <c>');
    // The placeholder is included before a formatting marker, so the line isn’t read as formatting
    expect(matchHtml('\uE007*a* <b>')).toBe('\uE007*a* <b>');
    expect(matchHtml('*a* \uE007<b>')).toBe('<b>');
  });

  it('matches an autolink', () => {
    expect(matchHtml('a <https://e.com/x?a=1&b=2> b')).toBe('<https://e.com/x?a=1&b=2>');
    expect(matchHtml('a <foo.bar@e.co> b')).toBe('<foo.bar@e.co>');
    // A script or embedded content is escaped as text instead
    expect(
      matchHtml('a <javascript:alert(1)> <JavaScript:x> <data:text/html,x> b'),
    ).toBeUndefined();
    expect(matchHtml('a \\<https://e.com> <a@>')).toBeUndefined();
  });

  it('matches a footnote reference', () => {
    expect(matchHtml('a note[^1] b')).toBe('[^1]');
    expect(matchHtml('a \\[^1] [^ b] c')).toBeUndefined();
  });

  it('matches inline HTML', () => {
    expect(matchHtml('a <img src="/_a.png" alt=\'b\' data-x=y_z hidden /> c')).toBe(
      '<img src="/_a.png" alt=\'b\' data-x=y_z hidden />',
    );
    expect(matchHtml('a </span > b')).toBe('</span >');
    expect(matchHtml('a <i\uE005title="x"> b')).toBe('<i\uE005title="x">');
    expect(matchHtml('<!-- a_b --> <!--> <!--->')).toBe('<!-- a_b -->');
    expect(matchHtml('<!--> a')).toBe('<!-->');
    expect(matchHtml('<?php echo 1; ?>')).toBe('<?php echo 1; ?>');
    expect(matchHtml('<!DOCTYPE html>')).toBe('<!DOCTYPE html>');
    expect(matchHtml('<![CDATA[ a_b ]]>')).toBe('<![CDATA[ a_b ]]>');
  });

  it('doesn’t match text that only looks like HTML', () => {
    expect(matchHtml('a < b > c')).toBeUndefined();
    expect(matchHtml('<https://example.com x>')).toBeUndefined();
    expect(matchHtml('<a title="x>')).toBeUndefined();
    expect(INLINE_HTML_REGEX.test('<1a>')).toBe(false);
  });

  it('marks the node as raw syntax, which isn’t merged into the text before it', () => {
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
        const plain = createTextNode('a ');
        const raw = createTextNode('<b title="\\_">');

        RAW_HTML.replace?.(raw, /** @type {any} */ ([]));
        raw.setTextContent('<b title="_">');
        getRoot().append(createParagraphNode().append(plain, raw));

        expect(getImportedRawSyntax(raw)).toBe('<b title="\\_">');
        expect(getImportedRawSyntax(plain)).toBeUndefined();
        expect(getRawSyntax(raw)).toBe('<b title="_">');
      },
      { discrete: true },
    );

    // Lexical normalizes the text nodes when the update is committed
    editor.read(() => {
      expect(
        getRoot()
          .getAllTextNodes()
          .map((node) => [node.getTextContent(), getRawSyntax(node)]),
      ).toEqual([
        ['a ', undefined],
        ['<b title="_">', '<b title="_">'],
      ]);
    });
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
